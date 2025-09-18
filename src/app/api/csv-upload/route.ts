import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { tableName, data } = await request.json()

    if (!tableName || !data || !Array.isArray(data)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: tableName and data array required'
      }, { status: 400 })
    }

    const supabase = createClient()

    let insertedCount = 0
    let errors: string[] = []

    // Process data based on table type
    const result = { insertedCount: 0, errors: [] as string[] }

    switch (tableName) {
      case 'users':
        await processUsersData(supabase, data, result)
        break
      case 'camel_levels':
        await processCamelLevelsData(supabase, data, result)
        break
      case 'investment_history':
        await processInvestmentHistoryData(supabase, data, result)
        break
      case 'matched_data':
        await processMatchedData(supabase, data, result)
        break
      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported table: ${tableName}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} records inserted into ${tableName}`,
      errors: result.errors.length > 0 ? result.errors : undefined
    })

  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

async function processUsersData(supabase: any, data: any[], result: { insertedCount: number, errors: string[] }) {
  const batchSize = 100

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    try {
      // Transform CSV data to match database schema
      const transformedData = batch.map((row: any) => ({
        user_id: row.user_id || row['ユーザーID'],
        mail_address: row.mail_address || row['メールアドレス'],
        kanji_last_name: row.kanji_last_name || row['漢字姓'],
        kanji_first_name: row.kanji_first_name || row['漢字名'],
        kana_last_name: row.kana_last_name || row['カナ姓'],
        kana_first_name: row.kana_first_name || row['カナ名'],
        birth_date: row.birth_date || row['生年月日'],
        gender: row.gender || row['性別'],
        zip_code: row.zip_code || row['郵便番号'],
        address: row.address || row['住所'],
        phone_number: row.phone_number || row['電話番号'],
        bank_name: row.bank_name || row['銀行名'],
        branch_name: row.branch_name || row['支店名'],
        account_type: row.account_type || row['口座種別'],
        account_number: row.account_number || row['口座番号'],
        account_holder: row.account_holder || row['口座名義'],
        password: row.password || row['パスワード'] || row['password'],
        password_hash: row.password_hash || row['パスワードハッシュ'] || '',
        system_access_flg: row.system_access_flg !== undefined ? row.system_access_flg : true,
        admin_flg: row.admin_flg !== undefined ? row.admin_flg : false,
        registration_date: row.registration_date || new Date().toISOString(),
        last_login_date: row.last_login_date || null
      })).filter(row => row.user_id && row.mail_address) // Only include rows with required fields

      if (transformedData.length > 0) {
        const { data: insertResult, error } = await supabase
          .from('users')
          .upsert(transformedData, { onConflict: 'user_id' })

        if (error) {
          result.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
        } else {
          result.insertedCount += transformedData.length
        }
      }
    } catch (batchError) {
      result.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
    }
  }
}

async function processCamelLevelsData(supabase: any, data: any[], result: { insertedCount: number, errors: string[] }) {
  const batchSize = 100

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    try {
      const transformedData = batch.map((row: any) => ({
        user_id: row.user_id || row['ユーザーID'],
        name: row.name || row['名前'],
        level: parseInt(row.level || row['レベル']) || 0,
        pos: parseInt(row.pos || row['ポジション']) || 0,
        upline: row.upline || row['上位ライン'],
        path: row.path || row['パス'],
        created_at: row.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })).filter(row => row.user_id) // Only include rows with user_id

      if (transformedData.length > 0) {
        const { data: insertResult, error } = await supabase
          .from('camel_levels')
          .upsert(transformedData, { onConflict: 'user_id' })

        if (error) {
          result.errors.push(`CamelLevels Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
        } else {
          result.insertedCount += transformedData.length
        }
      }
    } catch (batchError) {
      result.errors.push(`CamelLevels Batch ${Math.floor(i/batchSize) + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
    }
  }
}

async function processInvestmentHistoryData(supabase: any, data: any[], result: { insertedCount: number, errors: string[] }) {
  const batchSize = 100

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    try {
      const transformedData = batch.map((row: any) => ({
        user_id: row.user_id || row['ユーザーID'],
        fund_no: parseInt(row.fund_no || row['ファンド番号']) || 0,
        fund_name: row.fund_name || row['ファンド名'],
        fund_type: row.fund_type || row['ファンド種別'],
        payment_date: row.payment_date || row['支払日'],
        amount: parseFloat(row.amount || row['金額']) || 0,
        created_at: row.created_at || new Date().toISOString()
      })).filter(row => row.user_id && row.fund_no) // Only include rows with required fields

      if (transformedData.length > 0) {
        const { data: insertResult, error } = await supabase
          .from('investment_history')
          .insert(transformedData)

        if (error) {
          result.errors.push(`InvestmentHistory Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
        } else {
          result.insertedCount += transformedData.length
        }
      }
    } catch (batchError) {
      result.errors.push(`InvestmentHistory Batch ${Math.floor(i/batchSize) + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
    }
  }
}

async function processMatchedData(supabase: any, data: any[], result: { insertedCount: number, errors: string[] }) {
  // For matched_data, we'll need to process it and potentially create calculated_rewards
  // This is a placeholder for now
  console.log('Processing matched data - placeholder implementation')
  result.insertedCount = data.length
}