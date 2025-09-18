-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Camel levels (Organization structure)
CREATE TABLE camel_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Investment history
CREATE TABLE investment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Fund settings
CREATE TABLE fund_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_no INTEGER UNIQUE,
  fund_name VARCHAR NOT NULL,
  fund_type VARCHAR NOT NULL,
  reward_structure JSONB NOT NULL,
  max_tier INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reward rules templates
CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR NOT NULL,
  reward_structure JSONB NOT NULL,
  max_tier INTEGER NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calculated rewards
CREATE TABLE calculated_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR REFERENCES users(user_id) ON DELETE CASCADE,
  referral_user_id VARCHAR REFERENCES users(user_id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investment_history(id) ON DELETE CASCADE,
  tier_level INTEGER,
  reward_amount DECIMAL NOT NULL,
  fund_no INTEGER,
  calculation_date TIMESTAMP DEFAULT NOW(),
  is_paid BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_camel_levels_upline ON camel_levels(upline);
CREATE INDEX idx_camel_levels_user_id ON camel_levels(user_id);
CREATE INDEX idx_camel_levels_depth ON camel_levels(depth_level);
CREATE INDEX idx_camel_levels_path ON camel_levels USING GIN(path);
CREATE INDEX idx_investment_history_user_id ON investment_history(user_id);
CREATE INDEX idx_investment_history_fund_no ON investment_history(fund_no);
CREATE INDEX idx_investment_history_payment_date ON investment_history(payment_date);
CREATE INDEX idx_calculated_rewards_user_id ON calculated_rewards(user_id);
CREATE INDEX idx_calculated_rewards_referral_user_id ON calculated_rewards(referral_user_id);
CREATE INDEX idx_fund_settings_fund_no ON fund_settings(fund_no);

-- Insert default reward rule templates
INSERT INTO reward_rules (rule_name, reward_structure, max_tier, description) VALUES
('直紹介のみ3%', '{"tier1": 3}', 1, '直紹介のみ3%の報酬'),
('2段階報酬 (5%+3%)', '{"tier1": 5, "tier2": 3}', 2, '直紹介5%、2段目3%の報酬'),
('海外物件標準', '{"tier1": 5, "tier2": 3}', 2, '海外物件の標準報酬設定'),
('国内物件標準', '{"tier1": 3}', 1, '国内物件の標準報酬設定');

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE camel_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_rewards ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );

-- Camel levels policies (view own downline only)
CREATE POLICY "Users can view own downline" ON camel_levels
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM camel_levels
      WHERE path @> ARRAY[
        (SELECT user_id FROM users WHERE id = auth.uid())
      ]
    )
    OR user_id = (SELECT user_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all camel levels" ON camel_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );

-- Investment history policies
CREATE POLICY "Users can view own investments" ON investment_history
  FOR SELECT USING (
    user_id = (SELECT user_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all investments" ON investment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );

-- Fund settings policies (read for all authenticated, write for admin)
CREATE POLICY "Authenticated users can view fund settings" ON fund_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fund settings" ON fund_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );

-- Reward rules policies (similar to fund settings)
CREATE POLICY "Authenticated users can view reward rules" ON reward_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reward rules" ON reward_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );

-- Calculated rewards policies
CREATE POLICY "Users can view own rewards" ON calculated_rewards
  FOR SELECT USING (
    user_id = (SELECT user_id FROM users WHERE id = auth.uid())
    OR referral_user_id = (SELECT user_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all rewards" ON calculated_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND admin_flg = true
    )
  );