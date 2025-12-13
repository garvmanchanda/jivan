import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear old AsyncStorage data after migrating to Supabase
 * This removes all local data that's now stored in Supabase
 */
export const clearOldLocalData = async (): Promise<void> => {
  const keysToRemove = [
    '@jivan_profiles',
    '@jivan_user_phone',
  ];

  // Also remove all profile-specific keys
  const allKeys = await AsyncStorage.getAllKeys();
  const profileKeys = allKeys.filter(key => 
    key.startsWith('@jivan_conversations_') ||
    key.startsWith('@jivan_vitals_')
  );

  const allKeysToRemove = [...keysToRemove, ...profileKeys];

  try {
    await AsyncStorage.multiRemove(allKeysToRemove);
    console.log('✅ Cleared old local data. Everything now in Supabase!');
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
};

