import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'メールアドレスが必要です'
      }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name')
      .eq('mail_address', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'このメールアドレスは登録されていません'
      }, { status: 404 })
    }

    // Send password reset email using Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://masaasp.vercel.app'}/reset-password`
    })

    if (resetError) {
      // If user doesn't exist in auth, create auth account first
      if (resetError.message.includes('User not found')) {
        try {
          // Generate temporary password for auth account creation
          const tempPassword = Math.random().toString(36).slice(-12) + 'Temp!'

          const { error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              user_id: userData.user_id,
              full_name: `${userData.kanji_last_name} ${userData.kanji_first_name}`
            }
          })

          if (createError) {
            return NextResponse.json({
              success: false,
              error: `アカウント作成エラー: ${createError.message}`
            }, { status: 500 })
          }

          // Now send reset email
          const { error: secondResetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://masaasp.vercel.app'}/reset-password`
          })

          if (secondResetError) {
            return NextResponse.json({
              success: false,
              error: `パスワードリセットメール送信エラー: ${secondResetError.message}`
            }, { status: 500 })
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: `パスワードリセットエラー: ${resetError.message}`
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードリセット用のメールを送信しました',
      email: email
    })

  } catch (error) {
    console.error('Password reset email error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}