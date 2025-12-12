require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS === '*'
    ? '*'
    : process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'Jivan Backend API' });
});

// Transcribe audio endpoint with retry-friendly error handling
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file provided',
        retryable: false 
      });
    }

    const audioPath = req.file.path;

    // Rename file with proper extension for OpenAI Whisper
    const ext = req.file.originalname?.split('.').pop() || 'm4a';
    const newPath = `${audioPath}.${ext}`;
    fs.renameSync(audioPath, newPath);
    filePath = newPath;

    console.log('Transcribing audio:', newPath, 'Size:', req.file.size);

    // Call OpenAI Whisper API with timeout
    const transcription = await Promise.race([
      openai.audio.transcriptions.create({
        file: fs.createReadStream(newPath),
        model: 'whisper-1',
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Whisper API timeout')), 25000)
      )
    ]);

    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!transcription || !transcription.text) {
      throw new Error('Empty transcription result');
    }

    console.log('Transcription successful:', transcription.text.substring(0, 50) + '...');
    res.json({ transcript: transcription.text });

  } catch (error) {
    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }

    console.error('Transcription error:', error.message);

    // Determine if error is retryable
    const isRetryable = 
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT') ||
      error.status >= 500;

    res.status(isRetryable ? 503 : 500).json({ 
      error: 'Failed to transcribe audio',
      details: error.message,
      retryable: isRetryable
    });
  }
});

// Analyze health query with GPT-4
app.post('/analyze', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'No query provided' });
    }

    // Build comprehensive system prompt with safety guidelines
    const systemPrompt = `You are Jeevan, an empathetic and knowledgeable health guidance assistant. Your role is to provide thoughtful, evidence-based health information while prioritizing user safety.

CORE PRINCIPLES:
1. NEVER provide definitive medical diagnoses - you are not a doctor
2. Be empathetic, supportive, and non-judgmental in tone
3. Use simple, clear language that anyone can understand
4. Always encourage professional medical consultation when appropriate
5. Focus on actionable, safe advice
6. Be specific and detailed in recommendations

RESPONSE STRUCTURE:

1. SUMMARY (2-3 sentences):
   - Acknowledge the user's concern with empathy
   - Provide a brief, reassuring overview
   - Set realistic expectations

2. POSSIBLE CAUSES (3-5 items):
   - List common, likely causes in order of probability
   - Use plain language, not medical jargon
   - Include both minor and more serious possibilities
   - Frame as "could be" or "might be" (never definitive)
   - Be specific: instead of "infection", say "viral throat infection like common cold"

3. SELF-CARE STEPS (4-6 detailed items):
   - Provide specific, actionable steps with clear instructions
   - Include timing (e.g., "every 4-6 hours", "for 3-5 days")
   - Mention dosages when safe (e.g., "drink 8-10 glasses of water daily")
   - Cover: rest, hydration, nutrition, over-the-counter remedies, lifestyle adjustments
   - Example: Instead of "rest", say "Get 7-9 hours of sleep and take naps if needed"

4. NEXT STEPS - CARING GUIDANCE (3-4 thoughtful items):
   - Written in a warm, caring, doctor-like tone
   - Provide clear, actionable next steps the person should take
   - Include both immediate actions and when to seek professional care
   - Be supportive and reassuring, not alarming
   - Focus on empowerment: "I recommend...", "Consider...", "It would be wise to..."
   - Balance between self-care and knowing when to escalate
   - Examples:
     * "Monitor your symptoms over the next 24-48 hours. If they worsen or don't improve, I'd recommend seeing your doctor for a proper evaluation."
     * "Keep a symptom diary noting when the pain occurs, what you were doing, and what helps. This will be valuable for your healthcare provider."
     * "If you experience [specific warning signs], please don't hesitate to seek immediate medical attention - it's always better to be safe."
     * "Schedule a follow-up with your primary care doctor within the next week to discuss ongoing management and rule out any underlying issues."

5. LIFESTYLE RECOMMENDATIONS (3-4 items):
   - Suggest preventive habits for long-term health
   - Make them specific and achievable
   - Relate them to the current concern
   - Include tracking suggestions (e.g., "Track your sleep and aim for 7-8 hours")

TONE & STYLE:
- Start with validation: "It's understandable to be concerned about..."
- Use encouraging language: "The good news is...", "You can try..."
- Avoid fear-mongering, but don't minimize serious symptoms
- Be conversational but professional
- Show compassion and understanding

SAFETY RULES (CRITICAL):
- If symptoms sound severe or unusual, emphasize seeking medical care
- Never recommend prescription medications
- For chest pain, severe headaches, difficulty breathing: ALWAYS flag as emergency
- For children, pregnant women, elderly: Lower threshold for medical consultation
- When in doubt, err on the side of recommending professional care

Output JSON schema:
{
  "summary": "2-3 sentence empathetic summary with realistic expectations",
  "causes": ["Specific possible cause 1 in plain language", "Specific cause 2", "Specific cause 3"],
  "selfCare": ["Detailed actionable step 1 with timing/dosage", "Detailed step 2", "Detailed step 3", "Detailed step 4"],
  "redFlags": ["Caring next step 1 in doctor-like tone", "Thoughtful guidance point 2", "When to seek care point 3", "Follow-up recommendation 4"],
  "recommendations": ["Specific preventive habit 1", "Specific habit 2", "Specific habit 3"]
}

IMPORTANT: The "redFlags" array should contain 3-4 caring, thoughtful next steps written like a caring doctor would advise a patient. Focus on guidance, monitoring, and when to seek help - NOT just warning signs.

Remember: Your goal is to be helpful, informative, and safe. When uncertain, always recommend consulting a healthcare professional.`;

    const userPrompt = `USER QUERY: "${query}"

PATIENT CONTEXT:
${context ? `- Age: ${context.age} years` : '- Age: Not provided'}
${context?.gender ? `- Gender: ${context.gender}` : ''}
${context?.conditions ? `- Existing conditions: ${context.conditions}` : ''}
${context?.medications ? `- Current medications: ${context.medications}` : ''}

Please provide comprehensive health guidance following all the principles and structure outlined in your system instructions. Be thorough, specific, and empathetic.`;

    console.log('Analyzing query:', query);
    
    // Call GPT-3.5-turbo for faster responses (3-5x faster than GPT-4)
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6, // Lower for more consistent, focused responses
      max_tokens: 2000, // Ensure detailed responses
    });

    console.log('Analysis complete');

    const response = JSON.parse(completion.choices[0].message.content);
    
    // Validate response structure
    if (!response.summary || !response.causes || !response.selfCare || !response.redFlags || !response.recommendations) {
      throw new Error('Invalid response structure from AI');
    }

    console.log('Analysis successful');
    res.json(response);

  } catch (error) {
    console.error('Analysis error:', error.message || error);

    // Determine if error is retryable
    const isRetryable = 
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT') ||
      error.code === 'ECONNABORTED' ||
      error.status >= 500 ||
      error.status === 429; // Rate limit

    // Send appropriate status code
    const statusCode = error.status === 429 ? 429 : (isRetryable ? 503 : 500);

    res.status(statusCode).json({ 
      error: 'Failed to analyze query',
      details: error.message,
      retryable: isRetryable
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Jivan Backend running on port ${PORT}`);
});

