# デプロイ手順書

## 前提条件

- Google アカウントを持っていること
- Node.js 18+ がインストールされていること
- Git が使えること

---

## Step 1: Firebase プロジェクトの作成

### 1.1 Firebase コンソールにアクセス

1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `self-management-app`）
4. Google アナリティクスは**無効**でOK（個人利用のため）
5. 「プロジェクトを作成」をクリック

### 1.2 料金プランの変更

1. 左下の「Spark」（無料プラン）をクリック
2. **Blaze プラン**（従量課金）に変更
   - 個人利用では無料枠内に収まるため実質無料
   - App Hosting を使うには Blaze プランが必要
3. 予算アラートを **$5/月** に設定（安全策）

### 1.3 Web アプリの登録

1. プロジェクトの概要ページで「</>」（Web）アイコンをクリック
2. アプリのニックネームを入力（例: `self-management-web`）
3. 「Firebase Hosting もこのアプリに設定する」は**チェック不要**（App Hosting を使うため）
4. 「アプリを登録」をクリック
5. 表示される **firebaseConfig** の値をメモする：
   ```
   apiKey: "AIza..."
   authDomain: "your-project.firebaseapp.com"
   projectId: "your-project-id"
   storageBucket: "your-project.firebasestorage.app"
   messagingSenderId: "123..."
   appId: "1:123..."
   ```

---

## Step 2: Firebase サービスの有効化

### 2.1 Authentication の設定

1. 左メニュー「Authentication」→「始める」
2. 「ログイン方法」タブ → 「Google」をクリック
3. 「有効にする」をトグルON
4. サポートメール: 自分のメールアドレスを選択
5. 「保存」

### 2.2 Firestore の作成

1. 左メニュー「Firestore Database」→「データベースの作成」
2. ロケーション: **asia-northeast1 (Tokyo)** を選択
3. セキュリティルール: 「本番モードで開始」を選択
4. 「作成」をクリック

### 2.3 セキュリティルールのデプロイ

1. Firestore の「ルール」タブを開く
2. 以下のルールを貼り付けて「公開」:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### 2.4 （推奨）シングルユーザー制限

アプリに一度ログインした後、Firebase コンソールの Authentication → Users で自分の **UID** を確認し、セキュリティルールを以下に変更:

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId
                     && request.auth.uid == 'ここに自分のUIDを貼る';
}
```

---

## Step 3: ローカル環境の設定

### 3.1 リポジトリのクローン

```bash
git clone <リポジトリURL>
cd claude_code_test
npm install
```

### 3.2 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集し、Step 1.3 でメモした値を記入:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
```

### 3.3 ローカル動作確認

```bash
npm run dev
```

http://localhost:3000 にアクセスし、Google ログインが動作することを確認。

---

## Step 4: デプロイ（Firebase App Hosting）

### 方法 A: Firebase App Hosting（推奨）

Firebase App Hosting は Next.js の SSR に対応した新しいホスティングサービスです。

#### 4A.1 Firebase CLI のインストール

```bash
npm install -g firebase-tools
firebase login
```

#### 4A.2 Firebase プロジェクトの初期化

```bash
firebase init apphosting
```

対話式で以下を選択:
- プロジェクト: Step 1 で作成したプロジェクト
- GitHub リポジトリ: このリポジトリを接続
- ブランチ: `main`（デプロイするブランチ）
- リージョン: `asia-northeast1`

#### 4A.3 環境変数の設定

Firebase コンソール → App Hosting → 設定で、以下の環境変数を追加:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### 4A.4 デプロイ

```bash
git push origin main
```

GitHub に push すると自動でビルド＆デプロイされます。
Firebase コンソールの App Hosting でデプロイ状況を確認できます。

### 方法 B: Vercel（代替）

Firebase App Hosting がうまくいかない場合の代替手段です。

```bash
npm install -g vercel
vercel
```

対話式で設定後、Vercel ダッシュボードで環境変数を設定:
- Settings → Environment Variables に Step 3.2 と同じ値を追加

---

## Step 5: デプロイ後の確認

1. デプロイされた URL にアクセス
2. Google ログインが動作することを確認
3. タスクの追加・完了が動作することを確認
4. 他のタブ（習慣、振り返り、スケジュール）を確認

### Authentication の承認ドメイン設定

デプロイ後の URL でログインエラーが出る場合:

1. Firebase コンソール → Authentication → Settings → 承認済みドメイン
2. デプロイ先のドメインを追加（例: `your-app.web.app`）

---

## テストの実行

```bash
# 単体 + コンポーネントテスト（96件）
npm test

# E2Eテスト（Playwright ブラウザが必要）
npx playwright install chromium
npm run test:e2e
```

---

## 費用の目安

個人利用（1日数回アクセス）の場合:

| サービス | 無料枠 | 見込み使用量 | 費用 |
|---|---|---|---|
| Firestore 読み取り | 50,000/日 | ~100/日 | $0 |
| Firestore 書き込み | 20,000/日 | ~50/日 | $0 |
| Authentication | 無制限 | 1ユーザー | $0 |
| App Hosting | 一定の無料枠 | 低トラフィック | $0〜数円 |
| **合計** | | | **実質 $0** |
