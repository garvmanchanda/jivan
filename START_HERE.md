# 🏥 Jivan - Start Here!

## What You Have

A **complete, working MVP** of your healthcare concierge app with 4 screens:

1. ✅ Home screen (profile selector + mic button)
2. ✅ Recording screen (animated listening interface)  
3. ✅ Response screen (AI health guidance)
4. ✅ Profile screen (vitals, habits, history)

## Quick Start (5 Minutes)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create account / sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Setup Backend
```bash
cd backend
npm install

# Create .env file with your key
echo "OPENAI_API_KEY=sk-YOUR-ACTUAL-KEY-HERE" > .env
echo "PORT=3000" >> .env

# Start server
npm run dev
```

Leave this terminal running!

### Step 3: Start Mobile App
Open a **new terminal**:

```bash
cd ..
npm install
npm start
```

Press `i` for iOS or `a` for Android.

## First Test

1. App opens → Tap the big purple mic button
2. Say: "I have a headache and feel tired"
3. Wait ~5-10 seconds
4. See AI response with recommendations!

## Need Help?

- **Detailed Setup**: See `SETUP.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Full Details**: See `IMPLEMENTATION_SUMMARY.md`

## Files Overview

```
jivan/
├── app/              # 4 screens (index, record, response, profile)
├── services/         # Storage & AI logic
├── backend/          # OpenAI integration
├── types.ts          # Data models
└── docs...          # Setup guides
```

## What's Special

- **Simple**: ~1000 lines of clean code
- **No Database**: Uses phone's local storage
- **No Auth**: Just works immediately
- **Real AI**: OpenAI Whisper + GPT-4
- **Safety First**: Built-in red flag detection

## Cost

~$0.02 per voice query (OpenAI API)
$5 credit = ~250 queries

---

**Ready?** Run the commands above and start testing! 🚀

