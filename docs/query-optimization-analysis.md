# 初回ロード時のクエリ増加原因分析と修正方針

## 調査日時
2025年10月24日

## 問題の概要
初回ロード時に `events` コレクションへのクエリが **15回** 発行されており、期待値の 3~5 回を大幅に超過している。

## 原因分析

### 1. 重複する `loadData` 呼び出し

#### composables/useCalendar.ts（行 300-301）
```typescript
onMounted(loadData);
watch([currentDate, currentView], loadData, { deep: true });
```

#### pages/calendar/index.vue（行 467）
```typescript
onMounted(async () => {
  // ... (ビュー復元処理)
  await loadData();  // ★ 重複呼び出し
  // ...
});
```

**問題点：**
- composable 側で既に `onMounted(loadData)` が定義されている
- ページ側で再度 `onMounted` 内で `loadData()` を呼んでいる
- **初回マウント時に最低 2 回の `loadData` 呼び出しが発生**

### 2. 重複する watch 定義

#### composables/useCalendar.ts（行 301）
```typescript
watch([currentDate, currentView], loadData, { deep: true });
```

#### pages/calendar/index.vue（行 502, 514）
```typescript
watch(currentDate, async () => {
  await updateCurrentDayEvents();  // ★ 独立した watch
});

watch(currentView, async (newView) => {
  selectedDayEvents.value = [];
  selectedUser.value = undefined;
  await updateCurrentDayEvents();  // ★ 独立した watch
  saveViewToStorage(newView);
});
```

**問題点：**
- `currentDate` と `currentView` の変更に対して composable 側と page 側で **二重に watch** している
- ビュー切り替え時やナビゲーション時に複数回データ取得が走る可能性

### 3. events watch からの再取得

#### pages/calendar/index.vue（行 495-500）
```typescript
watch(events, () => {
  updateCurrentDayEvents();
  updateSelectedDayEvents();
}, { deep: true });
```

**問題点：**
- `events` が変更されるたびに `updateCurrentDayEvents` が走る
- `loadData` が `events.value = eventsData` で更新するため、この watch がトリガーされる
- 無限ループは防がれているが、不要な再計算が発生する可能性

### 4. 初回ロード時のトリガーチェーン

実際の初回ロード時の呼び出しフロー：

```
1. composable の onMounted(loadData)  →  getEventsInRange (1回目)
2. page の onMounted → loadData()     →  getEventsInRange (2回目)
3. page の onMounted → setView(savedView) で currentView 変更
   → composable の watch がトリガー  →  getEventsInRange (3回目)
4. currentView 変更が page 側の watch もトリガー
   → updateCurrentDayEvents          →  getEventsInRange (4回目?)
5. events 更新が events watch をトリガー
   → updateCurrentDayEvents          →  追加取得
6. 月間・週間ビューの両方がマウントされている場合
   → 各ビューコンポーネントでも追加取得の可能性
```

**結果：15回のクエリ**

## 修正方針

### 修正案1: composable 側の onMounted を削除（推奨）

**変更箇所：** `composables/useCalendar.ts`

```typescript
// onMounted(loadData); // ← 削除（ページ側で明示的に呼ぶ）
watch([currentDate, currentView], loadData, { deep: true });
```

**理由：**
- ページ側で初期化タイミングを制御できる
- 保存されたビュー復元など、初期化前の準備処理を確実に実行できる
- composable は watch のみを提供し、初回ロードはページ側の責任とする

### 修正案2: ページ側の重複 watch を削除

**変更箇所：** `pages/calendar/index.vue`

```typescript
// 削除: currentDate の watch（composable 側で対応済み）
// watch(currentDate, async () => {
//   await updateCurrentDayEvents();
// });

// 修正: currentView の watch（localStorage 保存のみ残す）
watch(currentView, async (newView) => {
  saveViewToStorage(newView);
  // updateCurrentDayEvents() は composable の watch で実行されるため削除
});
```

**理由：**
- `currentDate` と `currentView` の変更は composable の watch で `loadData` が呼ばれる
- ページ側では localStorage への保存など、UI 固有の処理のみ行う

### 修正案3: events watch の最適化

**変更箇所：** `pages/calendar/index.vue`

```typescript
// 修正: events watch を削除または条件付きに
// events が loadData で更新された時点で最新データになっているため
// 追加の updateCurrentDayEvents は不要

// 削除候補
// watch(events, () => {
//   updateCurrentDayEvents();
//   updateSelectedDayEvents();
// }, { deep: true });
```

**理由：**
- `loadData` 完了時点で `events.value` は最新
- `currentDayEvents` や `selectedDayEvents` は computed または getter 関数で events から計算すべき
- watch による再取得は不要

### 修正案4: isLoading フラグによる重複防止

**変更箇所：** `composables/useCalendar.ts`

```typescript
const loadData = async () => {
  if (isLoading.value) {
    console.log('[loadData] Already loading, skipping duplicate call');
    return; // ★ 既にロード中なら早期リターン
  }
  isLoading.value = true;
  try {
    // ... existing code
  } finally {
    isLoading.value = false;
  }
};
```

**理由：**
- 複数の watch が同時にトリガーされても、実際のロード処理は1回のみ
- 簡単な防御策として有効

## 実装優先順位

### Phase 1（即効性高・リスク低）
1. **修正案4**: `loadData` に `isLoading` チェックを追加（防御的プログラミング）
2. **修正案1**: composable の `onMounted(loadData)` を削除

### Phase 2（構造改善）
3. **修正案2**: ページ側の重複 watch を整理
4. **修正案3**: events watch を削除または computed に置き換え

### Phase 3（検証）
5. ブラウザで初回ロードを実行し、profiler で events クエリ回数を確認
6. 期待値: **3~5回**（single, range, instances の各クエリ + recurrence rules）
7. 週ナビゲーション: **3~4回**（既に達成済み）

## 期待される効果

- **初回ロード**: 15回 → **3~5回**（約 70% 削減）
- **週ナビゲーション**: 4回（現状維持）
- **月ナビゲーション**: 同様に改善見込み

## 補足: 構造的な改善案（長期）

### A. currentDayEvents を computed に変更

```typescript
const currentDayEvents = computed(() => {
  if (currentView.value !== 'daily') return [];
  return getSchedulesForDay(currentDate.value);
});
```

**メリット：**
- watch 不要
- events が変更されれば自動的に再計算
- コードがシンプルになる

### B. イベント取得の中央集約

現在の `updateCurrentDayEvents` や `updateSelectedDayEvents` は独立した async 関数ですが、実際には `getSchedulesForDay` を呼んでいるだけ（既にメモリ上の events をフィルタリング）。

```typescript
// 不要な async 関数を削除
const currentDayEvents = computed(() => getSchedulesForDay(currentDate.value));
const selectedDayEvents = computed(() => 
  selectedDate.value ? getSchedulesForDay(selectedDate.value) : []
);
```

**メリット：**
- watch 不要
- Firestore クエリは `loadData` のみで実行
- データフローが単純明快

## まとめ

初回ロード時の15回クエリは、**composable とページ側での重複した `onMounted` と `watch` の定義**が主原因。

**即効性の高い修正**:
1. `loadData` に `isLoading` チェックを追加（重複呼び出し防止）
2. composable の `onMounted(loadData)` を削除
3. ページ側の重複 watch を整理

これにより、初回ロード時のクエリ回数を **3~5回** に削減できる見込み。
