import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { defaultPassword } = await request.json()

    if (!defaultPassword) {
      return NextResponse.json({
        success: false,
        error: 'デフォルトパスワードが必要です'
      }, { status: 400 })
    }

    const supabase = createClient()

    // 全ユーザーを取得
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name')
      .eq('system_access_flg', true)

    if (usersError || !allUsers) {
      return NextResponse.json({
        success: false,
        error: 'ユーザーデータの取得に失敗しました'
      }, { status: 500 })
    }

    console.log(`一括パスワードリセット開始: ${allUsers.length}人のユーザー`)

    const results = {
      total: allUsers.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // バッチ処理（50人ずつ）
    const batchSize = 50
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize)

      await Promise.all(batch.map(async (user) => {
        try {
          // 既存のAuthユーザーを検索
          const { data: authList } = await supabase.auth.admin.listUsers()
          const existingAuthUser = authList.users.find(u => u.email === user.mail_address)

          if (existingAuthUser) {
            // 既存ユーザーのパスワードを更新
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingAuthUser.id,
              { password: defaultPassword }
            )

            if (updateError) {
              results.failed++
              results.errors.push(`${user.user_id}: パスワード更新失敗 - ${updateError.message}`)
            } else {
              results.success++
            }
          } else {
            // 新規Authユーザーを作成
            const { error: createError } = await supabase.auth.admin.createUser({
              email: user.mail_address,
              password: defaultPassword,
              email_confirm: true,
              user_metadata: {
                user_id: user.user_id,
                full_name: `${user.kanji_last_name} ${user.kanji_first_name}`
              }
            })

            if (createError) {
              results.failed++
              results.errors.push(`${user.user_id}: ユーザー作成失敗 - ${createError.message}`)
            } else {
              results.success++
            }
          }
        } catch (error) {
          results.failed++
          results.errors.push(`${user.user_id}: 処理エラー - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }))

      // バッチ間で少し待機（API制限対策）
      if (i + batchSize < allUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`一括パスワードリセット完了: 成功${results.success}件、失敗${results.failed}件`)

    return NextResponse.json({
      success: true,
      message: '一括パスワードリセットが完了しました',
      results: results,
      defaultPassword: defaultPassword
    })

  } catch (error) {
    console.error('Bulk password reset error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}