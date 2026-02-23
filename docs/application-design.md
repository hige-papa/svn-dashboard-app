# Tascal - 社内グループウェアアプリケーション設計書

---

## ０．技術スタック

### １）フレームワーク

| 項目 | 技術 | バージョン |
|------|------|-----------|
| フロントエンドフレームワーク | Nuxt 3 | ^3.17.3 |
| UIフレームワーク | Vuetify 3 | ^3.8.4 |
| コンテンツ管理 | @nuxt/content | ^3.6.3 |
| チャートライブラリ | Chart.js | ^4.4.9 |
| Markdownレンダリング | marked | ^16.1.1 |
| Markdownエディタ | EasyMDE | ^2.20.0 |
| CSV処理 | PapaParse | ^5.5.3 |
| 日付処理 | moment-timezone | ^0.6.0 |
| XSS対策 | DOMPurify | ^3.2.6 |
| ビルドツール | Vite (vite-plugin-vuetify) | ^2.1.1 |

### ２）言語

| 項目 | 技術 |
|------|------|
| フロントエンド | TypeScript / Vue 3 (Composition API) |
| Cloud Functions | TypeScript (Node.js 22) |
| スタイルシート | CSS (カスタムプロパティ使用) |

### ３）バックエンド

| 項目 | 技術 | 備考 |
|------|------|------|
| BaaS | Firebase | ^11.8.1 |
| データベース | Cloud Firestore | asia-northeast1 |
| 認証 | Firebase Authentication | Email/Password認証 |
| ストレージ | Cloud Storage for Firebase | キャッシュファイル保存 |
| サーバーレス関数 | Cloud Functions for Firebase | v1 API |
| AI | Vertex AI (Gemini 2.0 Flash) | firebase/vertexai |
| アナリティクス | Firebase Analytics | - |
| ホスティング | Firebase Hosting | tascal-stg |
| リージョン | asia-northeast1 | 東京リージョン |

---

## １．概要設計

### １）サイトマップ

```
/                          ... ダッシュボード（トップページ）
├── /signin                ... ログインページ
├── /auth
│   ├── /email/reset       ... メールアドレスリセット
│   └── /password/reset    ... パスワードリセット
├── /calendar
│   ├── /                  ... カレンダー（月次・週次・日次ビュー）
│   ├── /register          ... イベント新規登録
│   └── /[id]
│       ├── /              ... イベント詳細
│       └── /edit          ... イベント編集
├── /attendance            ... 出退勤管理
├── /lunch                 ... ランチシャッフル
├── /users
│   ├── /                  ... ユーザー一覧
│   ├── /new               ... ユーザー新規作成
│   └── /[id]
│       ├── /              ... ユーザー詳細
│       └── /edit          ... ユーザー編集
├── /facility
│   ├── /                  ... 施設一覧
│   ├── /new               ... 施設新規登録
│   └── /[id]
│       ├── /              ... 施設詳細
│       └── /edit          ... 施設編集
├── /equipment
│   ├── /                  ... 備品一覧
│   ├── /new               ... 備品新規登録
│   └── /[id]
│       ├── /              ... 備品詳細
│       └── /edit          ... 備品編集
├── /section
│   ├── /                  ... 部署一覧
│   ├── /new               ... 部署新規登録
│   └── /[id]
│       ├── /              ... 部署詳細
│       └── /edit          ... 部署編集
├── /team
│   ├── /                  ... チーム一覧
│   ├── /new               ... チーム新規登録
│   └── /[id]
│       ├── /              ... チーム詳細
│       └── /edit          ... チーム編集
├── /wiki
│   ├── /                  ... Wiki トップ
│   ├── /new               ... 記事新規作成
│   ├── /articles          ... 記事一覧
│   ├── /category          ... カテゴリ管理
│   ├── /tag               ... タグ管理
│   └── /[id]
│       ├── /              ... 記事詳細
│       └── /edit          ... 記事編集
├── /holiday               ... 祝日管理
├── /expense               ... 経費管理
├── /sales                 ... 売上管理
├── /task                  ... タスク管理
├── /profile
│   ├── /                  ... マイプロフィール
│   └── /edit              ... プロフィール編集
├── /setting               ... 設定
├── /help                  ... ヘルプ
├── /maintenance           ... メンテナンス
├── /manuals
│   ├── /                  ... マニュアルトップ
│   ├── /developer-guide   ... 開発者ガイド
│   ├── /nuxt3-guide-intro ... Nuxt3 入門ガイド
│   ├── /nuxt3-guide-folder... Nuxt3 フォルダ構成ガイド
│   ├── /project-manual    ... プロジェクトマニュアル
│   └── /user-help         ... ユーザーヘルプ
└── /techstacks
    ├── /                  ... 技術スタック紹介
    └── /dragable-modal    ... ドラッグ可能モーダルデモ
```

### ２）プロジェクト・ソース構造

