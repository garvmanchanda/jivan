import { supabase } from './supabase';
import type { Profile, Vital, Conversation } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_PROFILE_KEY = '@jivan_active_profile';
const CURRENT_USER_ID_KEY = '@jivan_current_user_id';

// =====================================================
// USER MANAGEMENT
// =====================================================

export const getUserByPhone = async (phoneNumber: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is okay
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

export const createUser = async (phoneNumber: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ phone_number: phoneNumber }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  // Store user ID locally for quick access
  await AsyncStorage.setItem(CURRENT_USER_ID_KEY, data.id);
  return data;
};

export const getCurrentUserId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
};

export const setCurrentUserId = async (userId: string): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
};

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

export const getProfiles = async (userId?: string): Promise<Profile[]> => {
  const userIdToUse = userId || await getCurrentUserId();
  
  if (!userIdToUse) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userIdToUse)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data as Profile[];
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('No user ID found');
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profile.id)
    .single();

  if (existing) {
    // Update existing profile
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        age: profile.age,
        relation: profile.relation,
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  } else {
    // Insert new profile - let Supabase generate UUID
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        user_id: userId,
        name: profile.name,
        age: profile.age,
        relation: profile.relation,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    // Update the profile object with the generated UUID
    profile.id = data.id;
  }
};

export const updateProfileAge = async (profileId: string, age: number): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ age, updated_at: new Date().toISOString() })
    .eq('id', profileId);

  if (error) {
    console.error('Error updating profile age:', error);
    throw error;
  }
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }

  // Clean up local active profile if needed
  const activeProfileId = await getActiveProfileId();
  if (activeProfileId === profileId) {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};

export const getActiveProfileId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
};

export const setActiveProfileId = async (profileId: string): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
};

// =====================================================
// VITALS MANAGEMENT
// =====================================================

export const getVitals = async (profileId: string): Promise<Vital[]> => {
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('profile_id', profileId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching vitals:', error);
    return [];
  }

  // Transform database format (snake_case) to app format (camelCase)
  return (data || []).map(v => ({
    type: v.type,
    value: v.value,
    unit: v.unit,
    date: v.date,
    isDaily: v.is_daily || false,
  })) as Vital[];
};

export const saveVital = async (profileId: string, vital: Vital): Promise<void> => {
  // Let Supabase generate UUID for vital
  const { error } = await supabase
    .from('vitals')
    .insert([{
      profile_id: profileId,
      type: vital.type,
      value: vital.value,
      unit: vital.unit,
      date: vital.date,
      is_daily: vital.isDaily || false,
    }]);

  if (error) {
    console.error('Error saving vital:', error);
    throw error;
  }
};

// =====================================================
// CONVERSATIONS MANAGEMENT
// =====================================================

export const getConversations = async (profileId: string): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('profile_id', profileId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Transform database format to app format
  return data.map(conv => ({
    id: conv.id,
    profileId: conv.profile_id,
    query: conv.query,
    summary: conv.summary,
    recommendations: conv.recommendations || [],
    redFlag: conv.red_flag,
    timestamp: conv.timestamp,
  })) as Conversation[];
};

export const saveConversation = async (conversation: Conversation): Promise<void> => {
  // Let Supabase generate UUID for conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      profile_id: conversation.profileId,
      query: conversation.query,
      summary: conversation.summary,
      recommendations: conversation.recommendations,
      red_flag: conversation.redFlag,
      timestamp: conversation.timestamp,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }

  // Update conversation ID with generated UUID
  conversation.id = data.id;
};

// =====================================================
// HABITS MANAGEMENT (NOT IN DATABASE YET - KEEPING LOCAL)
// We can add this to Supabase later if needed
// =====================================================

import { Habit } from '../types';
const HABITS_KEY = '@jivan_habits';

export const getHabits = async (profileId: string): Promise<Habit[]> => {
  const data = await AsyncStorage.getItem(`${HABITS_KEY}_${profileId}`);
  return data ? JSON.parse(data) : [];
};

export const saveHabits = async (profileId: string, habits: Habit[]): Promise<void> => {
  await AsyncStorage.setItem(`${HABITS_KEY}_${profileId}`, JSON.stringify(habits));
};

export const toggleHabit = async (profileId: string, habitId: string): Promise<void> => {
  const habits = await getHabits(profileId);
  const habit = habits.find(h => h.id === habitId);
  if (habit) {
    habit.completed = !habit.completed;
    await saveHabits(profileId, habits);
  }
};

