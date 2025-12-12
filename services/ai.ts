import axios, { AxiosError } from 'axios';
import { AIResponse } from '../types';
import NetInfo from '@react-native-community/netinfo';

// API Configuration - Using deployed Render backend
const API_URL = 'https://jivan-backend.onrender.com';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Configure axios with timeout
axios.defaults.timeout = REQUEST_TIMEOUT;

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
    // If no more retries, throw the error
    if (attempt >= retries) {
      throw error;
    }

    // Check if error is retryable
    const isRetryable = isRetryableError(error);
    if (!isRetryable) {
      throw error;
    }

    console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
    
    // Wait with exponential backoff
    await sleep(delay);
    
    // Retry with exponentially increased delay
    return retryWithBackoff(fn, retries, delay * 2, attempt + 1);
  }
}

// Determine if error is retryable
function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Timeout errors are retryable
  if (error.message?.includes('timeout')) {
    return true;
  }

  // HTTP 5xx errors are retryable
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit) is retryable
  if (error.response?.status === 429) {
    return true;
  }

  // Other errors are not retryable
  return false;
}

// Get user-friendly error message
function getUserFriendlyError(error: any): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Network connectivity issues
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Connection timed out. Please check your internet connection and try again.';
  }

  // No network
  if (error.message?.includes('Network Error')) {
    return 'No internet connection. Please check your network and try again.';
  }

  // Server errors
  if (error.response?.status >= 500) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  // Rate limiting
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Client errors
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return error.response?.data?.error || 'Something went wrong. Please try again.';
  }

  // Generic error
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

// Transcribe audio with retry and fallback
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  // Check network first
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

      console.log('Calling Whisper API for transcription...');
      const response = await axios.post(`${API_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: REQUEST_TIMEOUT,
      });

      if (!response.data?.transcript) {
        throw new Error('Invalid transcription response');
      }

      console.log('Transcription successful');
      return response.data.transcript;
    });
  } catch (error) {
    console.error('Transcription failed after retries:', error);
    throw new Error(getUserFriendlyError(error));
  }
};

// Get AI response with retry and fallback
export const getAIResponse = async (
  query: string,
  profileContext?: { age: number; recentVitals?: any }
): Promise<AIResponse> => {
  // Check network first
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    return await retryWithBackoff(async () => {
      console.log('Calling OpenAI API for analysis...');
      const response = await axios.post(
        `${API_URL}/analyze`,
        {
          query,
          context: profileContext,
        },
        {
          timeout: REQUEST_TIMEOUT,
        }
      );

      if (!response.data) {
        throw new Error('Invalid AI response');
      }

      console.log('AI analysis successful');
      return response.data;
    });
  } catch (error) {
    console.error('AI analysis failed after retries:', error);
    
    // Return fallback response instead of crashing
    console.log('Returning fallback response...');
    return getFallbackResponse(query);
  }
};