```
svn-dashboard-app/
├── .firebaserc                    # Firebaseプロジェクト設定
├── firebase.json                  # Firebase設定（Hosting/Firestore/Functions）
├── firebase.config.ts             # Firebase クライアントSDK設定
├── firestore.rules                # Firestoreセキュリティルール
├── firestore.indexes.json         # Firestoreインデックス定義
├── nuxt.config.ts                 # Nuxt設定ファイル
├── package.json                   # フロントエンド依存関係
├── tsconfig.json                  # TypeScript設定
│
├── assets/
│   └── css/
│       └── main.css               # グローバルCSS（カスタムプロパティ定義）
│
├── components/
│   ├── AppHeader.vue              # アプリケーションヘッダー
│   ├── AppLinks.vue               # アプリケーションリンク集
│   ├── AwDialog.vue               # 汎用ダイアログ
│   ├── MarkdownRenderer.vue       # Markdownレンダリング
│   ├── NotificationList.vue       # 通知リスト
│   ├── SalesChart.vue             # 売上チャート
│   ├── SideBar.vue                # サイドバーナビゲーション
│   ├── WebSocketSample.vue        # WebSocketサンプル
│   ├── WikiArticleIndex.vue       # Wiki記事インデックス
│   ├── WikiHeroSection.vue        # Wikiヒーローセクション
│   ├── PopularArticleIndex.vue    # 人気記事インデックス
│   ├── PopularArticleIndexList.vue# 人気記事インデックスリスト
│   └── Calendar/
│       ├── CalendarHeader.vue     # カレンダーヘッダー
│       ├── DailyOptionForm.vue    # 日別オプション入力フォーム
│       ├── DailyOptionView.vue    # 日別オプション表示
│       ├── EventCard.vue          # イベントカード
│       ├── EventDetail.vue        # イベント詳細
│       ├── EventEditor.vue        # イベントエディター
│       ├── EventForm.vue          # イベント登録フォーム
│       ├── EventRegister.vue      # イベント登録
│       ├── EventView.vue          # イベント表示
│       ├── EventsList.vue         # イベント一覧
│       ├── NavControls.vue        # ナビゲーションコントロール
│       ├── DailyView/
│       │   ├── DailyTimeline.vue          # 日次タイムライン
│       │   ├── GroupHorizontalTimeline.vue # グループ横型タイムライン
│       │   └── HorizontalTimeline.vue     # 横型タイムライン
│       ├── WeeklyView/
│       │   ├── UserColumn.vue             # ユーザーカラム
│       │   ├── UserFilter.vue             # ユーザーフィルター
│       │   └── WeeklyCalendarView.vue     # 週次カレンダー表示
│       └── MonthlyView/
│           └── CalendarGrid.vue           # 月次カレンダーグリッド
│
├── composables/
│   ├── useCalendar.ts             # カレンダー状態管理・データ取得
│   ├── useCsvFirestore.ts         # CSV入出力・Firestore連携
│   ├── useDailyOptions.ts         # 日別ステータスオプション管理
│   ├── useEquipment.ts            # 備品CRUD操作
│   ├── useEventForm.ts            # イベントフォーム管理・バリデーション
│   ├── useFacility.ts             # 施設CRUD操作
│   ├── useLunchShuffle.ts         # ランチシャッフル機能
│   ├── useMasterData.ts           # マスターデータ管理
│   ├── useRecurrence.ts           # 繰り返し予定生成（deprecated）
│   ├── useSection.ts              # 部署CRUD操作
│   ├── useTeam.ts                 # チームCRUD操作
│   ├── useUserProfile.ts          # ユーザープロフィール管理
│   ├── useWebSocket.ts            # WebSocket通信
│   ├── common/
│   │   ├── useCalculateString.ts  # 文字列数式計算
│   │   ├── useConstants.ts        # 定数定義
│   │   ├── useLocalStorage.ts     # ローカルストレージ操作
│   │   ├── useRandomString.ts     # ランダム文字列生成
│   │   └── useUuid.ts             # UUID生成
│   ├── firebase/
│   │   ├── useAuth.ts             # Firebase Authentication操作
│   │   ├── useDocumentRoot.ts     # Firestoreドキュメントパス管理
│   │   ├── useFirestore.ts        # Firestore基盤操作
│   │   ├── useFirestoreSync.ts    # Firestoreリアルタイム同期
│   │   └── useStoragePath.ts      # Cloud Storageパス管理
│   ├── firestoreGeneral/
│   │   └── useFirestoreGeneral.ts # 汎用Firestoreコレクション操作
│   ├── master/
│   │   └── useMaster.ts           # マスターデータCRUD操作
│   └── transaction/
│       └── useTransaction.ts      # トランザクションCRUD操作
│
├── functions/                     # Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts               # Functions エントリポイント
│
├── layouts/
│   └── default.vue                # デフォルトレイアウト
│
├── middleware/
│   └── router.global.ts           # グローバルルーティングガード
│
├── pages/                         # ファイルベースルーティング
│
├── plugins/
│   ├── firebase.client.ts         # Firebase初期化
│   ├── initState.ts               # アプリケーション初期状態設定
│   └── chart.ts                   # Chart.js プラグイン
│
├── services/
│   ├── eventService.ts            # イベントCRUD・キャッシュ取得
│   ├── dailyOptionService.ts      # 日別ステータスサービス
│   └── wikiService.ts             # Wikiサンプルデータ
│
└── types/                         # TypeScript型定義
    ├── AppState.d.ts
    ├── CloudStorageCommon.d.ts
    ├── DailyOption.d.ts
    ├── DocReference.d.ts
    ├── Equipment.d.ts
    ├── EventForm.d.ts
    ├── Facility.d.ts
    ├── FieldDefinition.d.ts
    ├── FirebaseCommon.d.ts
    ├── GroupMember.d.ts
    ├── LunchShuffle.d.ts
    ├── Menu.d.ts
    ├── OwnCompany.d.ts
    ├── Section.d.ts
    ├── Tag.d.ts
    ├── Team.d.ts
    ├── UserProfile.d.ts
    └── WikiArticle.d.ts
```

---

## ２．データ定義

### １）コレクション一覧

| No | コレクション名 | 概要 | ドキュメントID |
|----|---------------|------|---------------|
| 1 | `users` | ユーザープロフィール | Firebase Auth UID |
| 2 | `events` | カレンダーイベント（実体化済み） | 自動生成UUID |
| 3 | `facility` | 施設マスタ | 自動生成UUID |
| 4 | `equipment` | 備品マスタ | 自動生成UUID |
| 5 | `section` | 部署マスタ | 自動生成UUID |
| 6 | `team` | チームマスタ | 自動生成UUID |
| 7 | `holidays` | 祝日マスタ | 自動生成UUID |
| 8 | `daily_user_options` | ユーザー日別ステータス（勤務形態等） | 自動生成UUID |
| 9 | `lunchShuffle` | ランチシャッフルデータ（共有） | 固定: `shared-lunch-shuffle` |
| 10 | `wikiArticles` | Wiki記事 | 自動生成UUID |
| 11 | `wikiArticles/{aid}/histories` | Wiki記事の変更履歴（サブコレクション） | 自動生成UUID |
| 12 | `schedule` | スケジュールトランザクション | 自動生成UUID |

### ２）ドキュメント定義

