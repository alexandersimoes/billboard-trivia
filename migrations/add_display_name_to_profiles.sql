-- Add display_name column to profiles table
-- This allows users to set a custom display name for the leaderboard
-- while keeping their original username from Google auth

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Set display_name to current username as default for existing users
UPDATE profiles
SET display_name = username
WHERE display_name IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Note: Existing RLS policies should allow users to update their own profiles
-- If not, you may need to add a policy like:
-- CREATE POLICY "Users can update own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = user_id);
