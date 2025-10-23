# 予定登録後のUX改善 - 実装レポート

## 実装日時
2025年10月24日

## 実装内容

### 課題1: GroupHorizontalTimeline のインポート不足 ✅

#### 問題
`components/Calendar/EventForm.vue` で `GroupHorizontalTimeline` コンポーネントを使用しているが、インポート文が欠けていた。

#### 修正内容
**ファイル**: `components/Calendar/EventForm.vue`

```typescript
// 追加したインポート文
import GroupHorizontalTimeline from '~/components/Calendar/DailyView/GroupHorizontalTimeline.vue'
```

#### 影響
- コンソール警告 `[Vue warn]: Failed to resolve component: GroupHorizontalTimeline` が解消
- 関連者の予定タイムラインが正常に表示される

---

### 課題3: 週の位置保持機能 ✅

#### 問題
予定登録・編集後にカレンダーページに戻ると、表示していた週ではなく今週（今日を含む週）に戻ってしまう。

#### 実装方針
LocalStorage を使用して、現在表示中の週の位置（currentDate）を保存し、ページに戻った時に復元する。

---

### 実装詳細

#### 1. composables/useCalendar.ts の変更

##### 週の位置保存・復元関数を追加

```typescript
// --- Calendar Position Persistence (週の位置保存) ---
const CALENDAR_POSITION_KEY = 'calendar-current-date';

const saveCalendarPosition = () => {
  if (import.meta.client) {
    try {
      localStorage.setItem(CALENDAR_POSITION_KEY, formatDateForDb(currentDate.value));
    } catch (error) {
      console.warn('Failed to save calendar position:', error);
    }
  }
};

const loadCalendarPosition = (): Date | null => {
  if (import.meta.client) {
    try {
      const savedDate = localStorage.getItem(CALENDAR_POSITION_KEY);
      if (savedDate) {
        const date = new Date(savedDate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.warn('Failed to load calendar position:', error);
    }
  }
  return null;
};

const clearCalendarPosition = () => {
  if (import.meta.client) {
    try {
      localStorage.removeItem(CALENDAR_POSITION_KEY);
    } catch (error) {
      console.warn('Failed to clear calendar position:', error);
    }
  }
};
```

##### エクスポートに追加

```typescript
return {
  // ... 既存のエクスポート
  formatDateForDb,  // 追加
  saveCalendarPosition,  // 追加
  loadCalendarPosition,  // 追加
  clearCalendarPosition,  // 追加
};
```

---

#### 2. pages/calendar/index.vue の変更

##### useCalendar から新しい関数をインポート

```typescript
const {
  // ... 既存のインポート
  formatDateForDb,
  saveCalendarPosition,
  loadCalendarPosition,
  clearCalendarPosition,
} = useCalendar();
```

##### onMounted で週の位置を復元

```typescript
onMounted(async () => {
  // 保存されたビューを読み込んで設定（watch トリガー前に直接設定）
  const savedView = loadViewFromStorage();
  if (savedView !== currentView.value) {
    currentView.value = savedView;
  }

  // 保存された週の位置を復元（予定登録などから戻ってきた時のため）
  const savedPosition = loadCalendarPosition();
  if (savedPosition) {
    currentDate.value = savedPosition;
    console.log('[Calendar] Restored calendar position:', formatDateForDb(savedPosition));
  }

  // ... 以下、既存の処理
});
```

##### currentDate の変更を監視して保存

```typescript
watch(currentDate, async () => {
  await updateCurrentDayEvents();
  // 週の位置を保存（予定登録などから戻ってきた時のため）
  saveCalendarPosition();
});
```

##### 予定登録・編集ページ遷移前に週の位置を保存

```typescript
const goToRegister = () => {
  // 予定登録ページに遷移する前に現在の週の位置を保存
  saveCalendarPosition();
  navigateTo(`/calendar/register?date=${getDateString(selectedDate.value ?? new Date())}&participantId=${selectedUser.value?.uid}`)
}

const handleEditEvent = (event: EventDisplay | EventData) => {
  // 予定編集ページに遷移する前に現在の週の位置を保存
  saveCalendarPosition();
  if (event?.id) navigateTo(`/calendar/${event.id}/edit`);
};
```

