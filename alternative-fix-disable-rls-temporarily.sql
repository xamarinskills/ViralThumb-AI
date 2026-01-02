-- ALTERNATIVE FIX: Temporarily disable RLS to test
-- Use this if the complete fix doesn't work
-- WARNING: This disables security - only use for testing!

-- Option 1: Completely disable RLS on profiles (for testing only)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a permissive policy that allows everything (for testing)
-- First enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create a permissive policy (allows all authenticated users)
-- WARNING: This is less secure - only for testing!
CREATE POLICY "profiles_permissive_policy"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: After testing, you should replace this with proper RLS policies

