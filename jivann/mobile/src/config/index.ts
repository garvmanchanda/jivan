// Environment configuration
// Values should be loaded from environment variables

export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  mixpanel: {
    token: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
  },
  recording: {
    maxDurationSeconds: 60,
    sampleRate: 44100,
    bitRate: 128000,
  },
  api: {
    conversationEndpoint: '/functions/v1/conversation',
  },
} as const;

// Validate required config
export function validateConfig(): boolean {
  const required = [
    config.supabase.url,
    config.supabase.anonKey,
  ];
  
  return required.every((value) => value && value.length > 0);
}

