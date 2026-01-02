# Fix "Email signups are disabled" Error

## The Problem
You disabled the Email provider entirely, which prevents all email signups. You need to:
1. **Enable** the Email provider
2. **Disable** email confirmations (optional, for testing)

## Solution Steps

### Step 1: Re-enable Email Provider

1. Go to Supabase Dashboard
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab
4. Find **Email** provider
5. **Enable** the Email provider (toggle it ON)
6. Click **Save**

### Step 2: Disable Email Confirmations (Optional)

While you're in the Email provider settings:

1. Look for **"Enable email confirmations"** or **"Confirm email"** option
2. **Disable** this option (toggle it OFF)
3. Click **Save**

**Note**: If you can't find this option, that's okay - you can manually confirm users via SQL instead.

### Step 3: Test Sign-Up Again

After enabling the Email provider:
1. Try signing up again in your app
2. You should be able to create an account
3. If email confirmation is still enabled, you'll need to confirm the email or manually confirm via SQL

## Alternative: Manual User Confirmation via SQL

If you want to keep email confirmations enabled but manually confirm users for testing:

1. Go to **SQL Editor** in Supabase
2. Run this to see unconfirmed users:

```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

3. Copy the user ID and confirm them:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = 'USER_ID_HERE'::uuid;
```

## Quick Fix Summary

**What to do:**
- ✅ Enable Email provider (turn it ON)
- ⚠️ Disable email confirmations (optional, for easier testing)
- ✅ Save changes
- ✅ Try signing up again

The error "Email signups are disabled" will go away once you enable the Email provider.