#### (1) `users` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| uid | `string` | Yes | Firebase Auth UID |
| code | `string` | Yes | ユーザーコード |
| displayName | `string` | Yes | 表示名（日本語） |
| displayNameEng | `string` | Yes | 表示名（英語） |
| email | `string` | Yes | メールアドレス |
| color | `string` | Yes | カレンダー表示色 |
| phone | `string` | No | 電話番号 |
| department | `string` | No | 所属部署 |
| role | `'admin' \| 'user' \| 'viewer'` | No | ユーザー権限 |
| status | `'active' \| 'inactive'` | No | アカウント状態 |
| bio | `string` | No | 自己紹介 |
| avatar | `string` | No | アバター画像URL |
| extension | `string` | No | 内線番号 |
| sortOrder | `string` | No | 表示順 |
| visible | `boolean` | No | カレンダー表示有無 |
| notifications.email | `boolean` | No | メール通知 |
| notifications.calendar | `boolean` | No | カレンダー通知 |
| notifications.system | `boolean` | No | システム通知 |
| lastLogin | `Timestamp` | No | 最終ログイン日時 |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |
| createdBy | `string` | Auto | 作成者 |
| updatedBy | `string` | Auto | 更新者 |

#### (2) `events` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| title | `string` | Yes | イベントタイトル |
| dateType | `'single' \| 'range' \| 'recurring'` | Yes | 日付タイプ |
| date | `string` (YYYY-MM-DD) | Yes | イベント日付（実体化後の日付） |
| startDate | `string` | No | 期間開始日（range用） |
| endDate | `string` | No | 期間終了日（range用） |
| recurringStartDate | `string` | No | 繰り返し開始日 |
| recurringPattern | `'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'weekdays' \| 'custom'` | No | 繰り返しパターン |
| recurringInterval | `number` | No | 繰り返し間隔 |
| selectedWeekdays | `number[]` | No | 選択曜日（0=日, 6=土） |
| monthlyType | `'date' \| 'weekday'` | No | 月次タイプ |
| monthlyDate | `number` | No | 月次日付 |
| monthlyWeek | `string` | No | 月次何週目 |
| recurringEndType | `'never' \| 'date' \| 'count'` | No | 繰り返し終了条件 |
| recurringEndDate | `string` | No | 繰り返し終了日 |
| recurringCount | `number` | No | 繰り返し回数 |
| startTime | `string` (HH:mm) | Yes | 開始時間 |
| endTime | `string` (HH:mm) | Yes | 終了時間 |
| location | `string` | No | 場所 |
| description | `string` | No | 説明 |
| priority | `'low' \| 'medium' \| 'high'` | Yes | 優先度 |
| eventType | `'meeting' \| 'focus' \| 'away' \| 'other' \| 'vacation' \| 'normal'` | Yes | イベント種別 |
| eventTypeName | `string` | Yes | イベント種別名（表示用） |
| eventTypeColor | `string` | Yes | イベント種別色 |
| private | `boolean` | Yes | プライベート設定 |
| participantIds | `string[]` | No | 参加者UID配列 |
| participants | `string[]` | No | 参加者名配列 |
| facilityIds | `string[]` | No | 施設ID配列 |
| facilities | `string[]` | No | 施設名配列 |
| equipmentIds | `string[]` | No | 備品ID配列 |
| equipments | `string[]` | No | 備品名配列 |
| masterId | `string` | No | マスターイベントID（期間・繰り返し用） |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |
| createdBy | `string` | Auto | 作成者 |
| updatedBy | `string` | Auto | 更新者 |

#### (3) `facility` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| name | `string` | Yes | 施設名 |
| code | `string` | Yes | 施設コード |
| description | `string` | No | 説明 |
| capacity | `number` | No | 定員 |
| category | `string` | No | カテゴリ |
| imageUrl | `string` | No | 画像URL |
| status | `'available' \| 'in_use' \| 'maintenance'` | Yes | ステータス |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |

#### (4) `equipment` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| name | `string` | Yes | 備品名 |
| code | `string` | Yes | 備品コード |
| description | `string` | No | 説明 |
| capacity | `number` | No | 数量 |
| category | `string` | No | カテゴリ |
| imageUrl | `string` | No | 画像URL |
| status | `'available' \| 'in_use' \| 'maintenance'` | Yes | ステータス |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |

#### (5) `section` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| name | `string` | Yes | 部署名 |
| code | `string` | Yes | 部署コード |
| description | `string` | No | 説明 |
| category | `string` | No | カテゴリ |
| imageUrl | `string` | No | 画像URL |
| status | `'available' \| 'in_use' \| 'maintenance'` | Yes | ステータス |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |

#### (6) `team` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| name | `string` | Yes | チーム名 |
| code | `string` | Yes | チームコード |
| description | `string` | No | 説明 |
| category | `string` | No | カテゴリ |
| imageUrl | `string` | No | 画像URL |
| status | `'available' \| 'in_use' \| 'maintenance'` | Yes | ステータス |
| memberIds | `string[]` | No | メンバーUID配列 |
| members | `string[]` | No | メンバー名配列 |
| createdAt | `Timestamp` | Auto | 作成日時 |
| updatedAt | `Timestamp` | Auto | 更新日時 |

#### (7) `daily_user_options` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| uid | `string` | Yes | ユーザーID |
| date | `string` (YYYY-MM-DD) | Yes | 日付 |
| workStyle | `'office' \| 'remote' \| 'out' \| 'vacation' \| 'pending'` | Yes | 勤務形態 |
| lunchParticipation | `'possible' \| 'impossible' \| 'pending'` | Yes | ランチ参加可否 |
| dinnerParticipation | `'possible' \| 'impossible' \| 'pending'` | Yes | 夕食会参加可否 |

#### (8) `lunchShuffle` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Yes | 固定値: `shared-lunch-shuffle` |
| participants | `string[]` | Yes | 参加者名リスト（固定20要素） |
| teams | `string` | Yes | チーム分割結果（JSON文字列） |
| resultMessage | `string` | Yes | タイムスタンプ付き結果メッセージ |
| lastShuffledAt | `string \| null` | No | 最終シャッフル日時（ISO 8601） |
| lastShuffledBy | `string \| null` | No | 最終シャッフル実行者UID |
| updatedAt | `string` | Yes | 最終更新日時（ISO 8601） |
| updatedBy | `string` | Yes | 最終更新者UID |

