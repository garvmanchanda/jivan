# Jivan - AI Healthcare Concierge

A family health management platform powered by AI. Voice-first interactions help families track health, manage medications, and get personalized health guidance.

## 🏗️ Architecture

```
jivann/
├── supabase/           # Database schema and migrations
│   └── schema.sql      # PostgreSQL schema with RLS policies
├── functions/          # Supabase Edge Functions
│   ├── conversation/   # Main AI conversation handler
│   │   ├── index.ts    # Edge function implementation
│   │   └── test.ts     # Mock tests
│   └── prompts/        # AI prompt templates
│       ├── system_prompt.md
│       └── response_template.jsonschema
└── mobile/             # Expo React Native app
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── screens/    # App screens
    │   ├── services/   # API and analytics
    │   ├── store/      # Zustand state management
    │   ├── theme/      # Design tokens
    │   └── types/      # TypeScript types
    └── App.tsx         # App entry point
```

## 🔧 Environment Variables

### Supabase Edge Functions

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Development
MOCK_MODE=false  # Set to 'true' to use mock responses without OpenAI
```

### Mobile App (Expo)

Create a `.env` file in the `/mobile` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Deno](https://deno.land/) v1.40+ (for Edge Functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (Xcode) or Android Emulator

### 1. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run the schema migration
supabase db push
```

### 2. Deploy Edge Functions

```bash
# Deploy the conversation function
supabase functions deploy conversation

# Set secrets (do this once)
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase secrets set MOCK_MODE=false
```

### 3. Run Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### 4. Run Edge Function Tests

```bash
# Run mock tests (no OpenAI key required)
cd functions/conversation
deno test --allow-env test.ts

# Test with mock mode locally
MOCK_MODE=true supabase functions serve conversation
```

## 📱 Features

### Current (MVP)

- [x] **Voice Recording** - Record health questions (up to 60s)
- [x] **Speech-to-Text** - OpenAI Whisper transcription
- [x] **AI Responses** - GPT-4 powered health guidance
- [x] **Family Profiles** - Manage multiple family members
- [x] **Conversation History** - View past interactions
- [x] **Urgency Levels** - Color-coded health priority
- [x] **Analytics** - Mixpanel event tracking

### Planned

- [ ] Medication tracking & reminders
- [ ] Appointment scheduling
- [ ] Health habit tracking
- [ ] Push notifications
- [ ] Symptom logging
- [ ] Health reports

## 🔐 Security

- **Row Level Security (RLS)** - All database tables are protected
- **Authenticated Access** - Supabase Auth with JWT tokens
- **Secure Storage** - Audio files are user-scoped in Supabase Storage
- **No Secrets in Code** - All sensitive data via environment variables

## 📊 Analytics Events

The app tracks the following Mixpanel events:

| Event | Description |
|-------|-------------|
| `app_open` | App launched |
| `start_recording` | User started recording |
| `recording_completed` | Recording finished |
| `conversation_requested` | API call initiated |
| `conversation_completed` | AI response received |
| `habit_started` | New habit created |
| `habit_logged` | Habit completion logged |
| `feedback_given` | User submitted feedback |

## 🧪 Development

### Mock Mode

For development without OpenAI API costs, enable mock mode:

```bash
# Edge Function
MOCK_MODE=true supabase functions serve conversation

# Or set in Supabase secrets for deployed function
supabase secrets set MOCK_MODE=true
```

### Type Checking

```bash
cd mobile
npm run typecheck
```

### Linting

```bash
cd mobile
npm run lint
```

## 📄 API Reference

### POST /functions/v1/conversation

Process a voice recording or transcript and get AI health guidance.

**Request Body:**

```json
{
  "profile_id": "uuid",
  "audio_url": "https://...",  // Optional if transcript provided
  "transcript": "string"       // Optional if audio_url provided
}
```

**Response:**

```json
{
  "success": true,
  "conversation_id": "uuid",
  "transcript": "User's transcribed question",
  "llm_response": {
    "intent": "symptom_check",
    "summary": "AI understanding of the question",
    "recommendations": [...],
    "follow_up_questions": [...],
    "urgency_level": "low|medium|high|emergency",
    "suggested_actions": [...]
  },
  "processing_time_ms": 1234
}
```

## 📜 License

Private - All rights reserved.

## 🤝 Contributing

This is a private project. Please contact the maintainers for access.

