-- Quick verification queries to check if user and profile were created

-- 1. Check recent users in auth.users table
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_name' as username,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if profiles exist for those users
SELECT 
  p.id,
  p.email,
  p.username,
  p.full_name,
  p.credits,
  p.plan,
  p.created_at,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Check if trigger exists and is enabled
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Find users without profiles (if any)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'user_name' as username,
  u.raw_user_meta_data->>'full_name' as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

