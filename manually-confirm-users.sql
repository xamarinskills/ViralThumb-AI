-- Manually confirm users to bypass email rate limit
-- Use this for testing only!

-- 1. See all unconfirmed users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'user_name' as username
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Confirm ALL unconfirmed users (for testing)
-- Uncomment the line below to run:
/*
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
*/

-- 3. Confirm a specific user by email (replace EMAIL)
-- Uncomment and replace EMAIL:
/*
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'your-email@example.com'
  AND email_confirmed_at IS NULL;
*/

-- 4. Confirm a specific user by ID (replace USER_ID)
-- Uncomment and replace USER_ID:
/*
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = 'USER_ID_HERE'::uuid
  AND email_confirmed_at IS NULL;
*/

-- 5. Delete a test user (if you want to start fresh)
-- Uncomment and replace EMAIL:
/*
DELETE FROM auth.users WHERE email = 'test@example.com';
*/

