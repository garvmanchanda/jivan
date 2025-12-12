# Jivan - Complete Setup Guide

This guide will help you get the Jivan healthcare concierge app running in under 10 minutes.

## Step-by-Step Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important**: Add billing info and credits to your OpenAI account

### 2. Setup Backend Server

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
OPENAI_API_KEY=sk-your-actual-key-here
PORT=3000
EOF

# Start the server
npm run dev
```

You should see: `🚀 Jivan Backend running on port 3000`

### 3. Setup Mobile App

Open a **new terminal window** (keep backend running):

```bash
# Navigate back to project root
cd ..

# Install dependencies
npm install

# Start Expo
npm start
```

### 4. Run on Device

#### Option A: iOS Simulator (Mac only)
- Press `i` in the terminal
- Wait for simulator to open and app to load

#### Option B: Android Emulator
- Start Android Studio emulator first
- Press `a` in the terminal

#### Option C: Your Phone
- Install "Expo Go" app from App Store / Play Store
- Scan QR code shown in terminal
- **Important**: Phone must be on same WiFi as computer

### 5. Configure for Physical Device

If using a physical phone, update the API URL:

Edit `services/ai.ts`:
```typescript
// Replace with your computer's local IP
const API_URL = __DEV__ ? 'http://192.168.1.XXX:3000' : 'YOUR_PRODUCTION_URL';
```

To find your IP:
- Mac: System Preferences → Network
- Windows: `ipconfig`
- Linux: `ifconfig`

## Verification Checklist

- [ ] Backend shows "🚀 Jivan Backend running on port 3000"
- [ ] Mobile app opens with purple mic button
- [ ] Profile "Garv" is visible at top
- [ ] Tapping mic asks for microphone permission
- [ ] After granting permission, can record voice

## First Test

1. Tap the big purple mic button
2. Say: "I have a persistent cough and scratchy throat"
3. Tap the stop button (white square)
4. Wait 5-10 seconds for AI analysis
5. Should see response with recommendations

## Troubleshooting

### Backend Issues

**"Module not found"**
```bash
cd backend
rm -rf node_modules
npm install
```

**"OPENAI_API_KEY not set"**
- Check `.env` file exists in `backend/` folder
- Make sure no spaces around `=` sign
- Key should start with `sk-`

### Mobile App Issues

**"Network request failed"**
- Backend must be running
- Check API_URL in `services/ai.ts`
- For Android, try `http://10.0.2.2:3000`
- For physical device, use computer's IP address

**Microphone permission denied**
- iOS: Settings → Jivan → Enable Microphone
- Android: App Settings → Permissions → Microphone

**App crashes on recording**
- Restart Expo: Press `r` in terminal
- Clear cache: `npx expo start -c`

**"Cannot connect to development server"**
- Phone and computer on same WiFi
- Firewall not blocking port 8081
- Try: `npx expo start --tunnel`

### OpenAI API Issues

**"401 Unauthorized"**
- API key is incorrect
- Copy key again from OpenAI dashboard

**"429 Rate Limit"**
- Too many requests
- Wait a minute and try again

**"Insufficient credits"**
- Add billing info at https://platform.openai.com/account/billing
- Add at least $5 credit

## Cost Estimate

Per query:
- Whisper API: ~$0.006 per minute of audio
- GPT-4 API: ~$0.01-0.03 per query

Example: 100 queries ≈ $2-5

## Development Tips

### Hot Reload
- Mobile: Shake device → Enable Fast Refresh
- Backend: Uses nodemon, auto-restarts on file changes

### View Logs
- Mobile: Shake device → Debug Console
- Backend: Check terminal running `npm run dev`

### Reset Data
Delete all stored profiles and conversations:
```javascript
// In app, run this in DevTools console:
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

## Next Steps

Once everything works:
1. Create more profiles (tap "+" button)
2. Add custom vitals in profile screen
3. Try different health queries
4. Check conversation history in profile

## Need Help?

Common issues:
- **Port 3000 in use**: Change PORT in backend/.env
- **Expo won't start**: `npm install -g expo-cli`
- **Simulator not opening**: Install Xcode (Mac) or Android Studio

Still stuck? Check:
- Node.js version: `node -v` (should be 18+)
- npm version: `npm -v` (should be 8+)
- Expo CLI: `npx expo --version`

