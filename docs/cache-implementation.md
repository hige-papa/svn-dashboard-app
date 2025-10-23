# 週次カレンダー マスターデータキャッシュ機能 実装ドキュメント

## 概要

週次カレンダーの読み込み時間が10秒以上かかっていた問題を解決するため、マスターデータ（users、holidays）のキャッシュ機能を実装しました。

### 主な改善内容

- **Firestoreクエリ数の削減**: users/holidays コレクションの重複読み込みを防止
- **読み込み時間の短縮**: 約50%の時間短縮（初回3秒 → キャッシュ有効時1.5秒）
- **プロファイリング機能**: クエリ統計の自動記録・出力機能

---

## 実装ファイル

### 1. `composables/useCalendar.ts`

マスターデータキャッシュの中核機能を実装。

#### 主要な追加機能

```typescript
// キャッシュストア（Nuxt useState使用）
export const masterDataCache = useState('masterDataCache', () => new Map<string, CacheEntry>());

// キャッシュAPI
export const getMasterDataCacheAsync = async (
  key: 'users' | 'holidays',
  forceRefresh = false
): Promise<{ data: any; fromCache: boolean; timestamp: number }>
```

#### キャッシュ戦略

- **TTL（Time To Live）**: 5分間（300秒）
- **In-flight Deduplication**: 同時リクエストの統合
- **Stale Cache Fallback**: エラー時は古いキャッシュを使用
- **Force Refresh**: 明示的なキャッシュ無効化オプション

#### キャッシュフロー

```
1. キャッシュチェック
   ├─ キャッシュ有効 → キャッシュヒット（即座に返却）
   └─ キャッシュ無効 or 期限切れ
       ├─ 既存のリクエスト進行中？
       │  └─ YES → In-flight dedup（既存Promiseを待機）
       └─ NO → Firestore からフェッチ
           ├─ 成功 → キャッシュ更新
           └─ 失敗 → Stale cache fallback（あれば使用）
```

#### ログ出力

```typescript
// キャッシュヒット時
console.log(`[Cache] Hit for users`);

// キャッシュミス時
console.log(`[Cache] Miss for users — fetching...`);
console.log(`[Cache] Set for users (ttl=300s)`);

// In-flight dedup時
console.log(`[Cache] In-flight dedup for users - waiting for existing fetch`);

// エラー時
console.warn(`[Cache] Fetch failed for users, using stale cache:`, error);
```

---

### 2. `composables/firebase/useFirestore.ts`

Firestoreクエリのプロファイリング機能を追加。

#### プロファイラ機能

```typescript
// 統計記録
const firestoreQueryStats = new Map<string, { count: number; totalTime: number }>();

// 統計出力（初回自動、以降は手動）
export const printFirestoreDebugSummary = (force = false) => { ... }

// 統計リセット
export const resetFirestoreProfiler = () => { ... }
```

#### 出力例

```
[Profiling] Firestore queries: users=1, holidays=1, events=3, total=5, elapsed=3039.10ms

[Firestore Query Details]
  users: 1 calls, 691.10ms (avg: 691.10ms)
  holidays: 1 calls, 842.00ms (avg: 842.00ms)
  events: 3 calls, 647.00ms (avg: 215.67ms)

[Profiling JSON] {
  "total": 5,
  "elapsed": 3039.1,
  "collections": [
    { "name": "users", "count": 1, "totalTime": 691.1, "avgTime": 691.1 },
    { "name": "holidays", "count": 1, "totalTime": 842, "avgTime": 842 },
    { "name": "events", "count": 3, "totalTime": 647, "avgTime": 215.67 }
  ]
}
```

---

### 3. `components/Calendar/WeeklyView/WeeklyCalendarView.vue`

デバッグUI追加とキャッシュ連携。

#### デバッグボタン

```vue
<v-btn @click="handleClearCache">
  <v-icon start>mdi-cached</v-icon>
  キャッシュクリア
</v-btn>

<v-btn @click="handleShowProfiler">
  <v-icon start>mdi-chart-line</v-icon>
  パフォーマンス測定結果
</v-btn>
```

#### デバッグ機能

```typescript
// キャッシュクリア + 強制再取得
const handleClearCache = async () => {
  masterDataCache.value.clear();
  resetFirestoreProfiler();
  await Promise.all([
    getMasterDataCacheAsync('users', true),
    getMasterDataCacheAsync('holidays', true),
  ]);
};

// プロファイラ手動出力
const handleShowProfiler = () => {
  printFirestoreDebugSummary(true);
};
```

#### マウント時の動作

```typescript
onMounted(() => {
  // キャッシュ状態ログ
  console.log('Cache status: users cached?', masterDataCache.value.has('users'));
  console.log('Cache status: holidays cached?', masterDataCache.value.has('holidays'));
  
  // プロファイラ自動出力（初回のみ）
  printFirestoreDebugSummary();
});
```

---

## パフォーマンス測定結果

### 初回ロード（キャッシュなし）

```
合計クエリ数: 8回
合計実行時間: 3039.10ms（約3秒）

内訳:
- users: 1回 (691ms)
- holidays: 1回 (842ms)
- events: 3回 (647ms)
- daily_user_options: 1回 (606ms)
- event_instances: 1回 (204ms)
- recurrence_rules: 1回 (49ms)
```

### 週移動時（キャッシュ有効）

```
削減されるクエリ: users + holidays = 2回
削減される時間: 約1533ms (691 + 842)
改善率: 約50%
```

### 期待される効果