#### (9) `wikiArticles` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| title | `string` | Yes | 記事タイトル |
| category | `Tag` | No | カテゴリ（id, text, color） |
| summary | `string` | Yes | 概要 |
| content | `string` | Yes | 記事本文（Markdown） |
| tags | `Tag[]` | No | タグ配列 |
| image | `string` | No | サムネイル画像URL |
| author | `string` | Yes | 著者名 |
| department | `string` | Yes | 著者所属部署 |
| status | `'published' \| 'draft' \| 'archived'` | Yes | 公開状態 |
| views | `number` | Yes | 閲覧数 |
| version | `number` | Yes | バージョン番号 |
| createdAt | `string` | Auto | 作成日時 |
| updatedAt | `string` | Auto | 更新日時 |

#### (10) `wikiArticles/{aid}/histories` サブコレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| snapshot | `WikiArticle` | Yes | その時点の記事スナップショット |
| version | `number` | Yes | バージョン番号 |
| createdAt | `string` | Yes | 作成日時 |
| updatedAt | `string` | Yes | 更新日時 |

#### (11) `holidays` コレクション

| フィールド | 型 | 必須 | 概要 |
|-----------|-----|------|------|
| id | `string` | Auto | ドキュメントID |
| date | `string` (YYYY-MM-DD) | Yes | 祝日日付 |
| name | `string` | Yes | 祝日名 |

---

## ３．プログラム設計

### １）components設計

#### 共通コンポーネント

| コンポーネント | ファイル | 概要 |
|--------------|---------|------|
| AppHeader | `components/AppHeader.vue` | アプリケーション上部のヘッダーバー。ロゴ・ユーザーメニュー・通知を表示 |
| SideBar | `components/SideBar.vue` | 左サイドバーナビゲーション。レール（折り畳み）モード対応 |
| AppLinks | `components/AppLinks.vue` | アプリケーション内リンク集 |
| AwDialog | `components/AwDialog.vue` | 汎用確認・入力ダイアログ（Vuetify v-dialog ラッパー） |
| MarkdownRenderer | `components/MarkdownRenderer.vue` | Markdown → HTML 変換レンダラー（marked + DOMPurify） |
| NotificationList | `components/NotificationList.vue` | 通知リスト表示 |
| SalesChart | `components/SalesChart.vue` | Chart.jsベースの売上チャート表示 |
| WebSocketSample | `components/WebSocketSample.vue` | WebSocket接続サンプル |

#### カレンダー系コンポーネント

| コンポーネント | ファイル | 概要 |
|--------------|---------|------|
| CalendarHeader | `Calendar/CalendarHeader.vue` | カレンダーヘッダー。月/週/日の切り替え・ナビゲーション |
| NavControls | `Calendar/NavControls.vue` | 前月/次月/今日ボタン等のナビゲーション |
| EventForm | `Calendar/EventForm.vue` | イベント登録/編集フォーム。日付種別（単発/期間/繰り返し）対応 |
| EventCard | `Calendar/EventCard.vue` | カレンダー上のイベント表示カード |
| EventDetail | `Calendar/EventDetail.vue` | イベント詳細表示パネル |
| EventEditor | `Calendar/EventEditor.vue` | イベント編集コンポーネント |
| EventRegister | `Calendar/EventRegister.vue` | イベント新規登録コンポーネント |
| EventView | `Calendar/EventView.vue` | イベント閲覧ビュー |
| EventsList | `Calendar/EventsList.vue` | イベント一覧リスト表示 |
| DailyOptionForm | `Calendar/DailyOptionForm.vue` | 勤務形態・ランチ参加等の日別オプション入力 |
| DailyOptionView | `Calendar/DailyOptionView.vue` | 日別オプション状態表示 |

#### カレンダービュー系コンポーネント

| コンポーネント | ファイル | 概要 |
|--------------|---------|------|
| CalendarGrid | `MonthlyView/CalendarGrid.vue` | 月次ビューのカレンダーグリッド（6週×7日） |
| WeeklyCalendarView | `WeeklyView/WeeklyCalendarView.vue` | 週次ビュー。ユーザーごとの列表示 |
| UserColumn | `WeeklyView/UserColumn.vue` | 週次ビュー内ユーザーカラム |
| UserFilter | `WeeklyView/UserFilter.vue` | 表示ユーザーフィルタリング |
| DailyTimeline | `DailyView/DailyTimeline.vue` | 日次ビューのタイムライン表示 |
| HorizontalTimeline | `DailyView/HorizontalTimeline.vue` | 横型タイムライン |
| GroupHorizontalTimeline | `DailyView/GroupHorizontalTimeline.vue` | グループ別横型タイムライン |

#### Wiki系コンポーネント

| コンポーネント | ファイル | 概要 |
|--------------|---------|------|
| WikiHeroSection | `WikiHeroSection.vue` | Wikiトップページのヒーローセクション |
| WikiArticleIndex | `WikiArticleIndex.vue` | Wiki記事のインデックス表示 |
| PopularArticleIndex | `PopularArticleIndex.vue` | 人気記事のインデックスカード |
| PopularArticleIndexList | `PopularArticleIndexList.vue` | 人気記事リスト表示 |

### ２）composables設計

#### Firebase基盤

| Composable | ファイル | 概要 |
|-----------|---------|------|
| `useAuth` | `firebase/useAuth.ts` | Firebase Authentication操作。ログイン/ログアウト/ユーザー作成/パスワードリセット/メール変更等 |
| `useFirestore` | `firebase/useFirestore.ts` | Firestore基盤操作。CRUD/バッチ処理/トランザクション/プロファイリング機能。serverTimestamp()による自動タイムスタンプ付与 |
| `useFirestoreSync` | `firebase/useFirestoreSync.ts` | Firestoreリアルタイムリスナー。onSnapshotによるコレクション・ドキュメント監視。onUnmountedで自動解除 |
| `useDocumentRoot` | `firebase/useDocumentRoot.ts` | Firestoreドキュメントパス管理。各コレクションのpath生成関数を提供 |
| `useStoragePath` | `firebase/useStoragePath.ts` | Cloud Storageファイルパス管理 |
| `useFirestoreGeneral` | `firestoreGeneral/useFirestoreGeneral.ts` | 汎用Firestoreコレクション操作。コレクション名をキーとしたCRUD/ページネーション/バッチ削除 |

