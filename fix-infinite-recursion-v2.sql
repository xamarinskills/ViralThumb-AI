-- FIX INFINITE RECURSION ERROR (V2 - DYNAMIC CLEANUP)
-- This script aggressively removes ALL existing policies on the profiles table using a dynamic loop,
-- ensuring no hidden recursive policies remain.

-- 1. Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DYNAMICALLY DROP ALL POLICIES on profiles table
-- This guarantees we don't miss any policy, regardless of its name.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE, NON-RECURSIVE policies
-- These policies rely ONLY on auth.uid() and the row's 'id' column.

-- SELECT: Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 6. Ensure the handle_new_user function is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    username = COALESCE(profiles.username, EXCLUDED.username);
  RETURN NEW;
END;
$$;

-- 7. Re-apply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
