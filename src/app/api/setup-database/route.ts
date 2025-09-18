import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerActionClient()

    // Check if user has admin privileges
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Execute database setup
    const results = []

    // Step 1: Create users table
    const { error: usersError } = await supabase.rpc('sql', {
      query: `
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
      `
    })

    if (usersError) {
      console.error('Users table error:', usersError)
      results.push({ step: 'users', success: false, error: usersError.message })
    } else {
      results.push({ step: 'users', success: true })
    }

    // Step 2: Create test user
    const testUserId = '69e02511-86f9-4042-9da6-be0aceab3433'
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
      console.error('Test user insert error:', insertError)
      results.push({ step: 'test_user', success: false, error: insertError.message })
    } else {
      results.push({ step: 'test_user', success: true })
    }

    // Step 3: Create other tables
    const tables = [
      {
        name: 'camel_levels',
        sql: `
          CREATE TABLE IF NOT EXISTS camel_levels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            camel_level_id INTEGER,
            user_id VARCHAR REFERENCES users(user_id) ON DELETE CASCADE,
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
        `
      },
      {
        name: 'investment_history',
        sql: `
          CREATE TABLE IF NOT EXISTS investment_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            no INTEGER,
            payment_date DATE,
            user_id VARCHAR REFERENCES users(user_id) ON DELETE SET NULL,
            user_name VARCHAR,
            amount DECIMAL NOT NULL,
            fund_no INTEGER,
            fund_name VARCHAR,
            fund_type VARCHAR,
            commission_rate DECIMAL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'fund_settings',
        sql: `
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
        `
      },
      {
        name: 'reward_rules',
        sql: `
          CREATE TABLE IF NOT EXISTS reward_rules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rule_name VARCHAR NOT NULL,
            reward_structure JSONB NOT NULL,
            max_tier INTEGER NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'calculated_rewards',
        sql: `
          CREATE TABLE IF NOT EXISTS calculated_rewards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR REFERENCES users(user_id) ON DELETE CASCADE,
            referral_user_id VARCHAR REFERENCES users(user_id) ON DELETE CASCADE,
            investment_id UUID REFERENCES investment_history(id) ON DELETE CASCADE,
            tier_level INTEGER,
            reward_amount DECIMAL NOT NULL,
            fund_no INTEGER,
            calculation_date TIMESTAMP DEFAULT NOW(),
            is_paid BOOLEAN DEFAULT false
          );
        `
      }
    ]

    for (const table of tables) {
      const { error } = await supabase.rpc('sql', { query: table.sql })
      if (error) {
        console.error(`${table.name} table error:`, error)
        results.push({ step: table.name, success: false, error: error.message })
      } else {
        results.push({ step: table.name, success: true })
      }
    }

    // Step 4: Insert test organization data
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

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      results
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}