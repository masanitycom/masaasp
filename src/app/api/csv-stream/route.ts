import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tableName = formData.get('tableName') as string

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ファイルが選択されていません'
      }, { status: 400 })
    }

    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'テーブル名が指定されていません'
      }, { status: 400 })
    }

    const supabase = createClient()
    const text = await file.text()

    // Simple CSV parsing (header + data rows)
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    let processedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process in smaller chunks to avoid memory issues
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
      }).filter(row => row[headers[0]]) // Filter out empty rows

      if (chunkData.length === 0) continue

      try {
        // Transform data based on table
        let transformedData: any[] = []

        if (tableName === 'users') {
          transformedData = chunkData.map((row: any) => ({
            user_id: row.user_id || row['ユーザーID'] || row['USER_ID'],
            password: row.password || row['パスワード'] || row['PASSWORD'],
            mail_address: row.mail_address || row['メールアドレス'] || row['MAIL_ADDRESS'],
            kanji_last_name: row.kanji_last_name || row['漢字姓'] || row['KANJI_LAST_NAME'],
            kanji_first_name: row.kanji_first_name || row['漢字名'] || row['KANJI_FIRST_NAME'],
            kana_last_name: row.kana_last_name || row['カナ姓'] || row['KANA_LAST_NAME'],
            kana_first_name: row.kana_first_name || row['カナ名'] || row['KANA_FIRST_NAME'],
            birth_date: row.birth_date || row['生年月日'] || row['BIRTH_DATE'],
            gender: row.gender || row['性別'] || row['GENDER'],
            zip_code: row.zip_code || row['郵便番号'] || row['ZIP_CODE'],
            address: row.address || row['住所'] || row['ADDRESS'],
            phone_number: row.phone_number || row['電話番号'] || row['PHONE_NUMBER'],
            bank_name: row.bank_name || row['銀行名'] || row['BANK_NAME'],
            branch_name: row.branch_name || row['支店名'] || row['BRANCH_NAME'],
            account_type: row.account_type || row['口座種別'] || row['ACCOUNT_TYPE'],
            account_number: row.account_number || row['口座番号'] || row['ACCOUNT_NUMBER'],
            account_holder: row.account_holder || row['口座名義'] || row['ACCOUNT_HOLDER'],
            password_hash: row.password_hash || row['パスワードハッシュ'] || '',
            system_access_flg: row.system_access_flg !== undefined ? row.system_access_flg : true,
            admin_flg: row.admin_flg !== undefined ? row.admin_flg : false,
            registration_date: row.registration_date || new Date().toISOString(),
            last_login_date: row.last_login_date || null
          })).filter(row => row.user_id && row.mail_address)
        }

        if (transformedData.length > 0) {
          const { data: insertResult, error } = await supabase
            .from(tableName)
            .upsert(transformedData, { onConflict: 'user_id' })

          if (error) {
            errors.push(`Chunk ${Math.floor(i/chunkSize)}: ${error.message}`)
            errorCount += transformedData.length
          } else {
            processedCount += transformedData.length
          }
        }

        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (chunkError) {
        errors.push(`Chunk ${Math.floor(i/chunkSize)}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`)
        errorCount += chunk.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `処理完了: ${processedCount}件の${tableName}レコードを処理しました`,
      details: {
        totalProcessed: processedCount,
        totalErrors: errorCount,
        totalRows: lines.length - 1,
        errors: errors.slice(0, 10) // Show first 10 errors
      }
    })

  } catch (error) {
    console.error('CSV stream upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'ファイル処理中にエラーが発生しました'
    }, { status: 500 })
  }
}