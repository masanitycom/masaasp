import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'ユーザーIDとパスワードが必要です'
      }, { status: 400 })
    }

    const supabase = createClient()

    // ユーザーをデータベースから検索
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'ユーザーが見つかりません'
      }, { status: 404 })
    }

    // Supabase Authでユーザーを検索
    const { data: authList } = await supabase.auth.admin.listUsers()
    const authUser = authList.users.find(u => u.email === userData.mail_address)

    if (authUser) {
      // 既存のAuthユーザーのパスワードを更新
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: newPassword }
      )

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: `パスワード更新エラー: ${updateError.message}`
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'パスワードをリセットしました',
        credentials: {
          user_id: userData.user_id,
          email: userData.mail_address,
          password: newPassword
        }
      })
    } else {
      // Authユーザーが存在しない場合は新規作成
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.mail_address,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          user_id: userData.user_id,
          full_name: `${userData.kanji_last_name} ${userData.kanji_first_name}`
        }
      })

      if (createError) {
        return NextResponse.json({
          success: false,
          error: `ユーザー作成エラー: ${createError.message}`
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: '認証ユーザーを作成しました',
        credentials: {
          user_id: userData.user_id,
          email: userData.mail_address,
          password: newPassword
        }
      })
    }

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}