#### マスターデータ

| Composable | ファイル | 概要 |
|-----------|---------|------|
| `useMaster` | `master/useMaster.ts` | マスターデータCRUD操作。コレクション名パラメータ化による汎用CRUD |
| `useTransaction` | `transaction/useTransaction.ts` | トランザクション対応CRUD操作 |
| `useMasterData` | `useMasterData.ts` | useStateベースのマスターデータ管理。APIモックからのデータ取得・全体キャッシュ |

#### ビジネスロジック

| Composable | ファイル | 概要 |
|-----------|---------|------|
| `useCalendar` | `useCalendar.ts` | カレンダーコア。日付管理/ビュー切替/イベントCRUD/マスターデータキャッシュ/プライベートイベントマスキング/祝日判定 |
| `useEventForm` | `useEventForm.ts` | イベントフォーム管理。バリデーション/競合チェック/繰り返しパターンマッチング/通知表示 |
| `useDailyOptions` | `useDailyOptions.ts` | 日別ステータス管理。勤務形態・ランチ/夕食参加可否の取得・更新。日付範囲キャッシュ対応 |
| `useUserProfile` | `useUserProfile.ts` | ユーザープロフィール管理。CRUD/検索/部署別取得/ステータス切替/統計 |
| `useLunchShuffle` | `useLunchShuffle.ts` | ランチシャッフル機能。リアルタイムデータ同期/Fisher-Yatesシャッフル/チーム分割アルゴリズム |
| `useCsvFirestore` | `useCsvFirestore.ts` | CSV入出力とFirestore連携。PapaParseによるCSV解析/BOM付きエクスポート/バリデーション |
| `useWebSocket` | `useWebSocket.ts` | WebSocket通信。ファイル更新通知のリアルタイム受信 |

#### エンティティ操作

| Composable | ファイル | 概要 |
|-----------|---------|------|
| `useFacility` | `useFacility.ts` | 施設CRUD操作。ページネーション/チャンクロード/件数取得対応 |
| `useEquipment` | `useEquipment.ts` | 備品CRUD操作。ページネーション/チャンクロード/件数取得対応 |
| `useSection` | `useSection.ts` | 部署CRUD操作。ページネーション/チャンクロード/件数取得対応 |
| `useTeam` | `useTeam.ts` | チームCRUD操作。ページネーション/チャンクロード/件数取得対応 |

#### ユーティリティ

| Composable | ファイル | 概要 |
|-----------|---------|------|
| `useConstants` | `common/useConstants.ts` | 定数マスタ。イベント種別/勤務形態/参加可否の名前・色・アイコン定義 |
| `useCalculateString` | `common/useCalculateString.ts` | 文字列数式の安全な評価 |
| `useLocalStorage` | `common/useLocalStorage.ts` | ローカルストレージ操作ラッパー |
| `useRandomString` | `common/useRandomString.ts` | 指定桁数のランダム文字列生成 |
| `useUuid` | `common/useUuid.ts` | UUID生成 |

### ３）ページ設計

| ページ | パス | 概要 | 主要composable/service |
|-------|------|------|----------------------|
| ダッシュボード | `/` | トップページ。全体サマリー表示 | - |
| ログイン | `/signin` | メール/パスワード認証 | `useAuth` |
| メールリセット | `/auth/email/reset` | メールアドレス変更 | `useAuth` |
| パスワードリセット | `/auth/password/reset` | パスワードリセット | `useAuth` |
| カレンダー | `/calendar` | 月次/週次/日次ビュー切替。イベント表示・日別ステータス表示 | `useCalendar`, `useDailyOptions` |
| イベント登録 | `/calendar/register` | 新規イベント作成（単発/期間/繰り返し） | `useEventForm`, `useCalendar` |
| イベント詳細 | `/calendar/[id]` | イベント詳細閲覧 | `useCalendar` |
| イベント編集 | `/calendar/[id]/edit` | 既存イベント編集 | `useEventForm`, `useCalendar` |
| 出退勤管理 | `/attendance` | 出退勤状況管理 | - |
| ランチシャッフル | `/lunch` | ランチチームのランダム編成。リアルタイム共有 | `useLunchShuffle` |
| ユーザー一覧 | `/users` | ユーザー一覧表示 | `useUserProfile`, `useMaster` |
| ユーザー新規作成 | `/users/new` | ユーザーアカウント・プロフィール作成 | `useUserProfile`, `useAuth` |
| ユーザー詳細 | `/users/[id]` | ユーザープロフィール詳細 | `useUserProfile` |
| ユーザー編集 | `/users/[id]/edit` | ユーザープロフィール編集 | `useUserProfile` |
| 施設一覧 | `/facility` | 施設マスタ一覧 | `useFacility` |
| 施設新規登録 | `/facility/new` | 施設新規登録 | `useFacility` |
| 施設詳細 | `/facility/[id]` | 施設詳細情報 | `useFacility` |
| 施設編集 | `/facility/[id]/edit` | 施設情報編集 | `useFacility` |
| 備品一覧 | `/equipment` | 備品マスタ一覧 | `useEquipment` |
| 備品新規登録 | `/equipment/new` | 備品新規登録 | `useEquipment` |
| 備品詳細 | `/equipment/[id]` | 備品詳細情報 | `useEquipment` |
| 備品編集 | `/equipment/[id]/edit` | 備品情報編集 | `useEquipment` |
| 部署一覧 | `/section` | 部署マスタ一覧 | `useSection` |
| 部署新規登録 | `/section/new` | 部署新規登録 | `useSection` |
| 部署詳細 | `/section/[id]` | 部署詳細情報 | `useSection` |
| 部署編集 | `/section/[id]/edit` | 部署情報編集 | `useSection` |
| チーム一覧 | `/team` | チーム一覧表示 | `useTeam` |
| チーム新規登録 | `/team/new` | チーム新規登録 | `useTeam` |
| チーム詳細 | `/team/[id]` | チーム詳細情報 | `useTeam` |
| チーム編集 | `/team/[id]/edit` | チーム情報編集 | `useTeam` |
| Wiki トップ | `/wiki` | Wiki トップページ。人気記事・カテゴリ一覧 | `useMaster` |
| Wiki 記事新規作成 | `/wiki/new` | 記事新規作成（Markdownエディタ） | `useMaster` |
| Wiki 記事一覧 | `/wiki/articles` | 記事一覧検索 | `useMaster` |
| Wiki 記事詳細 | `/wiki/[id]` | 記事閲覧（Markdownレンダリング） | `useMaster` |
| Wiki 記事編集 | `/wiki/[id]/edit` | 記事編集 | `useMaster` |
| Wiki カテゴリ | `/wiki/category` | カテゴリ管理 | `useMaster` |
| Wiki タグ | `/wiki/tag` | タグ管理 | `useMaster` |
| 祝日管理 | `/holiday` | 祝日マスタ管理 | `useMaster` |
| 経費管理 | `/expense` | 経費精算管理 | `useCsvFirestore` |
| 売上管理 | `/sales` | 売上データ管理・チャート表示 | `useCsvFirestore` |
| タスク管理 | `/task` | タスク管理 | - |
| プロフィール | `/profile` | マイプロフィール表示 | `useUserProfile` |
| プロフィール編集 | `/profile/edit` | マイプロフィール編集 | `useUserProfile`, `useAuth` |
| 設定 | `/setting` | アプリケーション設定 | - |
| ヘルプ | `/help` | ヘルプページ | - |
| メンテナンス | `/maintenance` | メンテナンス管理 | - |

