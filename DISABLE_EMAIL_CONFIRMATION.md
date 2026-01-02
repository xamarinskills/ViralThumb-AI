# How to Disable Email Confirmation in Supabase

## Method 1: Authentication Settings (New UI)

1. Go to your Supabase Dashboard
2. Click on **Authentication** in the left sidebar
3. Look for one of these options:
   - **Providers** tab → Scroll down to find email settings
   - **Configuration** tab or section
   - A gear icon (⚙️) or settings icon
   - **Email Auth** section

## Method 2: Project Settings

1. Go to Supabase Dashboard
2. Click on the **Settings** icon (gear) in the left sidebar (at the bottom)
3. Look for **Authentication** section
4. Find **Email Auth** or **Email Settings**
5. Look for "Enable email confirmations" toggle

## Method 3: Using SQL (Direct Method)

You can disable email confirmation directly via SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query:

```sql
-- Disable email confirmation
UPDATE auth.config 
SET enable_signup = true,
    enable_email_confirmations = false;
```

**Note**: This might not work if the config table structure is different.

## Method 4: Check Current Setting via SQL

First, check if email confirmation is enabled:

```sql
-- Check auth configuration
SELECT * FROM auth.config;
```

Or check the actual setting:

```sql
-- Check if email confirmation is required
SELECT 
  name,
  value
FROM auth.config
WHERE name LIKE '%email%' OR name LIKE '%confirm%';
```

## Method 5: API Method (Using Supabase CLI or API)

If you have access to the Supabase API or CLI, you can update the setting programmatically.

## Alternative: Just Verify the User Manually

If you can't find the setting, you can manually confirm users via SQL:

```sql
-- Get unconfirmed users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Manually confirm a user (replace USER_ID with actual ID)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = 'USER_ID_HERE';
```

## Quick Check: What You Should See

In the Authentication section, you should see tabs like:
- **Users** - List of users
- **Policies** - RLS policies
- **Providers** - Auth providers (Email, Google, etc.)
- **URL Configuration** - Redirect URLs
- **Templates** - Email templates

Look for email-related settings in the **Providers** tab or a **Configuration** section.

## Still Can't Find It?

1. Take a screenshot of your Authentication page
2. Check if there's a search bar in the dashboard
3. Look for any gear/settings icons
4. The setting might be under **Project Settings** → **Auth** instead

