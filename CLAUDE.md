# MasaASP - 開発ドキュメント

## 📋 プロジェクト概要

**MasaASP**は不動産クラウドファンディングのアフィリエイト管理システムです。
多段階の紹介報酬計算、組織図表示、CSVデータ管理機能を提供します。

## 🌐 アクセスURL

- **本番環境**: https://masaasp.vercel.app
- **認証セットアップ**: https://masaasp.vercel.app/auth-setup (ログイン不要)
- **管理者ダッシュボード**: https://masaasp.vercel.app/admin-dashboard
- **通常ダッシュボード**: https://masaasp.vercel.app/dashboard

## 👤 ログイン情報

### テストアカウント（auth-setupで作成）
- **管理者**: admin@masaasp.com / admin123
- **テスト**: test@masaasp.com / test123
- **一般**: login@masaasp.com / login123

## 🗺️ ページ構成

### 公開ページ（認証不要）
- `/login` - ログインページ
- `/auth-setup` - 緊急認証セットアップ
- `/access-denied` - アクセス拒否
- `/unauthorized` - 権限不足

### 管理者専用ページ
- `/admin-dashboard` - 管理者ダッシュボード（管理者のみ）
- `/admin` - データ管理・CSVアップロード

### 認証必須ページ
- `/dashboard` - 通常ユーザーダッシュボード
- `/organization` - 組織図
- `/rewards` - 報酬一覧

## 📊 データベース構造

### users テーブル
- `user_id` - ユーザーID（一意）
- `mail_address` - メールアドレス
- `kanji_last_name` / `kanji_first_name` - 氏名（漢字）
- `furi_last_name` / `furi_first_name` - 氏名（カナ）
- `system_access_flg` - システムアクセス権限
- `admin_flg` - 管理者権限

### camel_levels テーブル
- 組織階層構造データ
- `upline` - 紹介者
- `depth_level` - 階層深度

### investment_history テーブル
- 投資履歴データ
- `fund_name` - ファンド名
- `amount` - 投資額
- `payment_date` - 入金日

### calculated_rewards テーブル
- 計算済み報酬データ

## 🔧 管理機能

### CSVアップロード
1. `/admin`にアクセス
2. 各セクションでCSVファイルを選択
3. アップロードボタンをクリック

### サポートするCSVファイル
- **ユーザーデータ**: tb_user作成_暗号化処理済み_1.csv
- **組織データ**: tb_camel_level_2.csv
- **投資履歴**: CAMEL入金履歴編集_ID入力済み_1.csv
- **マッチングデータ**: Matched_Data_2.csv

## ⚠️ トラブルシューティング

### ログインできない場合
1. https://masaasp.vercel.app/auth-setup にアクセス
2. 「認証アカウントを作成する」をクリック
3. 表示された認証情報でログイン

### CSVアップロードエラー
- ファイルサイズ上限: 10MB
- 重複データは自動的にスキップ
- 「重複分析」ボタンで詳細確認可能

### 権限エラー
- `system_access_flg`が`true`である必要があります
- 管理画面は`admin_flg`が`true`である必要があります

## 🚀 デプロイ情報

- **ホスティング**: Vercel
- **データベース**: Supabase
- **認証**: Supabase Auth
- **自動デプロイ**: GitHubのmainブランチにプッシュで自動デプロイ

## 📝 開発メモ

### 環境変数（.env.local）
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 主要な技術スタック
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Lucide React (Icons)

## 🔐 セキュリティ

- Row Level Security (RLS) 有効
- ミドルウェアでルート保護
- 管理者権限の二重チェック

## 📞 サポート

問題が発生した場合：
1. `/auth-setup`で認証リセット
2. `/admin`の緊急修復ボタンを使用
3. Supabaseダッシュボードで直接確認

---

最終更新: 2024年12月