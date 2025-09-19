import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Check users table
    const { data: usersData, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('user_id, kanji_last_name, kanji_first_name', { count: 'exact' })
      .limit(5)

    // Check camel_levels table
    const { data: camelData, error: camelError, count: camelCount } = await supabase
      .from('camel_levels')
      .select('user_id, level, pos, upline, depth_level', { count: 'exact' })
      .limit(5)

    // Check investment_history table
    const { data: investmentData, error: investmentError, count: investmentCount } = await supabase
      .from('investment_history')
      .select('user_id, fund_name, amount', { count: 'exact' })
      .limit(5)

    return NextResponse.json({
      success: true,
      tables: {
        users: {
          count: usersCount,
          error: usersError?.message,
          sample: usersData
        },
        camel_levels: {
          count: camelCount,
          error: camelError?.message,
          sample: camelData
        },
        investment_history: {
          count: investmentCount,
          error: investmentError?.message,
          sample: investmentData
        }
      }
    })

  } catch (error) {
    console.error('Debug tables error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}