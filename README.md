# Jivan - AI Healthcare Concierge 🏥

A minimal, working MVP of a healthcare concierge app with voice recording, AI analysis, and profile management.

## 🎯 Features

- ✅ Voice recording with mic button
- ✅ OpenAI Whisper transcription
- ✅ GPT-4 health guidance with safety checks
- ✅ Profile management (multi-user support)
- ✅ Vitals tracking (HR, Weight, Sleep)
- ✅ Habit tracking with daily checklist
- ✅ Conversation history

## 🏗️ Tech Stack

- **Mobile**: Expo + React Native + TypeScript
- **Backend**: Node.js + Express
- **AI**: OpenAI (Whisper + GPT-4)
- **Storage**: AsyncStorage (local)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
- Expo CLI: `npm install -g expo-cli`

### 1. Setup Backend

```bash
cd backend
npm install

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env
echo "PORT=3000" >> .env

# Start server
npm run dev
```

Backend will run on http://localhost:3000

### 2. Setup Mobile App

```bash
# From project root
npm install

# Start Expo
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 How to Use

1. **Home Screen**: Tap profile (Garv) or add new profile with "+"
2. **Record**: Tap big mic button, speak your health question
3. **Response**: Get AI-powered guidance with recommendations
4. **Profile**: View vitals, habits, and conversation history

## 🔑 Environment Variables

### Backend `.env`
```
OPENAI_API_KEY=sk-...your-key
PORT=3000
```

## 📂 Project Structure

```
jivan/
├── app/
│   ├── index.tsx          # Home screen with mic button
│   ├── record.tsx         # Voice recording screen
│   ├── response.tsx       # AI response display
│   └── profile.tsx        # Profile detail screen
├── services/
│   ├── storage.ts         # AsyncStorage wrapper
│   └── ai.ts              # OpenAI API calls
├── backend/
│   └── index.js           # Express server
└── types.ts               # TypeScript interfaces
```

## 🧪 Testing the App

1. **Test Voice Recording**: 
   - Tap mic → Say "I have a headache and fever"
   - Should transcribe and show analysis

2. **Test Profile**:
   - Tap "Profile & Insights"
   - See default vitals and empty habits

3. **Test Conversation History**:
   - Make 2-3 queries
   - Check profile screen for recent queries

## ⚠️ Important Notes

- **No encryption**: This is a simple prototype
- **Local storage**: Data stays on device (AsyncStorage)
- **OpenAI costs**: Whisper + GPT-4 API calls cost money
- **iOS/Android only**: Not optimized for web

## 🐛 Troubleshooting

**Backend not connecting?**
- Check backend is running on port 3000
- For iOS simulator, use `http://localhost:3000`
- For Android emulator, use `http://10.0.2.2:3000`
- For physical device, use your computer's IP address

**Audio recording fails?**
- Grant microphone permissions when prompted
- iOS: Settings → Jivan → Allow Microphone
- Android: App permissions → Microphone

**OpenAI API errors?**
- Verify API key is correct in backend/.env
- Check you have credits in OpenAI account
- Ensure API key has access to Whisper and GPT-4

## 📝 Next Steps

To productionize this MVP:
- Add user authentication (Firebase)
- Encrypt sensitive data
- Add database (Postgres)
- Deploy backend to cloud
- Add real health device integrations
- Implement telemedicine features

## 📄 License

Proprietary - All rights reserved

