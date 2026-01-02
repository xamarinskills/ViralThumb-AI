-- Enable soft delete support in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);

-- Optional: Create a view for active users only
CREATE OR REPLACE VIEW public.active_profiles AS
SELECT * FROM public.profiles WHERE is_deleted = false;

-- RLS Policy Update (if needed) to allow users to update their own is_deleted status
-- (Usually standard RLS 'update own profile' covers this, but good to double check)
-- Ensure your existing policy allows updating these new columns.
