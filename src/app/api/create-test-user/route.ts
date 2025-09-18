import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Create test user in database
    const testUser = {
      user_id: 'TEST001',
      password: 'test123',
      mail_address: 'test@masaasp.com',
      kanji_last_name: 'テスト',
      kanji_first_name: '太郎',
      furi_last_name: 'テスト',
      furi_first_name: 'タロウ',
      password_hash: 'test_hash_123',
      system_access_flg: true,
      admin_flg: true,
      status_flg: 1,
      make_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    }

    // Insert into database
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .upsert([testUser], { onConflict: 'user_id' })
      .select()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: `Database insert failed: ${insertError.message}`,
        code: insertError.code,
        details: insertError.details
      }, { status: 500 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.mail_address,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        user_id: testUser.user_id,
        full_name: `${testUser.kanji_last_name} ${testUser.kanji_first_name}`
      }
    })

    if (authError) {
      console.warn('Auth user creation failed (might already exist):', authError.message)
      // Don't fail the whole operation if auth user already exists
    }

    return NextResponse.json({
      success: true,
      message: 'テストユーザーを作成しました',
      user: {
        user_id: testUser.user_id,
        email: testUser.mail_address,
        password: testUser.password,
        admin: testUser.admin_flg
      },
      database_result: insertResult,
      auth_result: authData ? 'Created' : `Error: ${authError?.message}`,
      login_instructions: [
        '1. ログインページに移動',
        '2. メールアドレス: test@masaasp.com',
        '3. パスワード: test123',
        '4. または ユーザーID: TEST001 パスワード: test123'
      ]
    })

  } catch (error) {
    console.error('Create test user error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}