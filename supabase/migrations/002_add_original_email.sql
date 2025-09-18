-- Add original_email column to store the original email from CSV
-- This allows us to track duplicate emails while making each user unique
ALTER TABLE users
ADD COLUMN IF NOT EXISTS original_email VARCHAR;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_original_email ON users(original_email);

-- Comment
COMMENT ON COLUMN users.original_email IS 'Original email from CSV (may be duplicate). mail_address is made unique using user_id.';