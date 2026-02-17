# CLAUDE.md

このファイルは Claude Code がリポジトリを扱う際のガイドです。

## プロジェクト概要

タスク・習慣・スケジュール・振り返り・年間目標を一元管理する個人向けWebアプリ。
Next.js 16 (App Router) + TypeScript + Firebase で構成。

## 設計書

コードの全体像・データモデル・コンポーネント設計・コーディング規約は **[docs/design.md](docs/design.md)** を参照してください。

**重要: コードを変更した場合は `docs/design.md` の該当箇所も必ず更新すること。**

具体的に更新が必要なケース:
- データモデル（型定義）の追加・変更
- 新しいページ・コンポーネントの追加
- Firestore関数の追加・変更
- ユーティリティ関数の追加・変更
- ディレクトリ構成の変更

## コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint
npm run test         # ユニットテスト（Vitest, 1回実行）
npm run test:watch   # テスト（ウォッチモード）
npm run test:e2e     # E2Eテスト（Playwright）
```

## 開発フロー

### テストファースト

1. テストを先に書く（`src/__tests__/` 配下）
2. テストが失敗することを確認
3. 実装する
4. テストが通ることを確認
5. `npm run build` でビルドが通ることを確認

### 変更後の確認手順

```bash
npm run test && npm run build
```

この2つが通ることを変更完了の条件とする。

## コーディング規約（要点）

詳細は [docs/design.md の実装思想・コーディング規約](docs/design.md#実装思想コーディング規約) を参照。

### ファイル配置

| 種類 | 配置 | 命名 |
|------|------|------|
| ページ | `src/app/{route}/page.tsx` | page.tsx |
| コンポーネント | `src/components/{category}/` | PascalCase.tsx |
| ユーティリティ | `src/lib/utils/` | camelCase.ts |
| 型定義 | `src/lib/types/index.ts` に追記 | — |
| テスト | `src/__tests__/{lib,components}/` | 対象名.test.{ts,tsx} |

### 守るべきルール

- **`any` 禁止**: 型は `Pick` + `Partial` で最小限に定義
- **ビジネスロジックは utils に**: コンポーネント内にロジックを書かず `src/lib/utils/` に純粋関数として切り出す
- **ダークモード必須**: Tailwind クラスで light/dark をペアで指定
- **日本語UI**: ラベル・テスト名・コメントは日本語
- **インポート順序**: 外部ライブラリ → コンポーネント → データアクセス → ユーティリティ → 型

### テストの書き方

- ユーティリティ: 全関数・全分岐を網羅
- コンポーネント: ユーザー操作ベース（表示確認・クリック・入力）
- モック対象: `useAuth`, `@/lib/firebase/firestore`
- テストデータ: `make{Type}(overrides?)` ファクトリ関数を使う
- describe/it の説明は日本語

## アーキテクチャの要点

- **データアクセス層** (`src/lib/firebase/`): Firebase未設定時は自動的にlocalStorageモックに切替
- **認証**: `AuthProvider` → `ProtectedRoute` → `useAuth()` の3層
- **ページ構造**: `export default Page` (検証+ProtectedRoute) → `Content` (非公開, ロジック)
- **タブコンポーネント**: データは親から受け取り、変更後は `onXxxChange()` コールバックで親にリロードを委譲
