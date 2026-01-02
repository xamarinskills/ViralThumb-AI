# Fix "Email Rate Limit Exceeded" Error

## What This Means

Supabase has rate limits on sending emails. You've hit the limit, which typically happens when:
- Too many sign-up attempts in a short time
- Too many password reset emails
- Too many email confirmation emails

## Solutions

### Solution 1: Disable Email Confirmation (Best for Testing)

Since you're testing, disable email confirmation to avoid needing emails:

1. Go to Supabase Dashboard
2. Click **Authentication** → **Providers**
3. Find **Email** provider
4. Look for **"Enable email confirmations"** or **"Confirm email"**
5. **Disable** it (toggle OFF)
6. Click **Save**

Now users can sign up and log in immediately without email confirmation.

### Solution 2: Wait for Rate Limit to Reset

The rate limit usually resets after:
- **1 hour** for free tier
- **15 minutes** for paid tiers

Just wait and try again later.

### Solution 3: Manually Confirm Users via SQL (No Email Needed)

Instead of waiting for emails, manually confirm users:

1. Go to **SQL Editor** in Supabase
2. Run this to see unconfirmed users:

```sql
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

3. Manually confirm a user (replace `USER_ID`):

```sql
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE id = 'USER_ID_HERE'::uuid;
```

### Solution 4: Use a Different Email Address

If you're testing with the same email repeatedly:
- Try a different email address
- Or delete the old user first:

```sql
-- Delete a user (replace EMAIL)
DELETE FROM auth.users WHERE email = 'your-email@example.com';
```

### Solution 5: Check Supabase Project Settings

1. Go to **Settings** (gear icon) in Supabase Dashboard
2. Look for **Rate Limits** or **Email Settings**
3. Check your current limits
4. Consider upgrading if you need higher limits

## Recommended Approach for Testing

**Best practice**: Disable email confirmation during development/testing:

1. **Disable email confirmations** in Authentication → Providers → Email
2. Users can sign up and log in immediately
3. No emails needed = no rate limit issues
4. Re-enable email confirmation when deploying to production

## Quick Fix Script

Run this in SQL Editor to manually confirm all unconfirmed users:

```sql
-- Confirm all unconfirmed users (for testing only!)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

**Warning**: Only use this for testing. In production, users should confirm their own emails.

