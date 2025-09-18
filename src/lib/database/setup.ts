import { createServerActionClient } from '@/lib/supabase/server'

export const setupDatabase = async () => {
  const supabase = await createServerActionClient()

  try {
    // Enable UUID extension
    await supabase.rpc('setup_uuid_extension')

    // Create tables in sequence
    const tables = [
      createUsersTable,
      createCamelLevelsTable,
      createInvestmentHistoryTable,
      createFundSettingsTable,
      createRewardRulesTable,
      createCalculatedRewardsTable,
      createIndexes,
      setupRLS,
      insertDefaultData
    ]

    const results = []

    for (const tableFunc of tables) {
      try {
        const result = await tableFunc(supabase)
        results.push({ success: true, step: tableFunc.name, result })
      } catch (error) {
        results.push({ success: false, step: tableFunc.name, error: error instanceof Error ? error.message : 'Unknown error' })
        console.error(`Error in ${tableFunc.name}:`, error)
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Database setup error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

const createUsersTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
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
  if (error) throw error
  return data
}

const createCamelLevelsTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
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
  })
  if (error) throw error
  return data
}

const createInvestmentHistoryTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
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
  })
  if (error) throw error
  return data
}

const createFundSettingsTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
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
  })
  if (error) throw error
  return data
}

const createRewardRulesTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
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
  })
  if (error) throw error
  return data
}

const createCalculatedRewardsTable = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
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
  })
  if (error) throw error
  return data
}

const createIndexes = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE INDEX IF NOT EXISTS idx_camel_levels_upline ON camel_levels(upline);
      CREATE INDEX IF NOT EXISTS idx_camel_levels_user_id ON camel_levels(user_id);
      CREATE INDEX IF NOT EXISTS idx_investment_history_user_id ON investment_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_investment_history_fund_no ON investment_history(fund_no);
      CREATE INDEX IF NOT EXISTS idx_calculated_rewards_user_id ON calculated_rewards(user_id);
      CREATE INDEX IF NOT EXISTS idx_fund_settings_fund_no ON fund_settings(fund_no);
    `
  })
  if (error) throw error
  return data
}

const setupRLS = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE camel_levels ENABLE ROW LEVEL SECURITY;
      ALTER TABLE investment_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE fund_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
      ALTER TABLE calculated_rewards ENABLE ROW LEVEL SECURITY;
    `
  })
  if (error) throw error
  return data
}

const insertDefaultData = async (supabase: any) => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO reward_rules (rule_name, reward_structure, max_tier, description) VALUES
      ('直紹介のみ3%', '{"tier1": 3}', 1, '直紹介のみ3%の報酬'),
      ('2段階報酬 (5%+3%)', '{"tier1": 5, "tier2": 3}', 2, '直紹介5%、2段目3%の報酬'),
      ('海外物件標準', '{"tier1": 5, "tier2": 3}', 2, '海外物件の標準報酬設定'),
      ('国内物件標準', '{"tier1": 3}', 1, '国内物件の標準報酬設定')
      ON CONFLICT DO NOTHING;
    `
  })
  if (error) throw error
  return data
}