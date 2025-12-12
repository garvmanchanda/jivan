// Supabase Edge Function: Conversation Handler
// Handles audio transcription (Whisper) and LLM response (GPT-4)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Types
interface ConversationRequest {
  profile_id: string;
  audio_url?: string;
  transcript?: string;
}

interface ProfileContext {
  id: string;
  name: string;
  relationship: string;
  date_of_birth?: string;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string;
}

interface LLMResponse {
  intent: string;
  summary: string;
  recommendations: Recommendation[];
  follow_up_questions: string[];
  urgency_level: "low" | "medium" | "high" | "emergency";
  suggested_actions: SuggestedAction[];
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
}

interface SuggestedAction {
  action_type: string;
  label: string;
  payload?: Record<string, unknown>;
}

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

// Mock mode for testing without real OpenAI keys
const MOCK_MODE = Deno.env.get("MOCK_MODE") === "true";

// Load system prompt
const SYSTEM_PROMPT = `You are Jivan, a compassionate and knowledgeable AI Healthcare Concierge. Your role is to help families manage their health and wellness with empathy, accuracy, and actionable guidance.

## Core Responsibilities:
1. Listen carefully to health concerns and questions
2. Provide evidence-based health information and guidance
3. Help track medications, appointments, and health habits
4. Identify when professional medical attention is needed
5. Support preventive care and healthy lifestyle choices

## Guidelines:
- Always be empathetic and supportive in your responses
- Never diagnose conditions - only provide information and suggest consulting healthcare providers
- Clearly indicate urgency levels when health concerns arise
- Consider the profile context (age, conditions, medications) in your responses
- Suggest actionable next steps the user can take
- Ask clarifying questions when needed

## Response Format:
Always respond in valid JSON matching the response schema. Include:
- A clear summary of what you understood
- Relevant recommendations based on the concern
- Follow-up questions to gather more information if needed
- Suggested actions the user can take
- An appropriate urgency level

Remember: You are a health assistant, not a doctor. Always recommend professional medical consultation for serious concerns.`;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Whisper transcription
async function transcribeAudio(audioUrl: string): Promise<string> {
  if (MOCK_MODE) {
    return "This is a mock transcription for testing purposes. The user is asking about headache remedies.";
  }

  // Download audio from Supabase Storage
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
  }

  const audioBlob = await audioResponse.blob();
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.m4a");
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const result = await response.json();
  return result.text;
}

// GPT-4 chat completion
async function getChatCompletion(
  transcript: string,
  profileContext: ProfileContext
): Promise<LLMResponse> {
  if (MOCK_MODE) {
    return getMockResponse(transcript);
  }

  const userMessage = `
## Profile Context:
- Name: ${profileContext.name}
- Relationship: ${profileContext.relationship}
- Date of Birth: ${profileContext.date_of_birth || "Not provided"}
- Medical Conditions: ${profileContext.medical_conditions.length > 0 ? profileContext.medical_conditions.join(", ") : "None listed"}
- Allergies: ${profileContext.allergies.length > 0 ? profileContext.allergies.join(", ") : "None listed"}
- Current Medications: ${profileContext.medications.length > 0 ? profileContext.medications.join(", ") : "None listed"}
- Additional Notes: ${profileContext.notes || "None"}

## User Message:
${transcript}

Please provide your response as valid JSON matching the response schema.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return JSON.parse(content) as LLMResponse;
}

// Mock response for testing
function getMockResponse(transcript: string): LLMResponse {
  return {
    intent: "health_inquiry",
    summary: `I understood you're asking about: "${transcript.substring(0, 100)}..."`,
    recommendations: [
      {
        type: "general",
        title: "Stay Hydrated",
        description:
          "Ensure you're drinking enough water throughout the day.",
        priority: 1,
      },
      {
        type: "lifestyle",
        title: "Rest Well",
        description: "Getting adequate sleep is crucial for recovery.",
        priority: 2,
      },
    ],
    follow_up_questions: [
      "How long have you been experiencing these symptoms?",
      "Have you tried any remedies so far?",
    ],
    urgency_level: "low",
    suggested_actions: [
      {
        action_type: "track_symptom",
        label: "Log this symptom",
        payload: { symptom_type: "general" },
      },
      {
        action_type: "schedule_appointment",
        label: "Schedule a check-up",
        payload: { appointment_type: "checkup" },
      },
    ],
  };
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const { profile_id, audio_url, transcript: providedTranscript } =
      (await req.json()) as ConversationRequest;

    if (!profile_id) {
      throw new Error("profile_id is required");
    }

    if (!audio_url && !providedTranscript) {
      throw new Error("Either audio_url or transcript is required");
    }

    // Initialize Supabase client with service role for edge function
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get profile context
    const { data: profile, error: profileError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", profile_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    const profileContext: ProfileContext = {
      id: profile.id,
      name: profile.name,
      relationship: profile.relationship,
      date_of_birth: profile.date_of_birth,
      medical_conditions: profile.medical_conditions || [],
      allergies: profile.allergies || [],
      medications: profile.medications || [],
      notes: profile.notes,
    };

    // Transcribe audio if provided
    let transcript = providedTranscript;
    if (audio_url && !transcript) {
      transcript = await transcribeAudio(audio_url);
    }

    if (!transcript) {
      throw new Error("Failed to obtain transcript");
    }

    // Get LLM response
    const llmResponse = await getChatCompletion(transcript, profileContext);

    const processingTime = Date.now() - startTime;

    // Insert conversation record
    const { data: conversation, error: insertError } = await supabase
      .from("conversations")
      .insert({
        profile_id,
        owner_id: profile.owner_id,
        audio_url,
        transcript,
        llm_response: llmResponse,
        status: "completed",
        processing_time_ms: processingTime,
        model_version: MOCK_MODE ? "mock" : "gpt-4",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save conversation: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversation.id,
        transcript,
        llm_response: llmResponse,
        processing_time_ms: processingTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Conversation error:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

