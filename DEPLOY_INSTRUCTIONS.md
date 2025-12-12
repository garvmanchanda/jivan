# Phase 1 Deployment Instructions

## 1. Deploy Supabase Edge Functions

### Step 1: Login to Supabase CLI
```bash
supabase login
```
This will open a browser window for authentication.

### Step 2: Link your project
```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan
supabase link --project-ref gzmfehoyqyjydegwgbjz
```

### Step 3: Set the OpenAI API Key as a secret
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

### Step 4: Deploy the Edge Functions
```bash
supabase functions deploy transcribe
supabase functions deploy analyze
```

### Step 5: Verify deployment
Your Edge Functions will be available at:
- `https://gzmfehoyqyjydegwgbjz.supabase.co/functions/v1/transcribe`
- `https://gzmfehoyqyjydegwgbjz.supabase.co/functions/v1/analyze`

---

## 2. Build Expo Dev Client for iOS

### Option A: Local Build (Requires Xcode)
```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan

# Generate native projects
npx expo prebuild

# Build and run on iOS
npx expo run:ios
```

This will:
1. Generate the `ios/` folder with native code
2. Build the app using Xcode
3. Install it on your iPhone (connected via USB) or Simulator

### Option B: EAS Build (Cloud Build - Recommended)
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform ios
```

After the build completes, you'll receive a link to download and install the app.

---

## 3. Running the Dev Client

Once installed, start your development server:
```bash
npx expo start --dev-client
```

Then open the Jivan app on your phone - it will automatically connect to your dev server.

---

## Success Criteria

After completing these steps:
- [ ] App opens directly from home screen (no Expo Go)
- [ ] No cold start delays (Edge Functions are instant)
- [ ] Voice → response feels fast (streaming enabled)
- [ ] End-to-end voice → response < 4-5 seconds
