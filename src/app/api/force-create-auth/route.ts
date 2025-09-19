import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, user_id, name } = await request.json()

    if (!email || !password || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'メール、パスワード、ユーザーIDが必要です'
      }, { status: 400 })
    }

    const supabase = createClient()

    // First delete existing auth user if exists (to avoid conflicts)
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(user => user.email === email)

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id)
      }
    } catch (deleteError) {
      // Ignore delete errors
    }

    // Create new auth user with admin privileges
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        user_id: user_id,
        full_name: name || `${user_id}`,
        role: 'user'
      },
      app_metadata: {
        system_access: true,
        admin: user_id === 'TEST001'
      }
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: `認証ユーザー作成失敗: ${authError.message}`,
        details: {
          error_code: authError.status,
          error_name: authError.name,
          attempted_email: email,
          attempted_user_id: user_id
        }
      }, { status: 500 })
    }

    // Verify user was created
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(authData.user.id)

    if (verifyError || !verifyData.user) {
      return NextResponse.json({
        success: false,
        error: '認証ユーザーは作成されましたが検証に失敗しました',
        auth_user_id: authData.user.id
      }, { status: 500 })
    }

    // Test login immediately
    let loginTest = 'Not tested'
    try {
      const testSupabase = createClient()
      const { data: loginData, error: loginError } = await testSupabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (loginError) {
        loginTest = `ログインテスト失敗: ${loginError.message}`
      } else {
        loginTest = `ログインテスト成功: ${loginData.user.id}`
        // Sign out immediately
        await testSupabase.auth.signOut()
      }
    } catch (testError) {
      loginTest = `ログインテストエラー: ${testError instanceof Error ? testError.message : 'Unknown'}`
    }

    return NextResponse.json({
      success: true,
      message: '認証ユーザー作成成功',
      auth_user: {
        id: authData.user.id,
        email: authData.user.email,
        confirmed: authData.user.email_confirmed_at ? true : false,
        created_at: authData.user.created_at,
        metadata: authData.user.user_metadata
      },
      login_test: loginTest,
      credentials: {
        email: email,
        password: password,
        user_id: user_id
      }
    })

  } catch (error) {
    console.error('Force create auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}