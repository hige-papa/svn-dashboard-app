# 初回ロードパフォーマンス分析結果

## 分析日時
2025年10月24日

## ログ概要
- **events クエリ**: 18回
- **event_instances クエリ**: 6回
- **loadData 完了**: 6回

## 問題の特定

### 1. 修正後も events クエリが多い（18回）

**期待値**: 初回ロード 1回 × 4クエリ（single + range + instances + master lookup）= 約4~5回  
**実測値**: 18回（events のみ）

### 2. loadData が6回実行されている

ログから以下の流れが確認できます：

```
1. 初回ロード開始
   - Cache Miss: dailyOptions:2025-09-28:2025-11-08
   - Cache Miss: users
   - Cache Miss: holidays
   - [loadData] Already loading, skipping duplicate call  ← ★ 重複呼び出しを防止した
   - Cache Miss: dailyOptions:2025-10-20:2025-10-26

2. WeeklyCalendarView がマウント (18:35:24)
   - initial props.events.length = 0  ← まだデータ未ロード

3. equipment と facility のクエリ完了
   - [Profiling] equipment=1 のみ（200ms）

4. 以降、6回の loadData 完了ログ
   - それぞれで events クエリが複数回発行
```

### 3. 複数の日付範囲で dailyOptions キャッシュミス

```
Cache Miss: dailyOptions:2025-09-28:2025-11-08  (月間ビュー範囲?)
Cache Miss: dailyOptions:2025-10-20:2025-10-26  (週間ビュー範囲)
Cache Miss: dailyOptions:2025-10-13:2025-10-19  (前の週?)
Cache Miss: dailyOptions:2025-10-24:2025-10-24  (日次ビュー?)
```

**問題点**: 異なるビューや日付範囲ごとに **別々に loadData が実行**されている可能性

## 根本原因分析

### 原因1: 複数のビューコンポーネントが同時にマウントされている

ログから推測される流れ：

1. ページ初期化時に `currentView` がデフォルト値（'monthly'?）でスタート
2. `onMounted` で保存されたビュー（'weekly'?）を復元
3. **月間ビュー用の範囲で loadData（2025-09-28 ~ 2025-11-08）**
4. ビュー切り替えで **週間ビュー用の範囲で loadData（2025-10-20 ~ 2025-10-26）**
5. その後、ナビゲーション操作で複数回 loadData

### 原因2: ビュー切り替え時の watch トリガー

```typescript
// pages/calendar/index.vue の onMounted
const savedView = loadViewFromStorage();
if (savedView !== currentView.value) {
  currentView.value = savedView; // ★ これが watch をトリガー
}
await loadData(); // ★ さらに明示的に loadData
```

**問題**: 
- `currentView.value = savedView` が composable の `watch([currentDate, currentView], loadData)` をトリガー
- その直後に明示的な `await loadData()` を実行
- `isLoading` チェックで2回目は防止されているが、**ビュー範囲が異なる**ため別のクエリが発行される

### 原因3: 複数の日付範囲に対するイベント取得

週間ビューを開いた際のログ：
```
1. 2025-09-28 ~ 2025-11-08 の範囲（月間？）
2. 2025-10-20 ~ 2025-10-26 の範囲（週間）
3. 2025-10-13 ~ 2025-10-19 の範囲（前週？ナビゲーション）
4. 2025-10-24 の範囲（日次？）
```

**各範囲で3回の events クエリ**:
- single events の date 範囲クエリ
- range events の startDate クエリ
- master events の取得（recurring instances 用）

計算: **6 範囲 × 3 クエリ = 18 events クエリ**

## 実際の問題

### 問題点A: デフォルトビューと保存ビューの不一致

```typescript
// composables/useCalendar.ts
const currentView = ref<CalendarView>('monthly'); // ★ デフォルトが 'monthly'

// pages/calendar/index.vue
const savedView = loadViewFromStorage(); // 'weekly' を返す
if (savedView !== currentView.value) {
  currentView.value = savedView; // ★ 'monthly' → 'weekly' で watch トリガー
}
await loadData(); // ★ すでに週間ビュー範囲でロード中 or 完了済み
```

**結果**:
1. composable が 'monthly' で初期化 → 月間範囲を計算
2. ページが 'weekly' に変更 → watch がトリガー、週間範囲で loadData
3. `isLoading` チェックで重複は防止されるが、**1つ目の loadData は月間範囲**、**2つ目は週間範囲**で実行される可能性

### 問題点B: WeeklyCalendarView のマウントタイミング

```
WeeklyCalendarView mounted at 18:35:24
initial props.events.length = 0  ← まだイベントデータなし
```

**問題**: コンポーネントがマウントされた時点で props が空 → その後データロードで更新

**理想**: ページの `onMounted` で `loadData` 完了後にビューをマウントすべき

### 問題点C: ナビゲーション操作による追加ロード

初回ロード後に複数回の loadData が実行されている：
- 週移動（前週、次週）
- ビュー切り替え（月間 ↔ 週間 ↔ 日次）

これ自体は正常な動作だが、**初回ロード時点で既に6回実行**されているのは異常。

## 解決策

### 修正案1: デフォルトビューを保存ビューと一致させる（即効性高）

**変更箇所**: `composables/useCalendar.ts`

```typescript
// 初期値を決定する関数（ページ側から注入）
export const useCalendar = (initialView?: CalendarView) => {
  const currentView = ref<CalendarView>(initialView || 'monthly');
  // ... rest
};
```

**pages/calendar/index.vue**:
```typescript
const savedView = loadViewFromStorage();
const { 
  currentView, 
  loadData, 
  // ... 
} = useCalendar(savedView); // ★ 初期ビューを渡す

onMounted(async () => {
  // ビュー設定は不要（既に初期化済み）
  
  // 初期表示時にデータを読み込む
  await loadData();
  
  // ... rest
});
```

