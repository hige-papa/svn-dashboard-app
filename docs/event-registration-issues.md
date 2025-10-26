# 予定登録機能の課題分析レポート

## 分析日時
2025年10月24日

## 課題1: コンソール警告「Failed to resolve component: GroupHorizontalTimeline」

### 🔴 警告内容
```
[Vue warn]: Failed to resolve component: GroupHorizontalTimeline
at <EventForm onBack=fn onCopy=fn onEdit=fn ... >
```

### 原因
`components/Calendar/EventForm.vue` で `GroupHorizontalTimeline` コンポーネントを使用しているが、**インポート文が欠けている**。

**EventForm.vue の該当箇所**:
```vue
<!-- 569行目 -->
<GroupHorizontalTimeline :users="eventRelatedParties ?? []" :events="relatedPartyEvents" :date="targetDate" />
```

**問題**: script setup 部分に以下のインポートがない
```typescript
import GroupHorizontalTimeline from '~/components/Calendar/DailyView/GroupHorizontalTimeline.vue'
```

### ⚠️ 影響度評価

| 項目 | 状態 | 詳細 |
|------|------|------|
| **機能への影響** | 🟡 中程度 | コンポーネントが表示されない可能性 |
| **エラー頻度** | 🔴 高 | 予定登録フォームを開くたびに発生 |
| **ユーザー体験** | 🟡 中程度 | 関連者の予定タイムラインが表示されない |
| **緊急度** | 🟠 **要修正** | 次回デプロイ前に修正推奨 |

### 📝 修正方針

#### **修正箇所**: `components/Calendar/EventForm.vue`

**script setup 部分に追加**:
```typescript
import GroupHorizontalTimeline from '~/components/Calendar/DailyView/GroupHorizontalTimeline.vue'
```

**修正の難易度**: ⭐ 非常に簡単（1行追加）

**リスク**: なし（インポート追加のみ）

---

## 課題2: 予定登録後の週次カレンダー表示が遅い

### 🟡 現象
予定登録後に週次カレンダーに戻る際、表示が若干遅い。

### 推定原因

#### 1. キャッシュクリアによる全データ再取得
予定登録/更新時に以下のキャッシュをクリアしている可能性:
- `dailyOptions` キャッシュ
- `events` データ（loadData による再取得）

#### 2. 全員分のイベント再取得
週次ビューは `getEventsInRange`（全員分）を使用するため、データ量が多い。

#### 3. ビュー切り替えの watch トリガー
予定登録後の処理フローで複数の watch がトリガーされる可能性。

### 📊 調査が必要な箇所

```typescript
// pages/calendar/index.vue
const handleSubmit = async (eventData) => {
  await saveEvent(eventData);
  // ここで何が実行されているか？
  // - loadData() が呼ばれているか？
  // - currentDate が変更されているか？
  // - currentView が変更されているか？
}
```

### 🔍 確認ポイント
1. 予定登録後に `loadData()` が明示的に呼ばれているか
2. キャッシュが不要にクリアされていないか
3. ビュー切り替えが発生しているか

### 📝 最適化案（調査後に実施）

#### オプションA: 増分更新
```typescript
// 全データ再取得ではなく、新規/更新イベントのみを追加
const handleSubmit = async (eventData) => {
  const savedEvent = await saveEvent(eventData);
  // 既存の events 配列に追加/更新（loadData 不要）
  updateEventInList(savedEvent);
}
```

#### オプションB: キャッシュ保持
```typescript
// dailyOptions や users キャッシュを保持したまま events のみ更新
const refreshEventsOnly = async () => {
  const dateRange = getCurrentDateRange();
  const eventsData = await eventService.getEventsInRange(...);
  events.value = eventsData; // キャッシュはそのまま
}
```

---

## 課題3: 予定登録後に元の週に戻らない（今日の週に移動してしまう）

### 🔴 現象
- 予定登録前: 2025-10-13 ~ 2025-10-19 の週を表示
- 予定登録後: 2025-10-20 ~ 2025-10-26（今週）に戻ってしまう

