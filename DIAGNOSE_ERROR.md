# Diagnosing "Database error saving new user"

## What This Error Means

This error occurs when the app tries to create a profile in the `profiles` table but fails. The most common causes are:

1. **RLS (Row Level Security) blocking the insert** - Most common
2. **Table doesn't exist** - If you haven't run the setup SQL
3. **Trigger not working** - The automatic profile creation trigger failed

## Quick Fix Steps

### Step 1: Check Browser Console for Full Error

Open your browser console (F12) and look for the detailed error message. You should see:
- Error code (e.g., `42501`, `42P01`)
- Error message with details
- Full error object

### Step 2: Verify Database Setup

Run this in Supabase SQL Editor to check if everything is set up:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

### Step 3: Run the Fix Script

If RLS is the issue, run `supabase-fix-rls.sql` in Supabase SQL Editor.

### Step 5: Fix "Username Taken" Check (New)

If you see "Database error saving new user", it is often because the app cannot check if a username is taken due to RLS, so it sends a duplicate username to the DB, causing the trigger to crash.

Run `fix-username-check.sql` in Supabase SQL Editor to fix this.

### Step 6: Fix Infinite Recursion & Storage Errors (Master Fix)

If you see any of these errors:
- `infinite recursion detected in policy for relation "profiles"`
- `new row violates row-level security policy` (Storage Error)
- `Could not find the 'prompt' column of 'thumbnails'`

**Run the Master Fix Script:**

1.  Open `fix-all-db-issues.sql` in your project.
2.  Copy the content.
3.  Run it in Supabase SQL Editor.

This script fixes the database tables, RLS policies, and Storage permissions all at once.

### Step 7: Check if Profile Was Created by Trigger

Even if the client-side insert fails, the trigger should have created the profile. Check:

```sql
-- Get the latest user
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- Check if profile exists for that user (replace USER_ID)
SELECT * FROM public.profiles 
WHERE id = 'USER_ID_FROM_ABOVE';
```

## Common Error Codes

- **42501**: Permission denied - RLS is blocking
- **42P01**: Table doesn't exist
- **23505**: Unique constraint violation (username already taken)
- **PGRST116**: No rows found (expected when profile doesn't exist)

## Solution: Rely on the Trigger

The best approach is to let the database trigger handle profile creation automatically. The client-side attempt will fail due to RLS, but that's okay - the trigger should have already created it.

If the trigger isn't working:
1. Run `supabase-setup.sql` again
2. Verify the trigger exists and is enabled
3. Check Supabase logs for trigger errors

