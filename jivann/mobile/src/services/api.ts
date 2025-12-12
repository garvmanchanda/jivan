import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { config } from '../config';
import { analytics } from './analytics';
import type { ConversationResponse, FamilyMember, Conversation, Habit, HabitLog } from '../types';

// ============================================
// AUDIO UPLOAD
// ============================================

/**
 * Upload audio file to Supabase Storage
 * @param fileUri - Local file URI of the recorded audio
 * @param userId - Current user's ID
 * @returns Public URL of the uploaded audio
 */
export async function uploadAudio(fileUri: string, userId: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}.m4a`;
  
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  // Decode base64 to array buffer
  const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(fileName, arrayBuffer, {
      contentType: 'audio/m4a',
      upsert: false,
    });
  
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
  
  // Get signed URL for the uploaded file
  const { data: urlData, error: urlError } = await supabase.storage
    .from('audio-recordings')
    .createSignedUrl(data.path, 3600); // 1 hour expiry
  
  if (urlError || !urlData) {
    throw new Error(`Failed to get audio URL: ${urlError?.message}`);
  }
  
  return urlData.signedUrl;
}

// ============================================
// CONVERSATION API
// ============================================

/**
 * Send conversation request to Edge Function
 * @param profileId - Family member profile ID
 * @param audioUrl - Optional audio URL (if recorded)
 * @param transcript - Optional transcript (if edited/typed)
 */
export async function sendConversation(
  profileId: string,
  audioUrl?: string,
  transcript?: string
): Promise<ConversationResponse> {
  analytics.trackConversationRequested(profileId);
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('conversation', {
      body: {
        profile_id: profileId,
        audio_url: audioUrl,
        transcript,
      },
    });
    
    if (error) {
      throw error;
    }
    
    const response = data as ConversationResponse;
    
    if (response.success) {
      analytics.trackConversationCompleted(
        profileId,
        response.conversation_id!,
        Date.now() - startTime
      );
    }
    
    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// FAMILY MEMBERS
// ============================================

/**
 * Get all family members for current user
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to fetch family members: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Create a new family member
 */
export async function createFamilyMember(
  member: Omit<FamilyMember, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
): Promise<FamilyMember> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('family_members')
    .insert({
      ...member,
      owner_id: user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create family member: ${error.message}`);
  }
  
  return data;
}

/**
 * Update a family member
 */
export async function updateFamilyMember(
  id: string,
  updates: Partial<FamilyMember>
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update family member: ${error.message}`);
  }
  
  return data;
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Get conversations for a specific profile
 */
export async function getConversations(
  profileId: string,
  limit = 20
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }
  
  return data || [];
}

// ============================================
// HABITS
// ============================================

/**
 * Get all habits for a profile
 */
export async function getHabits(profileId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to fetch habits: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Create a new habit
 */
export async function createHabit(
  habit: Omit<Habit, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
): Promise<Habit> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('habits')
    .insert({
      ...habit,
      owner_id: user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create habit: ${error.message}`);
  }
  
  analytics.trackHabitStarted(habit.profile_id, data.id, habit.name);
  
  return data;
}

/**
 * Log a habit completion
 */
export async function logHabit(
  habitId: string,
  profileId: string,
  count = 1,
  notes?: string
): Promise<HabitLog> {
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      habit_id: habitId,
      profile_id: profileId,
      count,
      notes,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to log habit: ${error.message}`);
  }
  
  analytics.trackHabitLogged(profileId, habitId);
  
  return data;
}

// ============================================
// FEEDBACK
// ============================================

/**
 * Submit feedback for a conversation
 */
export async function submitFeedback(
  conversationId: string | null,
  rating: number,
  feedbackText?: string,
  feedbackType: 'general' | 'accuracy' | 'helpfulness' | 'bug' = 'general'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { error } = await supabase
    .from('feedback')
    .insert({
      conversation_id: conversationId,
      owner_id: user.id,
      rating,
      feedback_text: feedbackText,
      feedback_type: feedbackType,
    });
  
  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
  
  analytics.trackFeedbackGiven(rating, feedbackType);
}

