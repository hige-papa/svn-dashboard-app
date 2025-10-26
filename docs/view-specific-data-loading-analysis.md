# 現状分析：ビューごとのイベント取得範囲

## 調査日時
2025年10月24日

## 現在の実装状況

### 1. イベント取得方法

#### composables/useCalendar.ts の loadData
```typescript
const loadData = async () => {
  const dateRange = getCurrentDateRange();
  const [eventsData, ...] = await Promise.all([
    eventService.getEventsInRange(dateRange.startDate, dateRange.endDate), // ★ 全員分
    // ...
  ]);
  events.value = eventsData; // ★ 全員分のイベントを格納
};
```

**現状**: `getEventsInRange` は **全員分のイベント** を取得（participantIds でフィルタしない）

#### services/eventService.ts
- `getEventsInRange(startDate, endDate)`: **全員分**のイベントを取得
- `getEventsByParticipantInRange(uid, startDate, endDate)`: **特定ユーザー**のイベントを取得（存在するが未使用）

### 2. 各ビューでのイベント表示

#### 週間ビュー（WeeklyCalendarView）
```vue
<WeeklyCalendarView 
  :users="visibleUsers"
  :events="events"  <!-- ★ 全員分のeventsをそのまま渡す -->
/>
```
**表示内容**: **全員分**のイベント（正しい）

#### 月間ビュー（CalendarGrid）
```vue
<CalendarGrid 
  :events="myEvents"  <!-- ★ ログインユーザーのみフィルタ済み -->
/>
```
```typescript
const myEvents = computed(() => {
  return events.value.filter(e => 
    e.participantIds?.includes(user.value?.uid)
  );
});
```
**表示内容**: **ログインユーザーのみ**（クライアント側でフィルタ）

#### 日次ビュー（DailyTimeline）
```vue
<DailyTimeline 
  :events="myCurrentDayEvents"  <!-- ★ ログインユーザーのみフィルタ済み -->
/>
```
```typescript
const myCurrentDayEvents = computed(() => {
  return currentDayEvents.value.filter(e => 
    e.participantIds?.includes(user.value?.uid)
  );
});
```
**表示内容**: **ログインユーザーのみ**（クライアント側でフィルタ）

## 問題の確認

### 検証結果.txt のログ分析

#### 初回ロード時の日付範囲
```
Cache Miss: dailyOptions:2025-09-28:2025-11-08  ← 月間ビュー範囲（42日分）
Cache Miss: dailyOptions:2025-10-20:2025-10-26  ← 週間ビュー範囲（7日分）
Cache Miss: dailyOptions:2025-10-13:2025-10-19  ← 前週範囲（7日分）
Cache Miss: dailyOptions:2025-10-24:2025-10-24  ← 日次ビュー範囲（1日分）
```

**loadData が6回実行** → 各範囲で **全員分のイベントを取得**

### 現状の無駄

#### ケース1: 月間ビュー表示時（デフォルト）
- **取得**: 2025-09-28 ~ 2025-11-08 の **全員分** のイベント（42日 × 全員）
- **表示**: ログインユーザーのみ（クライアントでフィルタ）
- **無駄**: 他のユーザーのイベントデータを大量に取得・転送するが使わない

#### ケース2: 日次ビュー表示時
- **取得**: 1日分の **全員分** のイベント
- **表示**: ログインユーザーのみ
- **無駄**: 他のユーザーのイベントデータを取得するが使わない

#### ケース3: 週間ビュー表示時
- **取得**: 7日分の **全員分** のイベント
- **表示**: **全員分**
- **無駄**: なし（正しい）

### データ量の比較（推定）

仮定:
- ユーザー数: 10人
- 1人あたり1日2件のイベント
- 月間ビュー: 42日分

#### 現状（全員分取得）
- 月間ビュー: 42日 × 10人 × 2件 = **840件**
- 日次ビュー: 1日 × 10人 × 2件 = **20件**
- 週間ビュー: 7日 × 10人 × 2件 = **140件**

#### 理想（必要分のみ取得）
- 月間ビュー: 42日 × 1人 × 2件 = **84件**（削減率: 90%）
- 日次ビュー: 1日 × 1人 × 2件 = **2件**（削減率: 90%）
- 週間ビュー: 7日 × 10人 × 2件 = **140件**（変化なし）

## 修正方針

### 方針A: ビューごとに取得関数を使い分ける（推奨）

#### メリット
- **月間・日次ビューで大幅なデータ削減**（90%削減）
- Firestore クエリ回数も削減（participantIds フィルタで効率化）
- ネットワーク転送量も削減

#### デメリット
- コードの複雑性がわずかに増加
- ビュー切り替え時に異なるデータセットをロードする必要

#### 実装方法

**composables/useCalendar.ts**:
```typescript
const loadData = async () => {
  if (isLoading.value) {
    console.log('[loadData] Already loading, skipping duplicate call');
    return;
  }
  
  isLoading.value = true;
  try {
    const dateRange = getCurrentDateRange();
    
    // ビューに応じて取得方法を変える
    let eventsData: EventDisplay[];
    if (currentView.value === 'weekly') {
      // 週間ビュー: 全員分のイベントを取得
      eventsData = await eventService.getEventsInRange(dateRange.startDate, dateRange.endDate);
    } else {
      // 月間・日次ビュー: ログインユーザーのみのイベントを取得
      const currentUser = useState<ExtendedUserProfile>('userProfile');
      if (!currentUser.value?.uid) {
        throw new Error('User not authenticated');
      }
      eventsData = await eventService.getEventsByParticipantInRange(
        currentUser.value.uid,
        dateRange.startDate,
        dateRange.endDate
      );
    }
    
    // ... rest
  } finally {
    isLoading.value = false;
  }
};
```

