# プロジェクトマニュアルドラフト

## 1. プロジェクト概要

このプロジェクトは、Nuxt.js 3 をベースとしたWebアプリケーションであり、様々な管理機能を提供します。主な目的は、ユーザーがカレンダー、備品、施設、ユーザーなどの情報を効率的に管理できるようにすることです。クライアントサイドレンダリング（SSR: false）で動作し、リアルタイムなデータ管理にFirebaseを使用しています。

## 2. 技術スタック

-   **フレームワーク**: Nuxt.js 3 (Vue.js 3)
-   **UIフレームワーク**: Vuetify 3
-   **データベース/バックエンド**: Firebase (Firestore, Authentication, Storageなど)
-   **グラフ描画**: Chart.js
-   **状態管理/ロジック**: Nuxt Composables
-   **スタイル**: CSS (assets/css/main.css)

## 3. 主要機能

アプリケーションは以下の主要な機能モジュールで構成されています。

-   **カレンダー機能 (`pages/calendar/`, `components/Calendar/`, `services/eventService.ts`)**:
    -   **イベントの種類**:
        -   **単一イベント**: 特定の1日のみのイベント。
        -   **期間イベント**: 開始日から終了日までの複数日にわたるイベント。
        -   **繰り返しイベント**: 定期的に発生するイベント。
            -   **繰り返しパターン**:
                -   日次 (`daily`)
                -   週次 (`weekly`, `weekdays` (平日のみ), `custom` (特定の曜日))
                -   月次 (`monthly` (特定の日付または第N週の曜日))
                -   年次 (`yearly`)
            -   **終了条件**:
                -   特定の日付まで (`recurringEndDate`)
                -   特定の回数まで (`recurringCount`)
                -   無期限
    -   **イベント管理**:
        -   **イベント登録**: タイトル、日時、場所、説明、優先度、参加者、関連施設、関連備品を設定してイベントを登録。繰り返しイベントの場合は詳細な繰り返しルールを設定。
        -   **イベント取得**: 指定された期間内のイベントを取得。単一、期間、繰り返しイベントのインスタンスを適切に展開して表示。
        -   **施設・備品によるイベントフィルタリング**: 特定の施設や備品に関連するイベントを期間でフィルタリングして取得。
    -   **表示**: 日次、週次、月次ビューでのイベント表示。
    -   **競合検出**: イベントの登録・編集時に、時間やリソース（施設・備品）の競合を検出。
-   **備品管理機能 (`pages/equipment/`)**:
    -   備品の登録、一覧表示、詳細表示、編集
-   **施設管理機能 (`pages/facility/`)**:
    -   施設の登録、一覧表示、詳細表示、編集
-   **ユーザー管理機能 (`pages/users/`)**:
    -   ユーザーの登録、一覧表示、詳細表示、編集
-   **その他の機能**:
    -   トップページ (`pages/index.vue`)
    -   出席管理 (`pages/attendance/`)
    -   経費管理 (`pages/expense/`)
    -   メンテナンス (`pages/maintenance/`)
    -   売上管理 (`pages/sales/`)
    -   設定 (`pages/setting/`)
    -   サインイン (`pages/signin/`)
    -   タスク管理 (`pages/task/`)
    -   チーム管理 (`pages/team/`)
    -   ヘルプページ (`pages/help/`)

## 4. ディレクトリ構造の概要

主要なディレクトリとその役割は以下の通りです。

-   `assets/`: 静的ファイル（CSS、データファイルなど）
    -   `assets/css/`: グローバルCSSファイル
    -   `assets/data/`: アプリケーションで使用されるJSONデータファイル（例: `apps.json`, `menu.json`, `events.json`など）
-   `components/`: Vueコンポーネント
    -   `components/Calendar/`: カレンダー機能に関連するコンポーネント（日次、週次、月次ビューのサブディレクトリを含む）
-   `composables/`: Nuxt 3のComposables（再利用可能なロジック）
    -   `composables/firebase/`: Firebase関連のロジック（認証、Firestore、ストレージなど）
    -   `composables/firestoreGeneral/`: Firestoreの一般的な操作ロジック
    -   `composables/master/`: マスターデータ関連のロジック
    -   `composables/useCalendar.ts`, `useEventForm.ts` など: 各機能固有のロジック
-   `layouts/`: アプリケーションのレイアウトコンポーネント
-   `middleware/`: ルートミドルウェア
-   `pages/`: アプリケーションのルーティングとページコンポーネント
-   `plugins/`: Nuxtプラグイン（Firebase初期化、Vuetify設定など）
-   `public/`: 静的アセット（faviconなど）
-   `services/`: サービス層のロジック（例: `eventService.ts`）
-   `types/`: TypeScriptの型定義ファイル

## 5. 開発環境のセットアップ

### 依存関係のインストール

プロジェクトのルートディレクトリで、以下のいずれかのコマンドを実行して依存関係をインストールします。

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 開発サーバーの起動

開発サーバーを起動し、`http://localhost:3000` でアプリケーションにアクセスします。

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### プロダクションビルド

プロダクション用にアプリケーションをビルドします。

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

### ローカルでのプロダクションビルドのプレビュー

ビルドされたプロダクションアプリケーションをローカルでプレビューします。

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
