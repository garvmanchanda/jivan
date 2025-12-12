import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, Conversation, Vital, Habit } from '../types';

const PROFILES_KEY = '@jivan_profiles';
const CONVERSATIONS_KEY = '@jivan_conversations';
const VITALS_KEY = '@jivan_vitals';
const HABITS_KEY = '@jivan_habits';
const ACTIVE_PROFILE_KEY = '@jivan_active_profile';

// Profile Management
export const getProfiles = async (): Promise<Profile[]> => {
  const data = await AsyncStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  const profiles = await getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const getActiveProfileId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
};

export const setActiveProfileId = async (profileId: string): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  // Get all profiles
  const profiles = await getProfiles();
  
  // Remove the profile
  const updatedProfiles = profiles.filter(p => p.id !== profileId);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
  
  // Delete all associated data
  await AsyncStorage.removeItem(`${CONVERSATIONS_KEY}_${profileId}`);
  await AsyncStorage.removeItem(`${VITALS_KEY}_${profileId}`);
  await AsyncStorage.removeItem(`${HABITS_KEY}_${profileId}`);
  
  // If this was the active profile, set a new one
  const activeProfileId = await getActiveProfileId();
  if (activeProfileId === profileId) {
    if (updatedProfiles.length > 0) {
      await setActiveProfileId(updatedProfiles[0].id);
    } else {
      await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }
};

// Conversation Management
export const getConversations = async (profileId: string): Promise<Conversation[]> => {
  const data = await AsyncStorage.getItem(`${CONVERSATIONS_KEY}_${profileId}`);
  return data ? JSON.parse(data) : [];
};

export const saveConversation = async (conversation: Conversation): Promise<void> => {
  const conversations = await getConversations(conversation.profileId);
  conversations.unshift(conversation);
  await AsyncStorage.setItem(
    `${CONVERSATIONS_KEY}_${conversation.profileId}`,
    JSON.stringify(conversations)
  );
};

// Vitals Management
export const getVitals = async (profileId: string): Promise<Vital[]> => {
  const data = await AsyncStorage.getItem(`${VITALS_KEY}_${profileId}`);
  return data ? JSON.parse(data) : [];
};

export const saveVital = async (profileId: string, vital: Vital): Promise<void> => {
  const vitals = await getVitals(profileId);
  vitals.push(vital);
  await AsyncStorage.setItem(`${VITALS_KEY}_${profileId}`, JSON.stringify(vitals));
};

// Habits Management
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