### 原因推定

#### パターンA: `currentDate` がリセットされている
```typescript
// 予定登録後に currentDate が new Date() にリセット？
currentDate.value = new Date(); // ← これが実行されている可能性
```

#### パターンB: `goToToday()` が呼ばれている
```typescript
const handleSubmit = async () => {
  await saveEvent();
  goToToday(); // ← 意図しない呼び出し？
}
```

### 📝 修正方針

#### **推奨: 週の位置をローカルストレージに保存**

```typescript
// composables/useCalendar.ts または pages/calendar/index.vue

// 1. 現在表示中の週の開始日を保存
const saveCurrentWeekPosition = () => {
  if (currentView.value === 'weekly') {
    const weekStart = formatDateForDb(weekDays.value[0]);
    localStorage.setItem('calendar-week-position', weekStart);
  }
};

// 2. ナビゲーション時に自動保存
watch(currentDate, () => {
  saveCurrentWeekPosition();
});

// 3. 予定登録後に週の位置を復元
const handleEventSubmit = async (eventData: any) => {
  // 現在の週の位置を一時保存
  const currentWeekStart = weekDays.value[0];
  
  // イベント保存
  await saveEvent(eventData);
  
  // データ再取得
  await loadData();
  
  // 週の位置を復元
  if (currentView.value === 'weekly') {
    currentDate.value = new Date(currentWeekStart);
  }
};
```

#### **代替案: ref で週の位置を保持**

```typescript
// ページスコープで週の開始日を保持
const savedWeekStart = ref<Date | null>(null);

const handleOpenEventForm = () => {
  // フォームを開く前に週の位置を保存
  if (currentView.value === 'weekly') {
    savedWeekStart.value = new Date(weekDays.value[0]);
  }
  // フォームを開く処理
};

const handleEventSubmit = async (eventData: any) => {
  await saveEvent(eventData);
  await loadData();
  
  // 保存していた週の位置に戻す
  if (savedWeekStart.value && currentView.value === 'weekly') {
    currentDate.value = new Date(savedWeekStart.value);
  }
  savedWeekStart.value = null; // クリア
};
```

---

## 優先順位と実装計画

### 🔴 **優先度: 高**
**課題1**: GroupHorizontalTimeline のインポート不足
- **緊急度**: 高（次回デプロイ前に修正）
- **工数**: 5分（1行追加）
- **リスク**: なし

### 🟡 **優先度: 中**
**課題3**: 予定登録後に元の週に戻らない
- **緊急度**: 中（ユーザー体験に影響）
- **工数**: 30分～1時間
- **リスク**: 低

### 🟢 **優先度: 低**
**課題2**: 予定登録後の表示遅延
- **緊急度**: 低（許容範囲内の可能性）
- **工数**: 詳細調査が必要
- **リスク**: 中（最適化の影響範囲が広い）

---

## 次のアクション

### ステップ1: 課題1の修正（即時実施推奨）
```typescript
// components/Calendar/EventForm.vue
// <script setup> の冒頭に追加
import GroupHorizontalTimeline from '~/components/Calendar/DailyView/GroupHorizontalTimeline.vue'
```

### ステップ2: 課題3の実装
1. 予定登録のフロー確認（`handleSubmit` や類似の処理）
2. 週の位置保持ロジックを実装
3. 動作確認

### ステップ3: 課題2の詳細調査（課題3完了後）
1. 予定登録後の処理フローをログ出力
2. パフォーマンスプロファイラで計測
3. 必要に応じて最適化

---

## まとめ

| 課題 | 修正必要性 | 優先度 | 工数 |
|------|-----------|--------|------|
| 1. GroupHorizontalTimeline警告 | ✅ **要修正** | 🔴 高 | 5分 |
| 2. 表示遅延 | △ 要調査 | 🟢 低 | TBD |
| 3. 週の位置が戻らない | ✅ **要修正** | 🟡 中 | 30分～1時間 |

**推奨**: 課題1 → 課題3 → 課題2 の順で対応
