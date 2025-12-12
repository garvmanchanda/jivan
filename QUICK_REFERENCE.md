# Jivan - Quick Reference Card

## 🚀 Start App

```bash
./start.sh
```

Or manually:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Mobile
npm start
```

## 🛑 Stop App

Press `Ctrl + C` in both terminals

## 📱 Device Controls

| Key | Action |
|-----|--------|
| `i` | Open iOS simulator |
| `a` | Open Android emulator |
| `r` | Reload app |
| `m` | Toggle menu |
| `?` | Show all commands |

## 🔧 Common Commands

### Reset All Data
```bash
# In app DevTools console:
AsyncStorage.clear()
```

### Clear Expo Cache
```bash
npx expo start -c
```

### Reinstall Dependencies
```bash
# Backend
cd backend && rm -rf node_modules && npm install

# Mobile
rm -rf node_modules && npm install
```

### Check Backend Status
```bash
curl http://localhost:3000
# Should return: {"status":"healthy"}
```

## 🌐 Network Configuration

### iOS Simulator
```typescript
const API_URL = 'http://localhost:3000';
```

### Android Emulator
```typescript
const API_URL = 'http://10.0.2.2:3000';
```

### Physical Device
```typescript
const API_URL = 'http://YOUR_COMPUTER_IP:3000';
// Example: 'http://192.168.1.105:3000'
```

## 🐛 Quick Fixes

### "Cannot connect to backend"
1. Check backend is running on port 3000
2. Update API_URL in `services/ai.ts`
3. Check firewall settings

### "Microphone not working"
1. Settings → App → Permissions → Microphone
2. Restart app after granting permission

### "OpenAI API error"
1. Check `.env` file in backend folder
2. Verify API key starts with `sk-`
3. Check OpenAI account has credits

### "Module not found"
```bash
npm install
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📂 Project Structure

```
jivan/
├── app/              # Mobile screens
│   ├── index.tsx     # Home
│   ├── record.tsx    # Recording
│   ├── response.tsx  # AI Response
│   └── profile.tsx   # Profile
├── services/         # Business logic
├── backend/          # API server
└── assets/           # Images/icons
```

## 🔑 Environment Variables

### Backend `.env`
```
OPENAI_API_KEY=sk-...
PORT=3000
```

## 📝 Useful Links

- OpenAI Keys: https://platform.openai.com/api-keys
- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | #7c3aed | Primary (buttons, active states) |
| Dark Purple | #5b21b6 | Secondary |
| Black | #000 | Background |
| Dark Gray | #1a1a1a | Cards |
| Gray | #666 | Labels |
| Amber | #d97706 | Warnings |

## 🧪 Test Queries

Try these voice queries:

1. "I have a persistent cough and sore throat"
2. "My head has been aching for two days"
3. "I feel tired and have a mild fever"
4. "I twisted my ankle while running"
5. "I have trouble sleeping at night"

## 💡 Pro Tips

- **Fast Refresh**: Shake device → Enable Fast Refresh
- **Debug Menu**: Shake device or Cmd+D (iOS) / Cmd+M (Android)
- **Console Logs**: View in terminal running `npm start`
- **Backend Logs**: View in terminal running `npm run dev`
- **Save Time**: Use the `start.sh` script

## 📞 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/transcribe` | POST | Audio → Text |
| `/analyze` | POST | Query → AI Response |

## 🎯 Features Checklist

- [x] Voice recording
- [x] AI transcription (Whisper)
- [x] Health analysis (GPT-4)
- [x] Profile management
- [x] Vitals tracking
- [x] Habit tracker
- [x] Conversation history
- [x] Red flag warnings

---

Keep this file handy! 📌