---

## ４．サーバーサイド

### １）Firestore

#### ルール設定

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**概要:**
- 認証済みユーザーは全コレクション・全ドキュメントに対して読み書き可能
- 未認証ユーザーはアクセス不可

#### インデックス定義

| No | コレクション | フィールド | 概要 |
|----|-------------|----------|------|
| 1 | `event_instances` | `masterId` (ASC) + `instanceDate` (ASC) | マスターIDと日付によるインスタンス検索 |
| 2 | `events` | `dateType` (ASC) + `startDate` (ASC) | 日付タイプと開始日によるイベント検索 |
| 3 | `events` | `equipmentIds` (CONTAINS) + `dateType` (ASC) | 備品IDによるイベント検索 |
| 4 | `events` | `facilityIds` (CONTAINS) + `dateType` (ASC) | 施設IDによるイベント検索 |
| 5 | `events` | `participantIds` (CONTAINS) + `date` (ASC) | 参加者IDと日付によるイベント検索 |
| 6 | `events` | `participantIds` (CONTAINS) + `dateType` (ASC) | 参加者IDと日付タイプによるイベント検索 |
| 7 | `users` | `status` (ASC) + `displayName` (ASC) | ステータスと表示名によるユーザー検索 |

### ２）Functions

#### 処理一覧

| No | 関数名 | トリガー種別 | 概要 |
|----|--------|------------|------|
| 1 | `initialCacheGeneration` | HTTP (onRequest) | 既存全イベントから週別キャッシュファイルを一括生成する初期移行用バッチ処理 |
| 2 | `onEventChangeRecalculateCache` | Firestore (onWrite) | `events/{eventId}` の変更を検知し、該当週のキャッシュファイルを自動再生成 |

#### 処理詳細

##### (1) `initialCacheGeneration`

```
トリガー: HTTP リクエスト
ランタイム: timeoutSeconds: 300, memory: 1GB
処理フロー:
  1. events コレクションから全ドキュメントの date フィールドを取得
  2. 各日付から ISO 週番号キー (YYYY-WW) を算出し、一意な週キーセットを収集
  3. 各週キーに対応する日付範囲（月曜〜日曜）を計算
  4. 範囲内のイベントを Firestore から取得し、EventDisplay 形式に変換
  5. JSON形式のキャッシュデータを Cloud Storage にアップロード
  6. 全週キーの処理結果をレスポンスとして返却

出力ファイル: gs://{bucket}/calendar-cache/{YYYY-WW}-cache.json
```

##### (2) `onEventChangeRecalculateCache`

```
トリガー: Firestore onWrite - events/{eventId}
処理フロー:
  1. 変更されたイベントの date フィールドを取得（更新前 or 更新後）
  2. 該当日の ISO 週番号キー (YYYY-WW) を算出
  3. 該当週の日付範囲（月曜〜日曜）を計算
  4. 範囲内の全イベントを再取得し、キャッシュデータを再生成
  5. Cloud Storage のキャッシュファイルを上書きアップロード

キャッシュファイル構造:
{
  generatedAt: string (ISO 8601),
  startDate: string (YYYY-MM-DD),
  endDate: string (YYYY-MM-DD),
  eventsCount: number,
  events: EventDisplay[] (日付・開始時間でソート済み)
}
```

---

## ５．要件定義書

### 5.1 システム概要

本システム「Tascal」は、社内グループウェアとして、スケジュール管理を中核とした業務効率化プラットフォームである。社員間のコミュニケーション促進と情報共有の一元化を目的とする。

### 5.2 機能要件

#### FR-01: 認証・アカウント管理
- FR-01-01: メール/パスワードによるユーザー認証
- FR-01-02: パスワードリセット（メール送信）
- FR-01-03: メールアドレス変更（確認メール送信）
- FR-01-04: ユーザーアカウントの作成・編集・無効化
- FR-01-05: ユーザー権限管理（admin / user / viewer）
- FR-01-06: 非アクティブアカウントの自動ログアウト

#### FR-02: カレンダー・スケジュール管理
- FR-02-01: 月次/週次/日次ビュー切替
- FR-02-02: 単発イベントの登録・編集・削除
- FR-02-03: 期間イベントの登録（日単位で実体化）
- FR-02-04: 繰り返しイベントの登録（日次/週次/平日/月次/年次/カスタム）
- FR-02-05: 繰り返し間隔の設定（n日ごと、n週ごと等）
- FR-02-06: 繰り返し終了条件（無期限/指定日/指定回数）
- FR-02-07: イベント種別の設定（通常業務/会議/集中作業/外出・出張/休暇・不在/その他）
- FR-02-08: 優先度の設定（低/中/高）
- FR-02-09: 参加者・施設・備品のアサイン
- FR-02-10: プライベートイベント機能（他ユーザーからの非公開マスキング）
- FR-02-11: 繰り返しイベントの一括削除/以降削除/以前削除/単体削除
- FR-02-12: 祝日表示
- FR-02-13: カレンダー位置の永続化（ローカルストレージ）
- FR-02-14: イベントの時間重複検知（参加者・施設・備品）

