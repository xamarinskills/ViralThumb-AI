# Quick Fix: Gemini API Key Error

## The Problem
Error: "API key not valid. Please pass a valid API key."

## Quick Solution

### Step 1: Get Your Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Add to .env.local

Open `.env.local` in the project root and add:

```
GEMINI_API_KEY=your-api-key-here
```

**Example:**
```
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

### Step 3: Restart Server

1. Stop the server (Ctrl+C)
2. Run: `npm run dev`
3. Try generating an image again

## Verify

After restarting, check the browser console - you should NOT see the API key error anymore.

## Still Not Working?

1. Make sure the `.env.local` file is in the root directory (same folder as `package.json`)
2. Make sure there are no spaces around the `=` sign
3. Make sure the API key is valid (check in Google AI Studio)
4. Make sure you restarted the dev server

