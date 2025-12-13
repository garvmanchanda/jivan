# Supabase Edge Functions Deployment Guide

## Overview

The backend is implemented as **Supabase Edge Functions** (not Render). These are Deno-based serverless functions that run on Supabase infrastructure.

## Edge Functions Created

1. **`analyze-v2`** - Main AI analysis with intelligent memory
2. **`memory-issues`** - Fetch active issues for a profile
3. **`memory-insights`** - Fetch learned insights
4. **`memory-events`** - Fetch event timeline

## Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or on other platforms
npm install -g supabase
```

## Setup

### 1. Link Your Supabase Project

```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan
supabase link --project-ref gzmfehoyqyjydegwgbjz
```

When prompted, enter your Supabase database password.

### 2. Set Edge Function Secrets

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=your_openai_key_here
```

## Deploy Edge Functions

### Deploy All Functions

```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan

# Deploy analyze-v2
supabase functions deploy analyze-v2

# Deploy memory functions
supabase functions deploy memory-issues
supabase functions deploy memory-insights
supabase functions deploy memory-events
```

### Deploy Individual Function

```bash
supabase functions deploy analyze-v2
```

## Test Edge Functions

### Test analyze-v2

```bash
curl -i --location --request POST 'https://gzmfehoyqyjydegwgbjz.supabase.co/functions/v1/analyze-v2' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"query":"I have a headache","profileId":"YOUR_PROFILE_UUID","context":{"age":30}}'
```

### Test memory-issues

```bash
curl -i --location 'https://gzmfehoyqyjydegwgbjz.supabase.co/functions/v1/memory-issues/YOUR_PROFILE_UUID' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY'
```

## Verify Deployment

1. Go to [Supabase Dashboard](https://app.supabase.com/project/gzmfehoyqyjydegwgbjz)
2. Click "Edge Functions" in the left sidebar
3. You should see 4 functions deployed:
   - `analyze-v2`
   - `memory-issues`
   - `memory-insights`
   - `memory-events`

## Architecture

```
Mobile App (Expo)
    ↓
Supabase Edge Functions (Deno)
    ↓
OpenAI API + Supabase Database
```

## Differences from Render

| Feature | Render (Old) | Supabase Edge Functions (Current) |
|---------|--------------|-----------------------------------|
| Runtime | Node.js | Deno |
| Deployment | GitHub push | Supabase CLI |
| Cold starts | ~2-3 seconds | <1 second |
| Auto-scaling | Yes | Yes (built-in) |
| Cost | $7/month | Free (up to 500K requests) |

## Environment Variables

Edge functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your public anon key

You need to manually set:
- `OPENAI_API_KEY` - Set via `supabase secrets set`

## Monitoring & Logs

### View Logs

```bash
# Real-time logs for a function
supabase functions serve analyze-v2

# Or view in dashboard
# https://app.supabase.com/project/gzmfehoyqyjydegwgbjz/functions
```

## Troubleshooting

### Function not working?

1. Check logs:
   ```bash
   supabase functions logs analyze-v2
   ```

2. Verify secrets are set:
   ```bash
   supabase secrets list
   ```

3. Test locally:
   ```bash
   supabase functions serve analyze-v2
   ```

### CORS issues?

CORS headers are already configured in each function. If issues persist, check the `corsHeaders` object in the function code.

## Local Development

### Run Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve a function locally
supabase functions serve analyze-v2 --env-file supabase/.env.local

# Test locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-v2' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"query":"test","profileId":"test-id","context":{}}'
```

## Next Steps After Deployment

1. ✅ Deploy all 4 edge functions
2. ✅ Set `OPENAI_API_KEY` secret
3. ✅ Test each function with curl
4. ✅ Verify in Supabase Dashboard
5. ✅ Run Expo app and test end-to-end

## Important Notes

- **No Render needed** - All backend logic is in Supabase Edge Functions
- **Auto-scaling** - Handles traffic spikes automatically
- **Fast cold starts** - Deno runtime is optimized
- **Free tier** - 500K function invocations/month free

## Your Current Setup

✅ Database: Supabase PostgreSQL  
✅ Backend: Supabase Edge Functions (Deno)  
✅ Frontend: Expo Go (React Native)  
✅ AI: OpenAI API (GPT-3.5-turbo + Whisper)

