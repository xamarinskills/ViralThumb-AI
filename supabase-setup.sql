-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor to set up the required tables and policies

-- 1. Create profiles table
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

-- 2. Create thumbnails table (if needed)
CREATE TABLE IF NOT EXISTS public.thumbnails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own thumbnails" ON public.thumbnails;
DROP POLICY IF EXISTS "Users can insert own thumbnails" ON public.thumbnails;

-- 5. Create RLS Policies for profiles table
-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for authenticated users)
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

-- 6. Create RLS Policies for thumbnails table
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

-- 7. Create function to automatically create profile on user signup
-- SECURITY DEFINER allows this function to bypass RLS when inserting profiles
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

-- 8. Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- 10. Create index on user_id for thumbnails
CREATE INDEX IF NOT EXISTS thumbnails_user_id_idx ON public.thumbnails(user_id);

