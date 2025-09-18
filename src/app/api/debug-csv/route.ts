import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { csvData, tableName } = await request.json()

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CSVデータが空です。正しいCSVファイルを選択してください。'
      }, { status: 400 })
    }

    const supabase = createClient()

    // サンプルデータを表示
    const sample = csvData.slice(0, 3)

    // データベース接続テスト
    let dbTestResult = ''
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      if (testError) {
        dbTestResult = `❌ データベース接続エラー: ${testError.message}`
      } else {
        dbTestResult = `✅ データベース接続OK（現在のユーザー数: ${testData || 0}）`
      }
    } catch (err) {
      dbTestResult = `❌ データベース接続失敗: ${err}`
    }

    // CSV構造分析
    const headers = Object.keys(sample[0] || {})
    const expectedHeaders = ['user_id', 'mail_address', 'password', 'kanji_last_name', 'kanji_first_name']
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))

    return NextResponse.json({
      success: true,
      debug_info: {
        csv_rows: csvData.length,
        csv_headers: headers,
        missing_required_headers: missingHeaders,
        sample_data: sample,
        database_connection: dbTestResult,
        table_name: tableName
      }
    })

  } catch (error) {
    console.error('Debug CSV error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}