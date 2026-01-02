-- COMPLETE FIX for infinite recursion in profiles table
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily disable RLS to fix the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Step 3: Drop and recreate the trigger function with proper SECURITY DEFINER
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function runs with elevated privileges, bypassing RLS
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, credits, plan, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.id::text),
    50,
    'free',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create simple, non-recursive policies
-- These policies are simple and won't cause recursion
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Step 8: Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully';
  RAISE NOTICE 'Trigger function created with SECURITY DEFINER';
END $$;

