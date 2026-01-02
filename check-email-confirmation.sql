-- Check if email confirmation is enabled in Supabase
-- Run this in Supabase SQL Editor

-- Method 1: Check auth.config table (if it exists)
SELECT * FROM auth.config LIMIT 10;

-- Method 2: Check recent users and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Method 3: Count confirmed vs unconfirmed users
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_count,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_count,
  COUNT(*) as total_users
FROM auth.users;

-- Method 4: Manually confirm the latest unconfirmed user
-- (Uncomment and replace USER_ID if needed)
/*
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = 'USER_ID_HERE'::uuid
  AND email_confirmed_at IS NULL;
*/

