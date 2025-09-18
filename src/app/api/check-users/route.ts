import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, mail_address, kanji_last_name, kanji_first_name, system_access_flg, admin_flg, id')
      .limit(10)

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: `Users table error: ${usersError.message}`
      }, { status: 500 })
    }

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({
        success: false,
        error: `Auth users error: ${authError.message}`
      }, { status: 500 })
    }

    // Count total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalAuthUsers } = authUsers.users ?
      { count: authUsers.users.length } : { count: 0 }

    return NextResponse.json({
      success: true,
      data: {
        database_users: users,
        total_database_users: totalUsers,
        auth_users: authUsers.users?.slice(0, 5).map(u => ({
          id: u.id,
          email: u.email,
          user_metadata: u.user_metadata
        })),
        total_auth_users: totalAuthUsers,
        users_with_auth_id: users?.filter(u => u.id).length || 0
      }
    })

  } catch (error) {
    console.error('Check users error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}