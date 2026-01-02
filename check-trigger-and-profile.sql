-- Comprehensive check: Verify trigger exists and profiles are being created
-- Run this in Supabase SQL Editor after signing up

-- 1. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check recent users
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_name' as username,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if profiles exist for those users
SELECT 
  p.id,
  p.email,
  p.username,
  p.full_name,
  p.credits,
  p.created_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
  END as user_status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 4. Find users WITHOUT profiles (these are the problem cases)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'user_name' as username,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 5. If you found users without profiles, create them manually:
-- (Replace USER_ID with the actual ID from query #4)
/*
INSERT INTO public.profiles (id, email, username, full_name, avatar_url, credits, plan, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'user_name', 'user_' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(raw_user_meta_data->>'user_name', id::text),
  50,
  'free',
  'user'
FROM auth.users
WHERE id = 'USER_ID_HERE'::uuid
ON CONFLICT (id) DO NOTHING;
*/

