# MasaASP セットアップガイド

## 🚨 重要：Supabase環境変数の設定

現在、CORSエラーが発生している原因は、Supabaseの環境変数が設定されていないためです。

### 1. Supabaseプロジェクトの確認

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. Settings > API から以下の情報を取得：
   - Project URL
   - anon public key
   - service_role key

### 2. 環境変数の設定

`.env.local` ファイルを編集：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wuikvtygigcxiszpvmoh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon_key
SUPABASE_SERVICE_ROLE_KEY=あなたのservice_role_key
```

### 3. アプリケーションの再起動

```bash
npm run dev
```

## 📝 ユーザーパスワードについて

- **ユーザーのパスワードは変更していません**
- emergency123は緊急アクセス用の別ルートでした（現在は削除）
- 元のパスワードでログイン可能です

## 🔐 ログイン方法

### 方法1: 既存のアカウントでログイン
- ユーザーID または メールアドレス
- 元のパスワード

### 方法2: テストアカウントを作成
1. `/auth-setup` にアクセス（認証不要）
2. 「認証アカウントを作成する」をクリック
3. 作成されたアカウント情報でログイン

### 方法3: Supabase Dashboardで直接ユーザー作成
1. Supabase Dashboard > Authentication > Users
2. 「New user」をクリック
3. Email と Password を設定
4. usersテーブルにも対応するレコードを追加

## ⚠️ トラブルシューティング

### CORSエラーが発生する場合
- 環境変数が正しく設定されているか確認
- Supabase URLが正しいか確認
- ブラウザのキャッシュをクリア

### ログインできない場合
- Supabase Authenticationでユーザーが存在するか確認
- usersテーブルに対応するレコードがあるか確認
- system_access_flgがtrueになっているか確認

### データベースアクセスエラー
- Supabase Dashboard > Database > Tables
- Row Level Security (RLS) が無効になっているか確認
- または適切なポリシーが設定されているか確認