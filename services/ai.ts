import { AIResponse } from '../types';
import NetInfo from '@react-native-community/netinfo';

// Supabase Edge Functions URL - using the existing Supabase project
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gzmfehoyqyjydegwgbjz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Construct Edge Function URLs
const TRANSCRIBE_URL = `${SUPABASE_URL}/functions/v1/transcribe`;
const ANALYZE_URL = `${SUPABASE_URL}/functions/v1/analyze`;

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 500; // 500ms - faster retry for edge functions
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check network connectivity
const checkNetworkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// Exponential backoff retry logic
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= retries) {
      throw error;
    }

    const isRetryable = isRetryableError(error);
    if (!isRetryable) {
      throw error;
    }

    console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
    await sleep(delay);
    return retryWithBackoff(fn, retries, delay * 2, attempt + 1);
  }
}

// Determine if error is retryable
function isRetryableError(error: any): boolean {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }
  if (error.message?.includes('timeout')) {
    return true;
  }
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  if (error.status === 429) {
    return true;
  }
  return false;
}

// Get user-friendly error message
function getUserFriendlyError(error: any): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Connection timed out. Please check your internet connection and try again.';
  }

  if (error.message?.includes('Network Error') || error.message?.includes('network')) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error.status >= 500) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.status >= 400 && error.status < 500) {
    return error.message || 'Something went wrong. Please try again.';
  }

  return 'Unable to process your request. Please try again.';
}

// Fallback response when all retries fail
const getFallbackResponse = (query: string): AIResponse => {
  return {
    summary: "I'm currently unable to analyze your health concern due to technical difficulties. However, I want to ensure you get the care you need.",
    causes: [
      "Technical issue prevented analysis",
      "Your query has been saved and you can retry shortly"
    ],
    selfCare: [
      "If your symptoms are severe, please don't wait - contact a healthcare provider immediately",
      "For non-urgent concerns, you can retry this query in a few minutes",
      "Keep notes about your symptoms, their severity, and when they started",
      "Stay hydrated and rest while you wait to retry"
    ],
    redFlags: [
      "If you're experiencing severe pain, difficulty breathing, chest pain, or other emergency symptoms, please call emergency services (911) or go to the nearest emergency room immediately.",
      "For urgent but non-emergency concerns, consider calling your doctor's office or a telehealth service.",
      "You can retry your query in a few minutes once our systems are back online.",
      "Your health and safety are the top priority - don't hesitate to seek in-person medical care if needed."
    ],
    recommendations: [
      "Save your symptoms and questions to discuss with a healthcare provider",
      "Consider keeping a health journal to track patterns",
      "When feeling better, ensure you have contact information for your primary care doctor and local urgent care"
    ]
  };
};

// Transcribe audio using Supabase Edge Function
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    return await retryWithBackoff(async () => {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      console.log('Calling Whisper API via Edge Function...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(TRANSCRIBE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }

        const data = await response.json();

        if (!data?.transcript) {
          throw new Error('Invalid transcription response');
        }

        console.log('Transcription successful');
        return data.transcript;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  } catch (error) {
    console.error('Transcription failed after retries:', error);
    throw new Error(getUserFriendlyError(error));
  }
};

// Callback type for streaming updates
export type StreamCallback = (partialContent: string) => void;

// Get AI response with streaming support
export const getAIResponse = async (
  query: string,
  profileContext?: { age: number; recentVitals?: any },
  onStreamUpdate?: StreamCallback
): Promise<AIResponse> => {
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    return await retryWithBackoff(async () => {
      console.log('Calling OpenAI API via Edge Function...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(ANALYZE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            context: profileContext,
            stream: !!onStreamUpdate,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }

        // Handle streaming response
        if (onStreamUpdate && response.headers.get('content-type')?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

              for (const line of lines) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    onStreamUpdate(fullContent);
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Parse the final JSON response
          try {
            const result = JSON.parse(fullContent);
            if (!result.summary) {
              throw new Error('Invalid AI response');
            }
            console.log('Streaming AI analysis complete');
            return result;
          } catch {
            throw new Error('Failed to parse streaming response');
          }
        }

        // Handle non-streaming response
        const data = await response.json();

        if (!data) {
          throw new Error('Invalid AI response');
        }

        console.log('AI analysis successful');
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  } catch (error) {
    console.error('AI analysis failed after retries:', error);
    console.log('Returning fallback response...');
    return getFallbackResponse(query);
  }
};

// Warmup function - no longer needed for Edge Functions (no cold starts!)
// Keeping for backward compatibility but it's now a no-op
export const warmupBackend = async (): Promise<void> => {
  console.log('Edge Functions have no cold starts - warmup not needed');
};
