-- Ensure the check_username_taken function exists and has correct permissions
CREATE OR REPLACE FUNCTION public.check_username_taken(username_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_check)
  );
END;
$$;

-- Grant permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_taken(text) TO anon, authenticated, service_role;

-- Ensure profiles are readable if needed (though RPC bypasses this)
-- This is just a safeguard for the fallback query if RLS policies are complex
-- CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);
