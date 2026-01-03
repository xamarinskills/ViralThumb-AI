# Testing Instructions

## Issue Found: RLS Infinite Recursion

The test revealed an RLS policy infinite recursion error. This has been fixed in the updated SQL scripts.

## Steps to Fix and Test:

### 1. Run the Fix Script in Supabase

Go to your Supabase Dashboard → SQL Editor and run:

**File: `supabase-fix-rls.sql`**

This will:
- Drop and recreate the RLS policies correctly
- Fix the trigger function to use SECURITY DEFINER properly
- Add ON CONFLICT handling

### 2. Verify the Fix

After running the fix script, the connection test should pass.

### 3. Test Sign-Up in the Browser

1. **Open the app**: http://localhost:3000/ViralThumb-AI/pages/
2. **Open Browser Console**: Press F12 (or Cmd+Option+I on Mac)
3. **Navigate to Sign Up page**
4. **Fill in the form**:
   - Full Name: Test User
   - Username: testuser123
   - Email: test@example.com (or your email)
   - Password: test123456
5. **Click "Register Studio"**

### 4. What to Check

#### In Browser Console:
Look for these log messages:
- ✅ "Attempting sign-up for: [email]"
- ✅ "Sign-up response: { user: '[user-id]', session: true }"
- ✅ "User auto-confirmed, creating profile..."
- ✅ "Profile created successfully: { ... }"

#### In Supabase Dashboard:

**Authentication → Users:**
- Should see the new user with the email you used

**Table Editor → profiles:**
- Should see a new row with:
  - `id`: matches the user ID
  - `username`: the username you entered
  - `full_name`: the full name you entered
  - `email`: the email you used
  - `credits`: 50
  - `plan`: "free"

### 5. Expected Behavior

- If email confirmation is **disabled**: You should be automatically logged in and redirected to the dashboard
- If email confirmation is **enabled**: You'll see a message to check your email

### Troubleshooting

If you see errors in the console:
- **"infinite recursion detected"**: Run the `supabase-fix-rls.sql` script
- **"relation profiles does not exist"**: Run the main `supabase-setup.sql` script first
- **"new row violates row-level security policy"**: The RLS policies need to be fixed - run `supabase-fix-rls.sql`

