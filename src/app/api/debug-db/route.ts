import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name, created_at, password')
      .limit(10)

    // Test direct insert
    let insertTestResult = 'Not tested'
    try {
      const testUser = {
        user_id: `DEBUG_TEST_${Date.now()}`,
        mail_address: `debug${Date.now()}@test.com`,
        password: 'test123',
        kanji_last_name: 'テスト',
        kanji_first_name: '太郎',
        password_hash: 'debug_hash',
        system_access_flg: true,
        admin_flg: false
      }

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select()

      if (insertError) {
        insertTestResult = `Insert failed: ${insertError.message}`
      } else {
        insertTestResult = `Insert successful: ${insertData?.[0]?.user_id}`

        // Clean up test data
        await supabase
          .from('users')
          .delete()
          .eq('user_id', testUser.user_id)
      }
    } catch (insertErr) {
      insertTestResult = `Insert error: ${insertErr instanceof Error ? insertErr.message : 'Unknown'}`
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        connection_test: connectionError ? `Error: ${connectionError.message}` : `Success: ${connectionTest} users`,
        total_users: allUsers?.length || 0,
        users_sample: allUsers?.map(u => ({
          user_id: u.user_id,
          mail_address: u.mail_address,
          name: `${u.kanji_last_name || ''} ${u.kanji_first_name || ''}`.trim(),
          has_password: u.password ? 'Yes' : 'No',
          created_at: u.created_at
        })) || [],
        insert_test: insertTestResult,
        supabase_config: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        errors: {
          connection_error: connectionError?.message,
          users_error: usersError?.message
        }
      }
    })

  } catch (error) {
    console.error('Debug DB error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug_info: null
    }, { status: 500 })
  }
}