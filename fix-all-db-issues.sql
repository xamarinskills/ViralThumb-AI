-- MASTER DATABASE FIX SCRIPT
-- This script fixes ALL known issues:
-- 1. Infinite recursion in 'profiles' RLS.
-- 2. Missing columns in 'thumbnails' table.
-- 3. Storage permission errors (RLS blocking uploads).
-- 4. Missing 'generations' table policies.

-- =================================================================
-- PART 1: FIX PROFILES (Infinite Recursion)
-- =================================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Dynamic cleanup of ALL policies on profiles
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Safe Policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Fix Trigger Function (Security Definer)
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

-- Re-apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =================================================================
-- PART 2: FIX THUMBNAILS (Missing Columns)
-- =================================================================

-- Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS public.thumbnails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- If table exists but columns are missing, add them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thumbnails' AND column_name='prompt') THEN
        ALTER TABLE public.thumbnails ADD COLUMN prompt TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thumbnails' AND column_name='style') THEN
        ALTER TABLE public.thumbnails ADD COLUMN style TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thumbnails' AND column_name='title') THEN
        ALTER TABLE public.thumbnails ADD COLUMN title TEXT;
    END IF;
END $$;

-- Fix Thumbnails RLS
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own thumbnails" ON public.thumbnails;
DROP POLICY IF EXISTS "Users can insert own thumbnails" ON public.thumbnails;
DROP POLICY IF EXISTS "thumbnails_select_own" ON public.thumbnails;
DROP POLICY IF EXISTS "thumbnails_insert_own" ON public.thumbnails;

CREATE POLICY "thumbnails_select_own" ON public.thumbnails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "thumbnails_insert_own" ON public.thumbnails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "thumbnails_delete_own" ON public.thumbnails FOR DELETE USING (auth.uid() = user_id);


-- =================================================================
-- PART 3: FIX GENERATIONS (Ensure Exists)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT,
  output_url TEXT,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Dynamic cleanup for generations
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'generations' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.generations', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "generations_select_own" ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "generations_insert_own" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- PART 4: FIX STORAGE (RLS Blocking Uploads)
-- =================================================================

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ViralThumb-AI', 'ViralThumb-AI', true)
ON CONFLICT (id) DO NOTHING;

-- Fix Storage RLS
-- We need to act on the storage.objects table
-- WARNING: This affects ALL buckets, so we qualify with bucket_id

DROP POLICY IF EXISTS "Users can upload to ViralThumb-AI" ON storage.objects;
DROP POLICY IF EXISTS "Users can view ViralThumb-AI" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to ViralThumb-AI" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to their own folder (folder name = user_id)
-- Matches path: user_id/*
CREATE POLICY "Users can upload to ViralThumb-AI"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ViralThumb-AI' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to view/select their own files
CREATE POLICY "Users can view own ViralThumb-AI"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ViralThumb-AI' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow PUBLIC to view ANY file in this bucket (since we use public URLs)
CREATE POLICY "Public can view ViralThumb-AI"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ViralThumb-AI');

-- Policy 4: Allow users to update/delete their own files
CREATE POLICY "Users can update own ViralThumb-AI"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ViralThumb-AI' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own ViralThumb-AI"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ViralThumb-AI' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
