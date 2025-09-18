import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Execute RLS fix SQL
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable RLS temporarily
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can read their own data" ON users;
        DROP POLICY IF EXISTS "Allow public read for login" ON users;

        -- Create permissive policy for authentication
        CREATE POLICY "Allow public read for authentication"
          ON users
          FOR SELECT
          USING (true);

        -- Re-enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      `
    })

    if (rlsError) {
      console.error('RLS fix error:', rlsError)
      return NextResponse.json({
        success: false,
        error: `RLS修正エラー: ${rlsError.message}`,
        manual_sql: `
-- Supabaseダッシュボードで以下のSQLを実行してください:

-- 1. RLSを一時的に無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Allow public read for login" ON users;

-- 3. 新しいポリシーを作成
CREATE POLICY "Allow public read for authentication"
  ON users
  FOR SELECT
  USING (true);

-- 4. RLSを再有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        `
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'RLSポリシーが正常に修正されました'
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