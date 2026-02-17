# 自己管理アプリ - マニュアル

タスク・習慣・スケジュール・振り返り・年間目標を一元管理する個人向けWebアプリです。

---

## 目次

- [ローカル実行手順](#ローカル実行手順)
- [Firebase接続（本番モード）](#firebase接続本番モード)
- [機能ガイド](#機能ガイド)
  - [ダッシュボード](#ダッシュボード)
  - [タスク管理](#タスク管理)
  - [習慣トラッキング](#習慣トラッキング)
  - [スケジュール管理](#スケジュール管理)
  - [振り返り](#振り返り)
  - [年間目標・マイルストーン](#年間目標マイルストーン)
  - [設定](#設定)
- [技術スタック](#技術スタック)
- [NPMスクリプト一覧](#npmスクリプト一覧)
- [ディレクトリ構成](#ディレクトリ構成)

---

## ローカル実行手順

Firebase のセットアップなしで、すぐにローカルで動作確認できます。

### 前提条件

- Node.js 18 以上
- npm

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/Qummme/self_management_app.git
cd self_management_app

# 2. 依存パッケージをインストール
npm install

# 3. 開発サーバーを起動
npm run dev
```

http://localhost:3000 にアクセスすると、アプリが起動します。

### ローカルモード（モックモード）の動作

`.env.local` を作成せずに起動すると、自動的にモックモードで動作します。

| 項目 | 動作 |
|------|------|
| 認証 | モックユーザー（`dev@localhost`）で自動ログイン |
| データ保存先 | ブラウザの localStorage |
| データの永続性 | ブラウザをリロードしても保持される |
| ログアウト | ログインページに戻り、再度ログイン可能 |

Firebase の設定は一切不要で、全機能をローカルで試すことができます。

---

## Firebase接続（本番モード）

実際に Firebase を使ってデータを永続化する場合は、以下の手順でセットアップします。

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で Google ログインを有効化
3. Firestore Database を作成

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Firebase の設定値を入力します。

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. 起動

```bash
npm run dev
```

`.env.local` が設定されている場合、自動的に Firebase に接続されます。切替のための追加設定は不要です。

---

## 機能ガイド

### 画面構成

アプリは下部ナビゲーションで 4 つのセクションに分かれています。

| アイコン | ラベル | パス | 内容 |
|----------|--------|------|------|
| Home | ダッシュボード | `/dashboard` | 日次のタスク・習慣・スケジュール・振り返り |
| Target | 目標 | `/goals` | 年間目標とマイルストーン |
| Calendar | スケジュール | `/schedule` | 理想の1日テンプレート |
| Settings | 設定 | `/settings` | アカウント・データ管理 |

---

### ダッシュボード

メイン画面です。日付ごとに 4 つのタブで日次データを管理します。

- ヘッダーの矢印で前日・翌日に移動
- カレンダーアイコンで任意の日付にジャンプ
- 進行中のマイルストーンがヘッダー下部に表示されます

---

### タスク管理

日ごとのToDoリストです。

- テキスト入力して追加（Enter キーでも追加可能）
- タップでタスクの完了/未完了を切替
- 削除ボタンでタスクを削除
- 完了数 / 全体数がタブに表示されます

---

### 習慣トラッキング

日々の習慣を記録・管理します。

**習慣の追加:**
- タイトルと頻度（毎日 / 平日 / 週末 / カスタム）を設定

**日次の記録:**
- その日に該当する習慣が一覧表示される
- チェックを入れると完了として記録
- 達成率がパーセンテージで表示されます

---

### スケジュール管理

1日の時間割を管理します。2つの画面があります。

**理想の1日（`/schedule`）:**
- テンプレートとして理想のスケジュールを登録
- 開始時刻・終了時刻・タイトル・カテゴリ・色を設定

**日次スケジュール（ダッシュボードのスケジュールタブ）:**
- 理想のスケジュールからコピーして、その日のスケジュールを作成
- 各ブロックのステータスを管理（予定 → 完了 / スキップ）

---

### 振り返り

1日の終わりに振り返りを記録します。

- 振り返り項目をテキストで自由に追加
- 気分を 5 段階で選択（1:低い ～ 5:高い）
- 入力は自動保存されます（2秒のデバウンス）

---

### 年間目標・マイルストーン

年間の目標を設定し、マイルストーンで進捗を管理します。

**目標:**
- タイトル・カテゴリ・説明を入力して作成
- ステータス: 進行中 / 達成 / 中止

**マイルストーン:**
- 各目標に対して中間地点（マイルストーン）を設定
- 期限日を設定し、チェックで完了にする
- 進捗率がプログレスバーで表示されます
- ダッシュボード上部に直近のマイルストーンが表示されます

---

### 設定

- **アカウント:** ログイン中のメールアドレス表示、ログアウト
- **データエクスポート:** 全データをJSON形式でダウンロード

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| アイコン | Lucide React |
| フォーム | React Hook Form |
| ドラッグ&ドロップ | @dnd-kit |
| 日付操作 | date-fns |
| バックエンド | Firebase (Auth, Firestore) |
| テスト | Vitest, Testing Library, Playwright |

---

## NPMスクリプト一覧

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm run test` | ユニットテスト実行（1回） |
| `npm run test:watch` | テスト（ウォッチモード） |
| `npm run test:e2e` | E2Eテスト実行（Playwright） |

---

## ディレクトリ構成

```
src/
├── app/                          # ページ（Next.js App Router）
│   ├── page.tsx                 # / → ダッシュボードへリダイレクト
│   ├── login/page.tsx           # ログイン画面
│   ├── dashboard/
│   │   ├── page.tsx             # /dashboard → 今日の日付へリダイレクト
│   │   └── [date]/page.tsx      # 日次ダッシュボード
│   ├── goals/page.tsx           # 年間目標
│   ├── schedule/page.tsx        # 理想のスケジュール
│   └── settings/page.tsx        # 設定
│
├── components/                   # UIコンポーネント
│   ├── auth/                    # 認証（AuthProvider, ProtectedRoute）
│   ├── layout/                  # レイアウト（BottomNav, Header）
│   ├── dashboard/               # ダッシュボードタブ
│   └── calendar/                # カレンダーモーダル
│
├── lib/
│   ├── firebase/                # Firebase連携（auth, firestore, config）
│   ├── mock/                    # ローカル開発用モック（auth, firestore）
│   ├── types/                   # TypeScript型定義
│   └── utils/                   # ユーティリティ（date, habit, milestone）
│
└── __tests__/                    # テストファイル
```
