-- FINAL BULLETPROOF FIX for infinite recursion and profile setup
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Disable RLS temporarily to ensure we can clean up
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Clean up ALL potentially conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_permissive_policy" ON public.profiles;

-- 3. Recreate the Profile Table if it's missing (should already exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 50,
  plan TEXT DEFAULT 'free',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. recreate the trigger function with BULLETPROOF SECURITY DEFINER
-- This ensures the function runs as a superuser, bypassing RLS.
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

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Define CLEAN, NON-RECURSIVE policies
-- We use simple checks that do not query the table itself.
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- NOT recommended to allow client-side inserts if using a trigger, 
-- but we'll add it for compatibility with the sync function.
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Ensure storage bucket exists and is public (ViralThumb-AI)
-- Note: Recreating buckets usually requires more permissions, but we'll try to set policy.
-- If the bucket doesn't exist, create it in the UI.

-- 9. Setup generations table if not already correct
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT,
  output_url TEXT,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generations" ON public.generations;
CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify
SELECT 'Setup complete. Please refresh your application.' as status;
