import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // This endpoint provides manual SQL instructions since
    // we cannot execute arbitrary SQL from serverless functions
    return NextResponse.json({
      success: false,
      error: 'APIからの自動修正はサポートされていません。手動でSQLを実行してください。',
      manual_sql: `-- Supabaseダッシュボード > SQL Editor で以下を実行:

-- 1. RLSを一時的に無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Allow public read for login" ON users;
DROP POLICY IF EXISTS "Allow public read for authentication" ON users;

-- 3. password_hashを必須でなくする
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 4. 新しいポリシーを作成
CREATE POLICY "Allow public read for authentication"
  ON users
  FOR SELECT
  USING (true);

-- 5. RLSを再有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
      instructions: [
        '1. Supabaseダッシュボードにアクセス',
        '2. 左メニューから「SQL Editor」を選択',
        '3. 上記のSQLをコピー&ペーストして実行',
        '4. 実行完了後、ログインを再試行'
      ]
    })

  } catch (error) {
    console.error('Fix RLS error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      manual_instructions: 'Supabaseダッシュボードで手動でRLSポリシーを修正してください'
    }, { status: 500 })
  }
}