-- Disable RLS temporarily to allow setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE camel_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE investment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE fund_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_rewards DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow public read for login" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON users;

-- Create new, more permissive policies for users table
CREATE POLICY "Allow public read for authentication"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated read camel_levels"
  ON camel_levels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read investment_history"
  ON investment_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read calculated_rewards"
  ON calculated_rewards
  FOR SELECT
  TO authenticated
  USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE camel_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_rewards ENABLE ROW LEVEL SECURITY;