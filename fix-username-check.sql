-- Fix for "Database error saving new user"
-- This error happens when the username uniqueness check fails because of RLS,
-- allowing a duplicate username to be sent to the signup function, 
-- which then causes the database trigger to fail.

-- 1. Create a secure function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_taken(username_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Allows bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_check)
  );
END;
$$;

-- 2. Grant execute permission to everyone (public) and authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_taken(text) TO anon, authenticated, service_role;

-- 3. Ensure the profiles table has the correct unique constraint
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_key;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- 4. Double check RLS policies to ensure no conflicts
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure we have a policy for users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ensure we have a policy for users to select their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
