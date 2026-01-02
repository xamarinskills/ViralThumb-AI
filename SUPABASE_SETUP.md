# Supabase Setup Instructions

## Step 1: Run the Database Setup SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `jxtiqpeecojhjlkrmari`
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `supabase-setup.sql` into the editor
5. Click **Run** to execute the script

This will create:
- `profiles` table with proper structure
- `thumbnails` table for storing generated thumbnails
- Row Level Security (RLS) policies
- Automatic profile creation trigger when users sign up

## Step 2: Disable Email Confirmation (Optional but Recommended for Testing)

If you want users to be able to sign up and log in immediately without email verification:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **Email Auth**, find **"Enable email confirmations"**
3. **Disable** this option (toggle it off)
4. Click **Save**

**Note**: For production, you should keep email confirmation enabled for security.

## Step 3: Verify the Setup

After running the SQL script, you should see:
- A `profiles` table in the **Table Editor**
- A `thumbnails` table in the **Table Editor**
- The trigger `on_auth_user_created` in the **Database** → **Triggers** section

## Step 4: Test Sign-Up

1. Try signing up with a new account
2. Check the browser console (F12) for any error messages
3. Check the `profiles` table in Supabase to see if the record was created
4. Check the `auth.users` table to see if the user was created

## Troubleshooting

### If profiles are not being created:

1. **Check RLS Policies**: Make sure the RLS policies in the SQL script were created successfully
2. **Check the Trigger**: Verify the trigger `on_auth_user_created` exists and is enabled
3. **Check Browser Console**: Look for error messages that indicate what went wrong
4. **Check Supabase Logs**: Go to **Logs** → **Postgres Logs** to see database errors

### Common Issues:

- **"relation profiles does not exist"**: The table wasn't created. Re-run the SQL script.
- **"new row violates row-level security policy"**: RLS policies are blocking the insert. Check that the policies were created correctly.
- **"duplicate key value violates unique constraint"**: Username already exists. Try a different username.

