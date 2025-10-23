# TODO (作業一覧)

このファイルは現在の作業 TODO リストのスナップショットです。

## 完了済み
- 選択ログを解析 — `検証結果.txt` を確認し、キャッシュ動作、Vue 警告、Firestore アクセスを検証済み。
- 解析結果を要約 — ログから観察される問題点と改善点をドキュメント化。
- 施策2-1 のコミット準備 — `composables/useCalendar.ts` と `composables/useDailyOptions.ts` の変更をコミット準備済み。
- フェーズ2 プロンプト作成 — 施策1-2（events クエリ統合）の作業プロンプトを作成。
- `eventService.ts` の現状分析と `getEventsInRange` の改修（single/range/instances の範囲クエリ化、`conflicted` フィールド追加等）。
- Firestore インデックスエラーの一時回避 — クライアント側フィルタに変更し動作回復。

## 次の優先タスク
1. 初回ロードの `events` クエリが多発する原因調査（ターゲット: 15 回 → 3~5 回）
   - `pages/calendar/index.vue` と月/週ビューコンポーネントを調べ、重複呼び出しや watch 処理を特定する。
   - 必要なら `isLoading` フラグや呼び出しの共通化（コール合流）を導入する。
2. インデックス作成ガイドの作成
   - 必要な Firestore 複合インデックスの定義を記載し、`firestore.indexes.json` の更新案を作成する。
3. 統合検証とドキュメント化
   - プロファイラで最終的なクエリ削減を確認し、ドキュメントを更新。
4. 単体テストの追加
   - `getEventsInRange` 用のユニットテスト（Firestore モック）を追加。chunking と dedupe のテスト含む。

## 現在の作業
- この TODO.md をリポジトリに追加してコミット中。

## 備考
- このブランチ: `feature/tanaka_マスターデータのキャッシュ化`
- 次に行う提案: 初回ロードのクエリ原因調査を行ってもよいですか？
