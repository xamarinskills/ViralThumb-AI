-- Fix RLS Infinite Recursion Issue
-- Run this AFTER running the main setup script

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own thumbnails" ON public.thumbnails;
DROP POLICY IF EXISTS "Users can insert own thumbnails" ON public.thumbnails;

-- 2. Recreate policies with proper syntax (no recursion)
-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can view their own thumbnails
CREATE POLICY "Users can view own thumbnails"
  ON public.thumbnails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own thumbnails
CREATE POLICY "Users can insert own thumbnails"
  ON public.thumbnails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Ensure the trigger function uses SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

