import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // テストデータを挿入
    const testUser = {
      user_id: 'TEST_INSERT_' + Date.now(),
      password: 'test123',
      mail_address: `test${Date.now()}@example.com`,
      kanji_last_name: 'テスト',
      kanji_first_name: '太郎',
      system_access_flg: true,
      admin_flg: false
    }

    console.log('Inserting test user:', testUser)

    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: `挿入エラー: ${insertError.message}`,
        details: insertError
      }, { status: 500 })
    }

    // 挿入後の確認
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name')
      .limit(5)

    if (selectError) {
      console.error('Select error:', selectError)
    }

    return NextResponse.json({
      success: true,
      message: 'テストユーザーが正常に挿入されました',
      inserted_user: insertResult,
      current_users: users,
      total_users: users?.length || 0
    })

  } catch (error) {
    console.error('Test insert error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}