-- Create generations table for storing user image generation history
-- Run this in Supabase SQL Editor

-- 1. Create generations table
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  prompt TEXT NULL,
  output_url TEXT NULL,
  credits_used INTEGER NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT generations_pkey PRIMARY KEY (id),
  CONSTRAINT generations_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Enable Row Level Security
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for generations table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can delete own generations" ON public.generations;

-- Policy: Users can view their own generations
CREATE POLICY "Users can view own generations"
  ON public.generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own generations
CREATE POLICY "Users can insert own generations"
  ON public.generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own generations
CREATE POLICY "Users can delete own generations"
  ON public.generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);

-- 5. Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS generations_created_at_idx ON public.generations(created_at DESC);