#### FR-03: 日別ステータス管理
- FR-03-01: 勤務形態の登録（出社/リモート/外出・出張/休暇）
- FR-03-02: ランチ会参加可否の登録
- FR-03-03: 夕食会参加可否の登録
- FR-03-04: カレンダー上でのステータスアイコン表示

#### FR-04: ランチシャッフル
- FR-04-01: 参加者名のリアルタイム共有入力（最大20名）
- FR-04-02: Fisher-Yatesアルゴリズムによるランダムチーム分け
- FR-04-03: 3〜4名を基本としたチームサイズ自動最適化
- FR-04-04: タイムスタンプ付きシャッフル結果の表示・保存
- FR-04-05: 全クリア機能

#### FR-05: リソースマスタ管理
- FR-05-01: 施設マスタのCRUD（名前/コード/カテゴリ/定員/ステータス）
- FR-05-02: 備品マスタのCRUD（名前/コード/カテゴリ/数量/ステータス）
- FR-05-03: 部署マスタのCRUD
- FR-05-04: チームマスタのCRUD（メンバー管理含む）

#### FR-06: ユーザー管理
- FR-06-01: ユーザー一覧表示・検索
- FR-06-02: ユーザープロフィール作成（Firebase Auth + Firestoreプロフィール同時作成）
- FR-06-03: ユーザープロフィール編集
- FR-06-04: ユーザーステータス切替（active/inactive）
- FR-06-05: 部署別・権限別のユーザー絞り込み
- FR-06-06: 部署統計

#### FR-07: 社内Wiki
- FR-07-01: Markdown記事の作成・編集
- FR-07-02: カテゴリ・タグによる記事分類
- FR-07-03: 記事検索
- FR-07-04: 閲覧数カウント
- FR-07-05: 記事バージョン管理（履歴サブコレクション）
- FR-07-06: 記事ステータス管理（公開/下書き/アーカイブ）
- FR-07-07: 人気記事表示

#### FR-08: データ入出力
- FR-08-01: CSVインポート（PapaParse）
- FR-08-02: CSVエクスポート（BOM付きUTF-8、Excel互換）
- FR-08-03: CSVテンプレート生成
- FR-08-04: インポート時データバリデーション

#### FR-09: AI連携
- FR-09-01: Vertex AI (Gemini 2.0 Flash) との連携基盤

### 5.3 非機能要件

#### NFR-01: パフォーマンス
- NFR-01-01: イベントキャッシュによる高速表示（Cloud Storage週別JSONキャッシュ）
- NFR-01-02: マスターデータキャッシュ（10時間TTL）
- NFR-01-03: Firestoreクエリプロファイリング機能
- NFR-01-04: IN/array-contains-any クエリの30要素制限回避（チャンク分割並列クエリ）
- NFR-01-05: ページネーション対応（カーソルベース）

#### NFR-02: リアルタイム性
- NFR-02-01: Firestoreリアルタイムリスナーによるデータ同期
- NFR-02-02: ランチシャッフルのリアルタイム共有
- NFR-02-03: WebSocket通信基盤

#### NFR-03: セキュリティ
- NFR-03-01: Firebase Authentication によるアクセス制御
- NFR-03-02: Firestoreセキュリティルール（認証必須）
- NFR-03-03: XSS対策（DOMPurify）
- NFR-03-04: メール変更時の確認メール送信
- NFR-03-05: 管理者権限判定（Custom Claims: admin）

#### NFR-04: 可用性
- NFR-04-01: SPA（CSR）モード（ssr: false）
- NFR-04-02: Firebase Hosting によるCDN配信
- NFR-04-03: Cloud Functionsによるサーバーレスアーキテクチャ

#### NFR-05: 保守性
- NFR-05-01: Composition API + Composableパターンによるロジック分離
- NFR-05-02: TypeScript型定義による型安全性
- NFR-05-03: Nuxt3のファイルベースルーティング
- NFR-05-04: コンポーネントの自動インポート

---

## ６．基本設計書

### 6.1 システムアーキテクチャ

```
┌──────────────────────────────────────────────────────────┐
│                      クライアント                         │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐    │
│  │   Nuxt 3   │  │ Vuetify 3 │  │  Vue 3 (SPA/CSR) │    │
│  │  (Router)  │  │   (UI)    │  │ Composition API  │    │
│  └─────┬──────┘  └─────┬─────┘  └────────┬─────────┘    │
│        │               │                  │              │
│  ┌─────┴───────────────┴──────────────────┴─────────┐    │
│  │              Composables / Services               │    │
│  │  useCalendar / useEventForm / useLunchShuffle ... │    │
│  └──────────────────────┬────────────────────────────┘    │
│                         │                                 │
│  ┌──────────────────────┴────────────────────────────┐    │
│  │            Firebase Client SDK                     │    │
│  │  Auth / Firestore / Storage / Vertex AI            │    │
│  └──────────────────────┬────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼────────────────────────────────┐
│                    Firebase Backend                        │
│  ┌──────────────┐ ┌─────┴──────┐ ┌──────────────────┐    │
│  │    Auth      │ │  Firestore │ │  Cloud Storage   │    │
│  │ (認証基盤)   │ │  (DB)      │ │  (キャッシュ)     │    │
│  └──────────────┘ └─────┬──────┘ └────────┬─────────┘    │
│                         │                  │              │
│  ┌──────────────────────┴──────────────────┴─────────┐    │
│  │              Cloud Functions                       │    │
│  │  onEventChangeRecalculateCache (Firestoreトリガー) │    │
│  │  initialCacheGeneration (HTTPトリガー)              │    │
│  └───────────────────────────────────────────────────┘    │
│                                                           │
│  ┌───────────────────┐ ┌────────────────────┐            │
│  │    Vertex AI      │ │  Firebase Hosting  │            │
│  │  (Gemini 2.0)     │ │  (静的ファイル配信) │            │
│  └───────────────────┘ └────────────────────┘            │
└───────────────────────────────────────────────────────────┘
```

### 6.2 認証フロー

