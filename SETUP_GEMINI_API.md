# Setup Gemini API Key

## The Error
You're getting: "API key not valid. Please pass a valid API key."

This means the Gemini API key is missing or invalid.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (it will look like: `AIza...`)

## Step 2: Create .env File

Create a file named `.env` in the root of your project (same folder as `package.json`):

```bash
GEMINI_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with the actual API key you copied.

**Example:**
```
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

## Step 3: Restart the Dev Server

After creating the `.env` file:

1. Stop the current dev server (Ctrl+C in terminal)
2. Restart it: `npm run dev`
3. The API key will be loaded automatically

## Step 4: Verify It Works

1. Try generating an image again
2. The error should be gone
3. Images should generate successfully

## Important Notes

- **Never commit the `.env` file to git** - it contains your secret API key
- The `.env` file should already be in `.gitignore`
- If you share your code, don't share your API key

## Alternative: Set Environment Variable Directly

If you prefer not to use a `.env` file, you can set it as an environment variable:

**On macOS/Linux:**
```bash
export GEMINI_API_KEY=your-api-key-here
npm run dev
```

**On Windows:**
```cmd
set GEMINI_API_KEY=your-api-key-here
npm run dev
```

## Troubleshooting

- **Still getting the error?** Make sure:
  1. The `.env` file is in the root directory (same as `package.json`)
  2. The file is named exactly `.env` (not `.env.local` or `.env.txt`)
  3. You restarted the dev server after creating the file
  4. The API key is valid (check in Google AI Studio)

- **API key format:** Should start with `AIza` and be quite long (around 39 characters)

