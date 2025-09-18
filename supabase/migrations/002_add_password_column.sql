-- Add password column to users table for storing CSV passwords
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Update the users table comment
COMMENT ON COLUMN users.password IS 'Plain text password from CSV for authentication user creation';