**効果**: 
- ビュー切り替えによる watch トリガーを回避
- 初回 loadData が正しい範囲（週間）で1回のみ実行

### 修正案2: onMounted 内のビュー設定を watch トリガー前に実行

**変更箇所**: `pages/calendar/index.vue`

現在の実装:
```typescript
onMounted(async () => {
  const savedView = loadViewFromStorage();
  if (savedView !== currentView.value) {
    currentView.value = savedView; // ★ watch トリガー
  }
  await loadData(); // ★ 重複
});
```

**問題**: `currentView.value = savedView` が即座に watch をトリガーし、非同期で loadData が開始される。その後に `await loadData()` を実行するため、`isLoading` チェックで2回目がスキップされる。

**しかし**、1回目の loadData がまだ **月間ビュー範囲**で実行中の可能性がある（ref の更新タイミング）。

**修正後**:
```typescript
onMounted(async () => {
  // ビュー復元を loadData の前に完了させる
  const savedView = loadViewFromStorage();
  currentView.value = savedView; // 直接設定（watch は動くが loadData 前）
  
  // watch による loadData を待つ（または明示的に1回だけ呼ぶ）
  await loadData(); // これが実行される時点で currentView は正しい値
});
```

**問題**: watch と明示的な loadData が競合する可能性は残る。

### 修正案3: watch を一時的に無効化してから初期化（推奨）

**変更箇所**: `composables/useCalendar.ts`

```typescript
// watch を後から有効化できるようにする
const enableWatchers = () => {
  watch([currentDate, currentView], loadData, { deep: true });
};

return {
  // ... existing
  enableWatchers, // ★ 公開
};
```

**pages/calendar/index.vue**:
```typescript
const { enableWatchers, currentView, loadData, ... } = useCalendar();

onMounted(async () => {
  // watch 有効化前にビューを設定
  const savedView = loadViewFromStorage();
  currentView.value = savedView;
  
  // 初回ロード
  await loadData();
  
  // この時点で watch を有効化
  enableWatchers();
  
  // ... rest
});
```

**効果**:
- 初期化時の watch トリガーを完全回避
- 初回 loadData が1回のみ、正しいビュー範囲で実行
- その後のナビゲーションは watch で自動処理

### 修正案4: composable 内の watch を即座に有効化しない（最も安全）

**変更箇所**: `composables/useCalendar.ts`

```typescript
export const useCalendar = (options?: { autoWatch?: boolean }) => {
  // ... existing code
  
  // Lifecycle and Watchers
  if (options?.autoWatch !== false) {
    watch([currentDate, currentView], loadData, { deep: true });
  }
  
  return {
    // ... existing
    startWatching: () => watch([currentDate, currentView], loadData, { deep: true }),
  };
};
```

## 短期修正（即実装可能）

### ステップ1: onMounted での重複 loadData 削除

**理由**: composable の watch で自動実行されるため、明示的な呼び出しは不要

```typescript
onMounted(async () => {
  const savedView = loadViewFromStorage();
  currentView.value = savedView;
  
  // await loadData(); // ★ 削除（watch で自動実行される）
  
  // マスターデータ取得は並行実行
  getEquipmentsAsync().then(/* ... */);
  getFacilitiesAsync().then(/* ... */);
  
  // 月間ビューなら日選択
  if (currentView.value === 'monthly') {
    selectDay(new Date(currentDate.value));
  }
  
  await updateCurrentDayEvents();
});
```

**問題**: 初回マウント時に watch がトリガーされない場合、データがロードされない。

**解決**: watch は `currentView` の変更で確実にトリガーされる（デフォルト 'monthly' → savedView 'weekly'）

### ステップ2: 初期 currentView を localStorage から設定

```typescript
// composables/useCalendar.ts
export const useCalendar = () => {
  // 初期ビューを localStorage から読み込む
  const getInitialView = (): CalendarView => {
    if (typeof window === 'undefined') return 'monthly';
    try {
      const saved = localStorage.getItem('calendar-view');
      if (saved && ['daily', 'weekly', 'monthly'].includes(saved)) {
        return saved as CalendarView;
      }
    } catch (error) {
      console.warn('Failed to load view from localStorage:', error);
    }
    return 'monthly';
  };

  const currentView = ref<CalendarView>(getInitialView()); // ★ 初期値を localStorage から
  
  // ... rest
};
```

**pages/calendar/index.vue**:
```typescript
onMounted(async () => {
  // ビュー復元は不要（composable で完了）
  
  // マスターデータ取得
  getEquipmentsAsync().then(/* ... */);
  getFacilitiesAsync().then(/* ... */);
  
  // 初回ロード（composable の watch が自動実行するため削除可能）
  // await loadData(); // 削除検討
  
  // 月間ビューなら日選択
  if (currentView.value === 'monthly') {
    selectDay(new Date(currentDate.value));
  }
});
```

## パフォーマンス改善見込み

### 現状（修正後）
- **events クエリ**: 18回（6 loadData × 3 クエリ/loadData）
- **初回ロード時間**: 不明（プロファイラサマリーなし）

### 期待（追加修正後）
- **events クエリ**: 3~4回（1 loadData × 3~4 クエリ）
- **削減率**: 約78%
- **初回ロード時間**: 大幅改善見込み

## 次のアクション

1. **immediate**: onMounted から重複 loadData 呼び出しを削除
2. **short-term**: composable で initialView を localStorage から取得
3. **verification**: ブラウザリロードして検証結果.txt にログ採取
4. **expected**: events クエリが 3~4 回に削減され、「Already loading, skipping」ログが消える
