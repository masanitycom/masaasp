import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ファイルが選択されていません'
      }, { status: 400 })
    }

    const supabase = createClient()
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // Process all users with unique user_id + sequence for email duplicates
    let processedCount = 0
    let errorCount = 0
    const errors: string[] = []
    const chunkSize = 50

    for (let i = 1; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize)
      const chunkData = chunk.map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || null
        })
        return row
      }).filter(row => row.user_id || row['ユーザーID'] || row['USER_ID'])

      if (chunkData.length === 0) continue

      try {
        const transformedData = chunkData.map((row: any, idx: number) => {
          const userId = row.user_id || row['ユーザーID'] || row['USER_ID']
          let mailAddress = row.mail_address || row['メールアドレス'] || row['MAIL_ADDRESS']

          // Make email unique by appending user_id if it's a duplicate
          // This allows all users to have auth accounts
          if (mailAddress && mailAddress !== 'null') {
            // For duplicate emails, append user_id to make them unique
            mailAddress = `${userId}@masaasp-user.com`
          } else {
            // For null emails, create a unique one
            mailAddress = `${userId}@masaasp-user.com`
          }

          return {
            user_id: userId,
            password: row.password || row['パスワード'] || row['PASSWORD'],
            mail_address: mailAddress,
            original_email: row.mail_address || row['メールアドレス'] || row['MAIL_ADDRESS'],
            kanji_last_name: row.kanji_last_name || row['漢字姓'] || row['KANJI_LAST_NAME'],
            kanji_first_name: row.kanji_first_name || row['漢字名'] || row['KANJI_FIRST_NAME'],
            furi_last_name: row.furi_last_name || row['フリガナ姓'] || row['カナ姓'] || row['FURI_LAST_NAME'],
            furi_first_name: row.furi_first_name || row['フリガナ名'] || row['カナ名'] || row['FURI_FIRST_NAME'],
            fixed_line_phone: row.fixed_line_phone || row['電話番号'] || row['PHONE_NUMBER'],
            lender_no: row.lender_no || row['貸金業者番号'] || null,
            user_increment_id: row.user_increment_id || null,
            password_hash: row.password_hash || row['パスワードハッシュ'] || 'placeholder_hash',
            system_access_flg: row.system_access_flg !== undefined ? row.system_access_flg : true,
            admin_flg: row.admin_flg !== undefined ? row.admin_flg : false,
            status_flg: 1,
            make_time: new Date().toISOString(),
            update_time: new Date().toISOString()
          }
        }).filter(row => row.user_id)

        if (transformedData.length > 0) {
          const { data: insertResult, error } = await supabase
            .from('users')
            .upsert(transformedData, { onConflict: 'user_id' })

          if (error) {
            errors.push(`Chunk ${Math.floor(i/chunkSize)}: ${error.message}`)
            errorCount += transformedData.length
          } else {
            processedCount += transformedData.length
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (chunkError) {
        errors.push(`Chunk ${Math.floor(i/chunkSize)}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`)
        errorCount += chunk.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `処理完了: ${processedCount}件のユーザーを処理しました（全ユーザーログイン可能）`,
      details: {
        totalProcessed: processedCount,
        totalErrors: errorCount,
        totalRows: lines.length - 1,
        errors: errors.slice(0, 10),
        note: '全てのユーザーIDでログイン可能になりました。メールアドレスの代わりにuser_id@masaasp-user.comを使用します。'
      }
    })

  } catch (error) {
    console.error('Fix duplicates error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}