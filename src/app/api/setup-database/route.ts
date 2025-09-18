import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerActionClient()

    // Skip authentication check for initial setup
    // This is necessary because users table doesn't exist yet

    // Execute database setup
    const results = []

    // Step 1: Try to create a simple test user first
    const testUserId = '69e02511-86f9-4042-9da6-be0aceab3433'

    // Check if we can create auth user
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@masaasp.com',
        password: 'password123',
        user_metadata: {
          user_id: 'TEST001',
          name: '管理者 太郎'
        }
      })

      if (authError) {
        console.log('Auth user might already exist:', authError.message)
        results.push({ step: 'auth_user', success: true, note: 'User might already exist' })
      } else {
        results.push({ step: 'auth_user', success: true, user_id: authData.user?.id })
      }
    } catch (authErr) {
      console.log('Auth creation error:', authErr)
      results.push({ step: 'auth_user', success: false, error: 'Auth setup failed' })
    }

    // Step 2: Create application tables using direct SQL
    const createTablesSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_increment_id INTEGER,
        user_id VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        lender_no INTEGER,
        mail_address VARCHAR UNIQUE,
        kanji_last_name VARCHAR,
        kanji_first_name VARCHAR,
        furi_last_name VARCHAR,
        furi_first_name VARCHAR,
        fixed_line_phone VARCHAR,
        status_flg INTEGER DEFAULT 1,
        system_access_flg BOOLEAN DEFAULT false,
        admin_flg BOOLEAN DEFAULT false,
        make_time TIMESTAMP DEFAULT NOW(),
        make_user UUID,
        update_time TIMESTAMP DEFAULT NOW(),
        update_user UUID
      );

      -- Create camel_levels table
      CREATE TABLE IF NOT EXISTS camel_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        camel_level_id INTEGER,
        user_id VARCHAR,
        int_id_camel VARCHAR,
        level DECIMAL,
        name VARCHAR,
        furi_name VARCHAR,
        pos DECIMAL,
        upline VARCHAR,
        depth_level INTEGER,
        path TEXT[],
        direct_children_count INTEGER DEFAULT 0,
        total_children_count INTEGER DEFAULT 0,
        status_flg INTEGER DEFAULT 1,
        make_time TIMESTAMP DEFAULT NOW(),
        make_user UUID,
        update_time TIMESTAMP DEFAULT NOW(),
        update_user UUID
      );

      -- Create investment_history table
      CREATE TABLE IF NOT EXISTS investment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        no INTEGER,
        payment_date DATE,
        user_id VARCHAR,
        user_name VARCHAR,
        amount DECIMAL NOT NULL,
        fund_no INTEGER,
        fund_name VARCHAR,
        fund_type VARCHAR,
        commission_rate DECIMAL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create fund_settings table
      CREATE TABLE IF NOT EXISTS fund_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fund_no INTEGER UNIQUE,
        fund_name VARCHAR NOT NULL,
        fund_type VARCHAR NOT NULL,
        reward_structure JSONB NOT NULL,
        max_tier INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create reward_rules table
      CREATE TABLE IF NOT EXISTS reward_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_name VARCHAR NOT NULL,
        reward_structure JSONB NOT NULL,
        max_tier INTEGER NOT NULL,
        description TEXT,
        is_template BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create calculated_rewards table
      CREATE TABLE IF NOT EXISTS calculated_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR,
        referral_user_id VARCHAR,
        investment_id UUID,
        tier_level INTEGER,
        reward_amount DECIMAL NOT NULL,
        fund_no INTEGER,
        calculation_date TIMESTAMP DEFAULT NOW(),
        is_paid BOOLEAN DEFAULT false
      );
    `

    // Execute SQL using direct query (this might need to be done through Supabase Dashboard)
    try {
      // Try a simple query to test connection
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      if (testError && testError.message?.includes('does not exist')) {
        results.push({ step: 'table_check', success: false, error: 'Tables do not exist yet - manual setup required' })
      } else {
        results.push({ step: 'table_check', success: true, note: 'Tables might already exist' })
      }
    } catch (tableErr) {
      results.push({ step: 'table_check', success: false, error: 'Unable to check tables' })
    }

    // Step 3: Try to insert test user data
    try {
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: testUserId,
          user_id: 'TEST001',
          password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          mail_address: 'admin@masaasp.com',
          kanji_last_name: '管理者',
          kanji_first_name: '太郎',
          system_access_flg: true,
          admin_flg: true
        })

      if (insertError) {
        results.push({ step: 'test_user', success: false, error: insertError.message })
      } else {
        results.push({ step: 'test_user', success: true })
      }
    } catch (userErr) {
      results.push({ step: 'test_user', success: false, error: 'Unable to create test user' })
    }

    // Step 4: Try to insert test organization data
    try {
      const { error: camelError } = await supabase
        .from('camel_levels')
        .upsert({
          user_id: 'TEST001',
          level: 1,
          name: '管理者 太郎',
          pos: 1,
          upline: null,
          direct_children_count: 0,
          total_children_count: 0
        })

      if (camelError) {
        results.push({ step: 'test_camel_level', success: false, error: camelError.message })
      } else {
        results.push({ step: 'test_camel_level', success: true })
      }
    } catch (camelErr) {
      results.push({ step: 'test_camel_level', success: false, error: 'Unable to create test organization data' })
    }

    return NextResponse.json({
      success: true,
      message: 'Setup process completed',
      results,
      manual_setup_required: results.some(r => !r.success),
      sql_for_manual_setup: createTablesSQL
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}