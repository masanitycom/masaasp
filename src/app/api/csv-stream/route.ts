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
          })).filter(row => row.user_id && row.mail_address)
        } else if (tableName === 'camel_levels') {
          transformedData = chunkData.map((row: any) => ({
            user_id: row.user_id || row['ユーザーID'] || row['USER_ID'],
            int_id_camel: row.int_id_camel || row['内部ID'] || row['INT_ID_CAMEL'],
            level: row.level || row['レベル'] || row['LEVEL'],
            name: row.name || row['名前'] || row['NAME'],
            furi_name: row.furi_name || row['フリガナ'] || row['FURI_NAME'],
            pos: row.pos || row['位置'] || row['POS'],
            upline: row.upline || row['アップライン'] || row['UPLINE'],
            depth_level: parseInt(row.depth_level || row['深度'] || row['DEPTH_LEVEL'] || '0'),
            direct_children_count: 0,
            total_children_count: 0,
            status_flg: 1,
            make_time: new Date().toISOString(),
            update_time: new Date().toISOString()
          })).filter(row => row.user_id)
        } else if (tableName === 'investment_history') {
          transformedData = chunkData.map((row: any) => ({
            payment_date: row.payment_date || row['入金日'] || row['PAYMENT_DATE'],
            user_id: row.user_id || row['ユーザーID'] || row['USER_ID'],
            user_name: row.user_name || row['ユーザー名'] || row['USER_NAME'],
            amount: parseFloat(row.amount || row['金額'] || row['AMOUNT'] || '0'),
            fund_no: parseInt(row.fund_no || row['ファンド番号'] || row['FUND_NO'] || '0'),
            fund_name: row.fund_name || row['ファンド名'] || row['FUND_NAME'],
            fund_type: row.fund_type || row['ファンドタイプ'] || row['FUND_TYPE'],
            commission_rate: parseFloat(row.commission_rate || row['手数料率'] || row['COMMISSION_RATE'] || '0'),
            created_at: new Date().toISOString()
          })).filter(row => row.user_id && row.amount > 0)
        } else if (tableName === 'matched_data') {
          transformedData = chunkData.map((row: any) => ({
            // マッチングデータの処理（必要に応じて追加）
          })).filter(row => false) // 現時点では処理をスキップ
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