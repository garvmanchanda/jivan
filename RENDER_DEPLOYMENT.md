# 🚀 Deploy Backend to Render.com

## Step-by-Step Deployment Guide

### ✅ Prerequisites Completed:
- `render.yaml` file created ✅
- Backend code ready ✅
- Package.json configured ✅

---

## 📋 Deployment Steps:

### **Step 1: Push Code to GitHub**

1. **Initialize Git** (if not already done):
```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan
git init
git add .
git commit -m "Initial commit - Jivan healthcare app"
```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name: `jivan-healthcare`
   - Make it **Private**
   - DON'T initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR-USERNAME/jivan-healthcare.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Deploy on Render.com**

1. **Go to Render.com**:
   - Visit: https://render.com
   - Sign up / Log in (use GitHub login for easy connection)

2. **Create New Web Service**:
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

3. **Connect Repository**:
   - Click **"Connect a repository"**
   - Select **"GitHub"**
   - Find and select **`jivan-healthcare`**
   - Click **"Connect"**

4. **Configure Service**:
   - **Name**: `jivan-backend`
   - **Region**: Singapore (closest to India) or Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Add Environment Variables**:
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these:
   - **Key**: `OPENAI_API_KEY`
     **Value**: `[YOUR_OPENAI_API_KEY]` (paste your actual key here)
   
   - **Key**: `NODE_ENV`
     **Value**: `production`
   
   - **Key**: `ALLOWED_ORIGINS`
     **Value**: `*`
   
   - **Key**: `PORT`
     **Value**: Leave empty (Render auto-assigns)

6. **Create Web Service**:
   - Click **"Create Web Service"**
   - Wait 3-5 minutes for deployment

7. **Get Your Backend URL**:
   - Once deployed, you'll see: `https://jivan-backend.onrender.com`
   - Copy this URL!

---

### **Step 3: Update Mobile App with Production URL**

Edit `services/ai.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.6:3000'  // Local development
  : 'https://jivan-backend.onrender.com';  // Production (Render)
```

---

### **Step 4: Test Production Backend**

In your browser, visit:
```
https://jivan-backend.onrender.com
```

Should show:
```json
{"status":"healthy","message":"Jivan Backend API"}
```

---

### **Step 5: Get Permanent Expo QR Code**

1. **Publish Expo App**:
```bash
cd /Users/garvmanchanda/Desktop/Cursor\ Projects/jivan
npx eas-cli build:configure
npx expo publish
```

2. **Get Shareable Link**:
   - After publishing, you'll get a permanent link
   - Share the QR code with your 3-4 testers
   - They scan with Expo Go app

**Alternative (Simpler):**
```bash
npx expo start --tunnel
```
- This gives you a permanent QR for testing
- Works even when your laptop is closed

---

## 🔧 Troubleshooting:

### **Render Deploy Failed?**
- Check **Logs** tab in Render dashboard
- Common issues:
  - Missing `package.json` → Make sure Root Directory is `backend`
  - Build fails → Check Node version (Render uses latest)

### **Backend Returns 500?**
- Check Environment Variables are set correctly
- View **Logs** tab for errors
- Most common: Missing OPENAI_API_KEY

### **Expo Can't Connect to Render?**
- Check CORS is allowing all origins (`ALLOWED_ORIGINS=*`)
- Test backend URL in browser first
- Check mobile app has correct production URL

---

## 💰 Cost:

**Render.com Free Tier:**
- ✅ 750 hours/month free
- ✅ Auto-sleeps after 15 min inactivity
- ✅ Wakes up on first request (~30 seconds)
- ✅ Perfect for testing with 3-4 users

**OpenAI API:**
- Same as before (~$0.02/query)

---

## 📱 Sharing with Testers:

### **Option 1: Expo Publish (Permanent)**
```bash
npx expo publish
```
Then share the project URL: `exp://exp.host/@your-username/jivan`

### **Option 2: EAS Build (Better)**
```bash
npx eas build --platform android --profile preview
```
Creates an APK file testers can install

### **Option 3: Tunnel (Quick Testing)**
```bash
npx expo start --tunnel
```
Share the QR code (works anywhere, internet required)

---

## ✅ Deployment Checklist:

- [ ] Push code to GitHub
- [ ] Create Render.com account
- [ ] Deploy backend on Render
- [ ] Copy production URL
- [ ] Update `services/ai.ts` with production URL
- [ ] Test backend health endpoint
- [ ] Publish Expo app or use tunnel
- [ ] Share QR code with testers

---

## 🎯 What to Tell Your Testers:

"Install Expo Go app from App Store, then scan this QR code to test Jivan!"

---

**Let me know which step you're stuck on and I'll help you through it!** 🚀

Would you like me to:
- A) Help you push to GitHub?
- B) Complete the Render configuration?
- C) Update the mobile app with production URL?
- D) All of the above?

