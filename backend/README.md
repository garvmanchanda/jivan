# Jivan Backend

Simple Node.js backend for handling audio transcription and AI analysis.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in this directory with:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

3. Run the server:
```bash
npm run dev
```

## API Endpoints

### POST /transcribe
Transcribe audio file using OpenAI Whisper.

**Request:** multipart/form-data with `audio` file

**Response:**
```json
{
  "transcript": "transcribed text here"
}
```

### POST /analyze
Analyze health query using GPT-4.

**Request:**
```json
{
  "query": "I have a headache",
  "context": {
    "age": 32
  }
}
```

**Response:**
```json
{
  "summary": "Brief summary",
  "causes": ["possible cause 1"],
  "selfCare": ["self-care step 1"],
  "redFlags": ["warning sign 1"],
  "recommendations": ["habit 1"]
}
```

## Requirements

- Node.js 18+
- OpenAI API key