**効果**:
- 月間ビュー移動時: 全員分 → 自分のみ（大幅削減）
- 日次ビュー移動時: 全員分 → 自分のみ（大幅削減）
- 週間ビュー移動時: 全員分（変化なし）
- **週間 ↔ 月間/日次の切り替え時**: データセットが変わるため再取得が必要（`watch` が適切に動作）

### 方針B: 週間ビュー専用の追加ロード（サブ案）

#### 実装方法
```typescript
// 基本は自分のイベントのみロード
const loadData = async () => {
  const eventsData = await eventService.getEventsByParticipantInRange(
    currentUser.value.uid,
    dateRange.startDate,
    dateRange.endDate
  );
  events.value = eventsData;
};

// 週間ビュー用の追加ロード
const loadWeeklyEvents = async () => {
  if (currentView.value !== 'weekly') return;
  
  const dateRange = getCurrentDateRange();
  const allEvents = await eventService.getEventsInRange(
    dateRange.startDate,
    dateRange.endDate
  );
  events.value = allEvents; // 全員分に置き換え
};
```

**メリット**: 意図が明確  
**デメリット**: 二重管理が複雑

### 方針C: 現状維持（非推奨）

現在のまま全ビューで全員分を取得し続ける。

**メリット**: 実装変更不要  
**デメリット**: データ転送量が常に最大

## 推奨実装: 方針A の詳細

### ステップ1: useCalendar.ts を修正

```typescript
export const useCalendar = () => {
  const currentUser = useState<ExtendedUserProfile>('userProfile');
  
  const loadData = async () => {
    if (isLoading.value) {
      console.log('[loadData] Already loading, skipping duplicate call');
      return;
    }
    
    isLoading.value = true;
    try {
      const dateRange = getCurrentDateRange();
      
      // ビューに応じた取得方法
      let eventsPromise: Promise<EventDisplay[]>;
      if (currentView.value === 'weekly') {
        console.log(`[loadData] Loading all users' events for weekly view (${dateRange.startDate} ~ ${dateRange.endDate})`);
        eventsPromise = eventService.getEventsInRange(dateRange.startDate, dateRange.endDate);
      } else {
        if (!currentUser.value?.uid) {
          throw new Error('[loadData] User not authenticated');
        }
        console.log(`[loadData] Loading user events only for ${currentView.value} view (${dateRange.startDate} ~ ${dateRange.endDate})`);
        eventsPromise = eventService.getEventsByParticipantInRange(
          currentUser.value.uid,
          dateRange.startDate,
          dateRange.endDate
        );
      }
      
      const [eventsData, usersResult, holidaysResult] = await Promise.all([
        eventsPromise,
        getMasterDataCacheAsync('users'),
        getMasterDataCacheAsync('holidays'),
      ]);
      
      events.value = eventsData;
      users.value = usersResult.data.map((u: ExtendedUserProfile) => ({ ...u, visible: true }));
      holidays.value = holidaysResult.data;
      
      if (currentView.value === 'weekly') {
        printFirestoreDebugSummary();
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  // ... rest
};
```

### ステップ2: getEventsByResourceInRange の実装確認

すでに `getEventsByParticipantInRange` が実装済み（services/eventService.ts 550行目）:
```typescript
const getEventsByParticipantInRange = async (uid: string, startDate: string, endDate: string): Promise<EventDisplay[]> => {
  return getEventsByResourceInRange('participant', uid, startDate, endDate);
};
```

この関数は内部で `participantIds` に対するフィルタを行うため、効率的に取得できる。

### ステップ3: 検証

#### 期待される動作
1. **週間ビュー初回ロード**: `getEventsInRange` → 全員分（現状と同じ）
2. **月間ビューに切り替え**: `getEventsByParticipantInRange` → 自分のみ（削減）
3. **日次ビューに切り替え**: `getEventsByParticipantInRange` → 自分のみ（削減）
4. **再度週間ビューに切り替え**: `getEventsInRange` → 全員分（再取得）

#### ログでの確認ポイント
```
[loadData] Loading all users' events for weekly view (2025-10-20 ~ 2025-10-26)
→ events クエリ: 3~4回（全員分）

[loadData] Loading user events only for monthly view (2025-09-28 ~ 2025-11-08)
→ events クエリ: 3~4回だが、participantIds フィルタで件数削減

[loadData] Loading user events only for daily view (2025-10-24 ~ 2025-10-24)
→ events クエリ: 3~4回だが、participantIds フィルタで件数削減
```

## パフォーマンス改善見込み

### 現状（修正前）
- **初回ロード**: events 18回（6 loadData × 3クエリ）
- **データ転送**: 全ビューで全員分

### 修正案1適用後（loadData 重複削除）
- **初回ロード**: events 3~4回（1 loadData × 3~4クエリ）
- **データ転送**: 全ビューで全員分（変化なし）

### 修正案2適用後（+ ビュー別取得）
- **初回ロード（週間）**: events 3~4回、全員分
- **月間移動**: events 3~4回、**自分のみ**（90% 削減）
- **日次移動**: events 3~4回、**自分のみ**（90% 削減）
- **週間移動**: events 3~4回、全員分

**総合効果**: 
- クエリ回数: 18回 → 3~4回（78% 削減）
- データ転送量: 月間・日次で 90% 削減
- 週間ビューは変化なし（適切）

## 次のアクション

1. **immediate**: composables/useCalendar.ts で loadData を修正（ビュー別取得）
2. **verification**: ブラウザで各ビュー移動を試して検証結果.txt にログ採取
3. **expected**: 
   - 週間ビュー: events クエリ 3~4回、全員分
   - 月間・日次: events クエリ 3~4回、自分のみ（ログで participantIds フィルタ確認）