```
[ユーザー] → ログイン画面 (/signin)
    │
    ├─ メール/パスワード入力
    │
    ├─ Firebase Auth: signInWithEmailAndPassword()
    │   │
    │   ├─ 成功 → onAuthStateChanged コールバック
    │   │   │
    │   │   ├─ Firestore: users/{uid} からプロフィール取得
    │   │   ├─ ステータスチェック (inactive → 強制ログアウト)
    │   │   ├─ Custom Claims チェック (admin フラグ)
    │   │   └─ useState にユーザー情報セット → ダッシュボードへ遷移
    │   │
    │   └─ 失敗 → エラー表示
    │
    └─ 未認証で保護ページへアクセス
        → router.global.ts → /signin へリダイレクト
```

### 6.3 イベントキャッシュアーキテクチャ

```
【書き込みフロー】
  クライアント
    └─ eventService.createEvent()
        └─ Firestore: events コレクションにバッチ書き込み
            └─ Cloud Functions: onEventChangeRecalculateCache トリガー
                ├─ 変更されたイベントの date から週キー (YYYY-WW) を算出
                ├─ 該当週の全イベントを Firestore から再取得
                ├─ EventDisplay 形式に変換 + ソート
                └─ Cloud Storage: calendar-cache/{YYYY-WW}-cache.json

【読み取りフロー】
  クライアント
    └─ useCalendar.refreshEvents()
        ├─ 表示範囲から必要な週キーを計算
        ├─ eventService.getEventsFromCacheAsync(weekKey)
        │   └─ Cloud Storage から HTTP GET
        │       (cache: 'no-store' でキャッシュ無効化)
        ├─ 複数週の結果を統合・重複排除
        ├─ プライベートイベントのマスキング処理
        └─ events.value にセット (リアクティブ)
```

### 6.4 イベント実体化方式

繰り返し・期間イベントは登録時にFirestore上で日単位の実体ドキュメントとして生成される。

```
【単発イベント】
  EventFormData (dateType: 'single')
    → 1件の events ドキュメント作成

【期間イベント】
  EventFormData (dateType: 'range', startDate, endDate)
    → 開始日〜終了日の各日に1件ずつ events ドキュメント作成
    → 全ドキュメントに同一 masterId を付与

【繰り返しイベント】
  EventFormData (dateType: 'recurring')
    → generateRecurringDates() で対象日付を生成（最大1年先まで）
    → 各日付に1件ずつ events ドキュメント作成
    → 全ドキュメントに同一 masterId を付与
    → バッチ書き込み (writeBatch) で一括登録
```

### 6.5 マスターデータキャッシュ戦略

```
┌─────────────────────────────────────────────────┐
│           masterDataCache (useState)             │
│  Map<string, { data, timestamp, promise? }>      │
│                                                  │
│  キー           │ TTL     │ 内容                │
│  ──────────────┼─────────┼────────────────────  │
│  users          │ 10時間  │ ユーザー一覧         │
│  holidays       │ 10時間  │ 祝日一覧            │
│  facilities     │ 10時間  │ 施設一覧            │
│  equipments     │ 10時間  │ 備品一覧            │
│  dailyOptions:  │ 1時間   │ 日別ステータス       │
│  YYYY-MM-DD_    │         │ (日付範囲別キャッシュ) │
│  YYYY-MM-DD     │         │                     │
└─────────────────────────────────────────────────┘

- forceRefresh=true でキャッシュを無視して再取得
- Promise ベースの同時リクエスト防止
- 日別ステータス更新時はキャッシュを明示的にクリア
```

### 6.6 ミドルウェア（ルーティングガード）

```
router.global.ts:
  ┌─ リクエスト受信
  │
  ├─ auth.currentUser が null
  │  かつ 遷移先が /signin 以外 かつ /auth/* 以外
  │   └─ /signin にリダイレクト
  │
  ├─ auth.currentUser が存在 かつ 遷移先が /signin
  │   └─ / (ダッシュボード) にリダイレクト
  │
  └─ その他 → 通常遷移
```

### 6.7 プラグイン初期化順序

```
1. firebase.client.ts (クライアントサイドのみ)
   ├─ Firebase App 初期化
   ├─ Firestore 初期化 (ignoreUndefinedProperties: true)
   ├─ Auth 初期化 + onAuthStateChanged リスナー設定
   ├─ Storage, Functions (asia-northeast1), Analytics 初期化
   ├─ Vertex AI (Gemini 2.0 Flash) モデル初期化
   └─ 各インスタンスを useState で全体共有

2. initState.ts
   ├─ AppState 初期化 (drawer: true, rail: true)
   └─ useState で全体共有

3. chart.ts
   └─ Chart.js インスタンスを provide で全体共有
```

### 6.8 デザインシステム

CSS カスタムプロパティによるテーマ定義:

| カテゴリ | プロパティ | 値 | 用途 |
|---------|----------|-----|------|
| ブランドカラー | `--primary-color` | `#4a6cf7` | メインアクション |
| | `--primary-light` | `#edf2ff` | 背景ハイライト |
| | `--primary-hover` | `#3a56d4` | ホバー時 |
| セマンティック | `--success-color` | `#28a745` | 成功 |
| | `--warning-color` | `#ffc107` | 警告 |
| | `--danger-color` | `#dc3545` | エラー・危険 |
| | `--info-color` | `#17a2b8` | 情報 |
| イベント種別 | `--event-1` | `#4361ee` | 会議 |
| | `--event-2` | `#F95A5A` | 集中作業 |
| | `--event-3` | `#00C2FF` | 外出・出張 |
| | `--event-4` | `#34D399` | その他 |
| | `--event-5` | `#F59E0B` | 休暇・不在 |
| | `--event-6` | `#6c757d` | 通常業務 |
| ボーダー半径 | `--radius` | `4px` | 小 |
| | `--radius-sm` | `6px` | 標準 |
| | `--radius-md` | `10px` | 中 |
| | `--radius-lg` | `16px` | 大 |
| シャドウ | `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.04)` | 軽い |
| | `--shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` | 標準 |
| | `--shadow-lg` | `0 10px 25px rgba(0,0,0,0.08)` | 強い |

---

*本ドキュメントはソースコードの静的解析に基づき自動生成されています。*
*最終更新: 2026-02-23*
