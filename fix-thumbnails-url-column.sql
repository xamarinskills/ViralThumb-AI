-- FIX THUMBNAILS COLUMN: Ensure 'url' column exists
-- This script aligns the database with the code (which uses 'url').

DO $$
BEGIN
    -- 1. Check if 'url' already exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thumbnails' AND column_name='url') THEN
        RAISE NOTICE 'Column url already exists. No changes needed.';
        
    -- 2. Check if 'image_url' exists (and 'url' does not) -> RENAME IT
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='thumbnails' AND column_name='image_url') THEN
        RAISE NOTICE 'Renaming column image_url to url to match codebase...';
        ALTER TABLE public.thumbnails RENAME COLUMN image_url TO url;
        
    -- 3. If neither exists, create 'url'
    ELSE
        RAISE NOTICE 'Creating missing column url...';
        ALTER TABLE public.thumbnails ADD COLUMN url TEXT;
    END IF;
END $$;

-- Ensure RLS policies are up to date with the column name if needed
-- (Policies usually reference the table, but if any policy referenced image_url, it would need update. 
-- The standard policies don't reference specific columns usually, just rows.)

-- Notify client to refresh schema cache
NOTIFY pgrst, 'reload schema';