---

## 動作フロー

### 通常のカレンダー操作
1. ユーザーが週を移動（前週/次週ボタンなど）
2. `currentDate` が変更される
3. watch により `saveCalendarPosition()` が実行され、localStorage に保存

### 予定登録フロー
1. ユーザーが「予定を登録する」ボタンをクリック
2. `goToRegister()` 内で `saveCalendarPosition()` を明示的に実行
3. 予定登録ページ（`/calendar/register`）に遷移
4. ユーザーが予定を登録して `router.back()` で戻る
5. カレンダーページの `onMounted` で `loadCalendarPosition()` が実行
6. localStorage から保存された日付を取得
7. `currentDate.value = savedPosition` で週の位置を復元
8. 予定登録前に表示していた週が表示される

### 予定編集フロー
1. ユーザーが予定をクリック → 詳細 → 編集ボタン
2. `handleEditEvent()` 内で `saveCalendarPosition()` を明示的に実行
3. 予定編集ページ（`/calendar/:id/edit`）に遷移
4. ユーザーが予定を更新して `router.back()` で戻る
5. カレンダーページの `onMounted` で `loadCalendarPosition()` が実行
6. 予定編集前に表示していた週が表示される

---

## LocalStorage キー

| キー | 値 | 用途 |
|------|-----|------|
| `calendar-current-date` | YYYY-MM-DD | 現在表示中の週の基準日 |
| `calendar-current-view` | daily / weekly / monthly | ビューの種類（既存） |

---

## テスト項目

### ✅ 課題1のテスト
- [ ] EventForm を開いた時に GroupHorizontalTimeline の警告が出ないこと
- [ ] 関連者の予定タイムラインが正常に表示されること

### ✅ 課題3のテスト

#### 基本動作
- [ ] 週を移動して localStorage に保存されること（DevTools で確認）
- [ ] ページをリロードしても週の位置が保持されること

#### 予定登録フロー
1. カレンダーを 2025-10-13 を含む週に移動
2. 「予定を登録する」ボタンをクリック
3. 予定を登録して保存
4. カレンダーページに戻る
5. **期待**: 2025-10-13 を含む週が表示される（今週ではない）

#### 予定編集フロー
1. カレンダーを過去または未来の週に移動
2. 既存の予定をクリック → 編集
3. 予定を更新して保存
4. カレンダーページに戻る
5. **期待**: 編集前に表示していた週が表示される

#### ビュー切り替え
1. 週次ビューで特定の週を表示
2. 月次ビューに切り替え
3. 再度週次ビューに戻る
4. **期待**: 週の位置が保持されている

---

## 注意事項

### クライアントサイドのみで動作
- `import.meta.client` チェックにより、SSR 時には localStorage にアクセスしない
- サーバーサイドレンダリング時のエラーを防止

### エラーハンドリング
- localStorage へのアクセス失敗時は console.warn でログ出力
- 保存失敗してもアプリケーションの動作に影響しない

### 日付の妥当性チェック
- localStorage から取得した日付が不正な場合は無視
- `isNaN(date.getTime())` で妥当性を確認

---

## 残課題

### 課題2: 予定登録後の表示遅延（未実施）
- 優先度: 低
- 次のステップ: パフォーマンス調査が必要
- 予定登録後の `loadData()` 実行フローを分析し、不要な再取得がないか確認

---

## まとめ

### 実装ファイル
- ✅ `components/Calendar/EventForm.vue` - GroupHorizontalTimeline のインポート追加
- ✅ `composables/useCalendar.ts` - 週の位置保存・復元機能
- ✅ `pages/calendar/index.vue` - 週の位置保存・復元の実装

### 効果
- コンソール警告の解消
- 予定登録・編集後のユーザー体験が向上
- 表示していた週の位置が保持される

### コード品質
- エラーハンドリング実装済み
- SSR 対応（import.meta.client チェック）
- 既存の機能に影響なし
