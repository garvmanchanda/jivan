# Jivan Mobile App

React Native mobile application for the Jivan Healthcare Concierge.

## Features

- Voice and text-based health queries
- Profile management for family members
- Conversation history with AI-powered responses
- Vital tracking (BP, HR, temperature, etc.)
- Medical report upload and OCR
- Habit tracking and recommendations
- Firebase Authentication

## Prerequisites

- Node.js 18+
- React Native development environment
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

## Installation

```bash
npm install
```

For iOS:
```bash
cd ios && pod install && cd ..
```

## Configuration

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

## Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

### Start Metro Bundler

```bash
npm start
```

## Project Structure

```
src/
├── screens/         # Screen components
├── components/      # Reusable UI components
├── services/        # API and business logic services
├── context/         # React context providers
├── navigation/      # Navigation configuration
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace Jivan.xcworkspace -scheme Jivan -configuration Release
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## Testing

```bash
npm test
```

## License

Proprietary - All rights reserved

