# How to Check if User Was Created in Supabase

## The user WAS created, but you need to check the right place:

### 1. Check Authentication → Users (NOT Table Editor)

1. Go to your Supabase Dashboard
2. Click on **Authentication** in the left sidebar
3. Click on **Users**
4. You should see the user there, even if email is not confirmed
5. Look for:
   - The email you used to sign up
   - Status: "Unconfirmed" (if email confirmation is enabled)
   - User ID (UUID)

### 2. Check if Profile Was Created by Trigger

The database trigger should have automatically created a profile when the user was created. To check:

1. Go to **Table Editor** in Supabase Dashboard
2. Click on **profiles** table
3. Look for a row with:
   - `id`: Should match the User ID from step 1
   - `email`: Your email
   - `username`: The username you entered
   - `full_name`: The full name you entered

### 3. If Profile Doesn't Exist

If the profile wasn't created automatically, the trigger might not be working. Check:

1. Go to **Database** → **Triggers** in Supabase Dashboard
2. Look for trigger named `on_auth_user_created`
3. If it doesn't exist, run the `supabase-setup.sql` script again

### 4. Verify Trigger is Working

Run this SQL query in Supabase SQL Editor to check if the trigger exists:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 5. Manually Create Profile (if needed)

If the trigger didn't work, you can manually create the profile. First, get the user ID from Authentication → Users, then run:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from Authentication → Users
INSERT INTO public.profiles (id, email, username, full_name, avatar_url, credits, plan, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'user_name', 'user_' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(raw_user_meta_data->>'user_name', id::text),
  50,
  'free',
  'user'
FROM auth.users
WHERE id = 'USER_ID_HERE'::uuid
ON CONFLICT (id) DO NOTHING;
```

## Quick Check Commands

Run these in Supabase SQL Editor:

**Check if user exists:**
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check if profile exists:**
```sql
SELECT id, email, username, full_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check trigger:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

