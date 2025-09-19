import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Create multiple test users to ensure at least one works
    const testUsers = [
      {
        email: 'admin@masaasp.com',
        password: 'admin123',
        user_id: 'ADMIN001',
        name: 'Admin User'
      },
      {
        email: 'test@masaasp.com',
        password: 'test123',
        user_id: 'TEST001',
        name: 'Test User'
      },
      {
        email: 'login@masaasp.com',
        password: 'login123',
        user_id: 'LOGIN001',
        name: 'Login User'
      }
    ]

    const results = []

    for (const user of testUsers) {
      try {
        // Delete existing user first
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existing = existingUsers.users.find(u => u.email === user.email)
        if (existing) {
          await supabase.auth.admin.deleteUser(existing.id)
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            user_id: user.user_id,
            full_name: user.name
          }
        })

        if (authError) {
          results.push({
            email: user.email,
            status: 'failed',
            error: authError.message
          })
          continue
        }

        // Create database user
        const { error: dbError } = await supabase
          .from('users')
          .upsert([{
            user_id: user.user_id,
            mail_address: user.email,
            kanji_last_name: user.name.split(' ')[0],
            kanji_first_name: user.name.split(' ')[1] || '',
            furi_last_name: user.name.split(' ')[0],
            furi_first_name: user.name.split(' ')[1] || '',
            password_hash: 'manual_auth_setup',
            system_access_flg: true,
            admin_flg: true,
            status_flg: 1,
            make_time: new Date().toISOString(),
            update_time: new Date().toISOString()
          }], { onConflict: 'user_id' })

        results.push({
          email: user.email,
          password: user.password,
          user_id: user.user_id,
          status: dbError ? 'auth_only' : 'complete',
          auth_id: authData.user.id,
          db_error: dbError?.message
        })

      } catch (error) {
        results.push({
          email: user.email,
          status: 'exception',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Test login for successful users
    const loginTests = []
    for (const result of results) {
      if (result.status === 'complete' || result.status === 'auth_only') {
        try {
          const testClient = createClient()
          const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
            email: result.email,
            password: result.password
          })

          if (!loginError) {
            await testClient.auth.signOut()
            loginTests.push({
              email: result.email,
              login_test: 'SUCCESS'
            })
          } else {
            loginTests.push({
              email: result.email,
              login_test: `FAILED: ${loginError.message}`
            })
          }
        } catch (error) {
          loginTests.push({
            email: result.email,
            login_test: `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '手動認証セットアップ完了',
      results: results,
      login_tests: loginTests,
      working_credentials: results
        .filter(r => r.status === 'complete' || r.status === 'auth_only')
        .map(r => ({
          email: r.email,
          password: r.password,
          user_id: r.user_id
        }))
    })

  } catch (error) {
    console.error('Manual auth setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}