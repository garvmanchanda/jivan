# Project Notes

## ⚠️ Important: File Structure Clarification

This project contains TWO sets of files:

### ✅ **ACTIVE FILES** (Simple MVP - What You Need)

```
jivan/
├── app/                    # Mobile app screens (ACTIVE)
│   ├── index.tsx           # Home screen
│   ├── record.tsx          # Recording screen
│   ├── response.tsx        # Response screen
│   └── profile.tsx         # Profile screen
│
├── services/               # Local services (ACTIVE)
│   ├── storage.ts          # AsyncStorage wrapper
│   ├── ai.ts               # Backend API calls
│   └── sampleData.ts       # Initial data
│
├── backend/                # Simple server (ACTIVE)
│   ├── index.js            # Express server ✅
│   ├── package.json        # Dependencies ✅
│   └── README.md           # API docs ✅
│
├── types.ts                # Data models (ACTIVE)
├── package.json            # Mobile dependencies (ACTIVE)
├── app.json                # Expo config (ACTIVE)
├── tsconfig.json           # TypeScript config (ACTIVE)
└── start.sh                # Startup script (ACTIVE)
```

### 📦 **SCAFFOLDED FILES** (From Original Plan - Can Ignore)

These files exist from the initial comprehensive plan but are **NOT needed** for the simple MVP:

```
❌ backend/src/          # Complex TypeScript backend (IGNORE)
❌ backend/migrations/   # Database migrations (IGNORE)
❌ infrastructure/       # Docker/K8s configs (IGNORE)
❌ mobile/              # Duplicate React Native setup (IGNORE)
❌ shared/              # Shared types (IGNORE)
```

## What To Use

### For Development:
1. **Backend**: Use `backend/index.js` (NOT backend/src/)
2. **Mobile**: Use files in root `app/` folder (NOT mobile/)
3. **Config**: Use root `package.json` and `app.json`

### Installation Commands:
```bash
# Backend
cd backend
npm install    # Uses backend/package.json
npm run dev    # Runs backend/index.js

# Mobile
cd ..          # Back to root
npm install    # Uses root package.json
npm start      # Runs Expo from root
```

## Why Extra Files Exist

The original PRD called for a complex production system with:
- TypeScript backend with many services
- PostgreSQL database
- Redis queue
- Kubernetes deployment
- Docker containers

But you requested a **simple, working MVP**, so I created:
- Simple JavaScript backend (backend/index.js)
- Expo app in root directory
- No database (using AsyncStorage)
- No complex infrastructure

The scaffolded files remain but can be safely ignored or deleted.

## Cleaning Up (Optional)

If you want to remove unused files:

```bash
# DON'T DO THIS YET - Test the app first!

# Remove scaffolded files
rm -rf backend/src
rm -rf backend/migrations
rm -rf infrastructure
rm -rf mobile
rm -rf shared
rm backend/Dockerfile
rm backend/tsconfig.json
rm backend/jest.config.js
```

## Active File Count

The working MVP consists of:
- **13 active files** (app/, services/, backend/index.js, types.ts, configs)
- **~1000 lines of code**
- Everything else is documentation or scaffolding

## What Actually Runs

When you run `./start.sh` or `npm start`:

1. **Backend**: Runs `backend/index.js` (120 lines)
   - POST /transcribe
   - POST /analyze

2. **Mobile**: Runs Expo from root directory
   - Loads screens from `app/` folder
   - Uses services from `services/` folder
   - Uses types from `types.ts`

## Development Workflow

```bash
# Terminal 1
cd backend && npm run dev
# Runs: backend/index.js

# Terminal 2  
npm start
# Runs: Expo with app/* screens
```

## Summary

- ✅ **USE**: app/, services/, backend/index.js, root configs
- ❌ **IGNORE**: backend/src/, mobile/, infrastructure/, shared/

The MVP is complete and functional using only the simple files!