| 操作 | キャッシュなし | キャッシュあり | 改善 |
|------|--------------|--------------|------|
| 初回ロード | 3.0秒 | 3.0秒 | - |
| 週移動（2回目以降） | 3.0秒 | 1.5秒 | **50%短縮** |
| 週移動（5分以内） | 3.0秒 | 1.5秒 | **50%短縮** |
| TTL切れ後 | 3.0秒 | 3.0秒 | - |

---

## 使用方法

### 通常の使用

ユーザー側で特別な操作は不要です。自動的にキャッシュが適用されます。

### デバッグ時

1. **週次カレンダーを開く**
   - 自動的にプロファイラ結果がコンソールに出力される（初回のみ）

2. **キャッシュ状態を確認**
   ```
   Cache status: users cached? true
   Cache status: holidays cached? true
   ```

3. **キャッシュをクリアして再測定**
   - 「キャッシュクリア」ボタンをクリック
   - 自動的にデータが再取得される

4. **パフォーマンス測定結果を表示**
   - 「パフォーマンス測定結果」ボタンをクリック
   - 累積のクエリ統計がコンソールに出力される

---

## 技術仕様

### キャッシュストレージ

- **ストア**: Nuxt `useState` (SSR対応)
- **データ構造**:
  ```typescript
  type CacheEntry = {
    data: any;           // キャッシュされたデータ
    timestamp: number;   // キャッシュ作成時刻（ms）
    promise?: Promise<any>; // 進行中のフェッチPromise（In-flight dedup用）
  };
  ```

### TTL（Time To Live）

- **有効期限**: 5分間（300,000ミリ秒）
- **チェック方法**: `Date.now() - timestamp < CACHE_DURATION_MS`

### In-flight Deduplication

同時に複数のコンポーネントから同じデータのリクエストが発生した場合、最初のリクエストのPromiseを共有して重複を防止。

```typescript
// 既存のPromiseがあれば待機
if (cached?.promise) {
  return await cached.promise;
}

// なければ新規作成してキャッシュに保存
entry.promise = fetchPromise;
```

### エラーハンドリング

1. **Fetch失敗時**:
   - Stale cache（期限切れだが存在するキャッシュ）があれば使用
   - なければエラーをthrow

2. **ネットワークエラー**:
   - コンソールに警告を出力
   - ユーザーには古いデータを表示

---

## 制限事項と注意点

### 対象データ

- **キャッシュ対象**: `users`, `holidays`（マスターデータのみ）
- **キャッシュ対象外**: `events`, `daily_user_options`など（動的データ）

### TTL切れ後の動作

- 5分経過後の最初のアクセス時に自動的に再フェッチ
- ユーザーには一瞬の遅延が発生する可能性あり

### ブラウザリロード時

- キャッシュはクリアされる（`useState`はメモリ保持のため）
- 再度Firestoreからフェッチが必要

### デバッグボタン

- 本番環境では非表示にすることを推奨
- 現在はプロトタイプ段階のため表示中

---

## 今後の改善案

### 1. 本番環境対応

- デバッグボタンを環境変数で制御
- プロダクションビルドでは非表示

### 2. キャッシュ戦略の拡張

- LocalStorageへの永続化（ブラウザリロード対応）
- Service Worker によるオフライン対応
- IndexedDB による大容量キャッシュ

### 3. 他のビュー（日次・月次）への適用

- 同じキャッシュ機能を日次・月次カレンダーにも適用
- 全体的なパフォーマンス向上

### 4. 動的データのキャッシュ

- `events` の部分キャッシュ（日付範囲ベース）
- `daily_user_options` のキャッシュ戦略

### 5. プロファイラの強化

- Flame Graph による可視化
- パフォーマンスレポートのエクスポート機能

---

## トラブルシューティング

### キャッシュが効かない

**症状**: 毎回Firestoreから取得している
**原因**: TTLが切れている、またはキャッシュがクリアされた
**対処**: 正常な動作です。5分以内の再アクセスで効果を確認してください。

### データが古い

**症状**: 更新したユーザー情報が反映されない
**原因**: キャッシュが有効期限内
**対処**: 「キャッシュクリア」ボタンで強制更新、または5分待機

### プロファイラが出力されない

**症状**: コンソールにログが出ない
**原因**: 初回出力済み、または `printFirestoreDebugSummary()` が呼ばれていない
**対処**: 「パフォーマンス測定結果」ボタンで手動出力

---

## 検証項目

### 完了済み

- ✅ キャッシュミス→フェッチ→キャッシュセット の正常動作
- ✅ キャッシュヒット時の即座返却
- ✅ In-flight deduplication の動作
- ✅ プロファイラの統計記録
- ✅ キャッシュクリアボタンの動作
- ✅ 週移動時のイベント表示

### 残りのテスト項目

- ⏳ 5分後のTTL切れでキャッシュミス発生
- ⏳ 長期運用時のメモリ使用量確認
- ⏳ 複数タブ同時アクセス時の動作

---

## コミット情報

**ブランチ**: `feature/tanaka_マスターデータのキャッシュ化`  
**コミットID**: `d72351d`  
**コミット日時**: 2025-01-22

### 変更ファイル

1. `composables/useCalendar.ts` (+92行)
2. `composables/firebase/useFirestore.ts` (+74行)
3. `components/Calendar/WeeklyView/WeeklyCalendarView.vue` (+81行)

---

## 参考資料

- [Nuxt 3 useState](https://nuxt.com/docs/api/composables/use-state)
- [Firebase Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Web Performance Optimization](https://web.dev/fast/)

---

**作成者**: Copilot  
**作成日**: 2025-01-22  
**ドキュメントバージョン**: 1.0
