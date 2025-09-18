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

    const supabase = createClient()
    const text = await file.text()

    // Basic file info
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }

    // Parse CSV to analyze structure
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // Sample data analysis (first 3 rows)
    const sampleData = lines.slice(1, 4).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      return row
    })

    // Test database connection
    let connectionTest = 'Failed'
    let connectionError = ''
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      if (error) {
        connectionError = error.message
      } else {
        connectionTest = `Success - ${data} users in database`
      }
    } catch (err) {
      connectionError = err instanceof Error ? err.message : 'Unknown error'
    }

    // Test single row insertion with detailed logging
    let insertionTest = 'Not attempted'
    if (sampleData.length > 0 && tableName === 'users') {
      try {
        const testRow = sampleData[0]
        const transformedRow = {
          user_id: `CSV_DEBUG_${Date.now()}`,
          password: testRow.password || testRow['パスワード'] || testRow['PASSWORD'] || 'test123',
          mail_address: `debug-${Date.now()}@test.com`,
          kanji_last_name: testRow.kanji_last_name || testRow['漢字姓'] || 'テスト',
          kanji_first_name: testRow.kanji_first_name || testRow['漢字名'] || '太郎',
          furi_last_name: 'テスト',
          furi_first_name: 'デバッグ',
          password_hash: 'debug_hash_test',
          system_access_flg: true,
          admin_flg: false,
          status_flg: 1,
          make_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }

        const { data: insertResult, error: insertError } = await supabase
          .from('users')
          .insert([transformedRow])
          .select()

        if (insertError) {
          insertionTest = `Failed: ${insertError.message} | Code: ${insertError.code} | Details: ${insertError.details}`
        } else {
          insertionTest = `Success: Inserted user ${insertResult?.[0]?.user_id}`

          // Clean up test data
          await supabase
            .from('users')
            .delete()
            .eq('user_id', transformedRow.user_id)
        }
      } catch (err) {
        insertionTest = `Exception: ${err instanceof Error ? err.message : 'Unknown'}`
      }
    }

    // Check RLS policies
    let rlsTest = 'Not tested'
    try {
      // Try to query with different auth contexts
      const { data: publicData, error: publicError } = await supabase
        .from('users')
        .select('user_id')
        .limit(1)

      if (publicError) {
        rlsTest = `RLS Error: ${publicError.message}`
      } else {
        rlsTest = `RLS OK: Can query users table`
      }
    } catch (err) {
      rlsTest = `RLS Exception: ${err instanceof Error ? err.message : 'Unknown'}`
    }

    // Environment check
    const envCheck = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    }

    return NextResponse.json({
      success: true,
      debug_analysis: {
        file_info: fileInfo,
        csv_structure: {
          total_lines: lines.length,
          headers: headers,
          sample_count: sampleData.length
        },
        sample_data: sampleData,
        database_tests: {
          connection: connectionTest,
          connection_error: connectionError,
          insertion: insertionTest,
          rls_check: rlsTest
        },
        environment: envCheck,
        table_name: tableName,
        processing_steps: [
          'ファイル読み込み完了',
          'CSV解析完了',
          'ヘッダー抽出完了',
          'サンプルデータ変換完了',
          'データベース接続テスト完了',
          '挿入テスト完了',
          'RLSポリシーテスト完了'
        ]
      }
    })

  } catch (error) {
    console.error('CSV debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug_analysis: null
    }, { status: 500 })
  }
}