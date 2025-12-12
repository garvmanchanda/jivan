import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getUserByPhone, createUser, getProfiles, setCurrentUserId, setActiveProfileId } from '../services/supabaseStorage';
import { clearOldLocalData } from '../services/migrateToSupabase';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    // Validate phone number
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert('Invalid Number', 'Phone number should contain only digits');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user already exists in Supabase
      const existingUser = await getUserByPhone(phoneNumber);
      
      if (existingUser) {
        // Returning user
        console.log('Returning user found:', existingUser.id);
        await setCurrentUserId(existingUser.id);
        
        // Clean up old local data (migration)
        await clearOldLocalData();
        
        // Check if they have any profiles
        const profiles = await getProfiles(existingUser.id);
        
        if (profiles.length > 0) {
          // Has profiles - set first one as active and go to home
          await setActiveProfileId(profiles[0].id);
          console.log('User has profiles, auto-selected first profile, going to home');
          router.replace('/home');
        } else {
          // No profiles - go to onboarding
          console.log('User has no profiles, going to onboarding');
          router.replace('/onboarding-profile');
        }
      } else {
        // New user - create in database
        console.log('New user, creating account');
        const newUser = await createUser(phoneNumber);
        await setCurrentUserId(newUser.id);
        
        // Clean up old local data (migration)
        await clearOldLocalData();
        
        console.log('New user created, going to onboarding');
        router.replace('/onboarding-profile');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Only allow digits and limit to 10
    const cleaned = text.replace(/\D/g, '');
    return cleaned.substring(0, 10);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Enter your mobile number</Text>
        <Text style={styles.subtitle}>
          We'll use this to save your health data securely
        </Text>

        {/* Phone Input Section */}
        <View style={styles.phoneInputContainer}>
          {/* Country Code Section */}
          <View style={styles.countrySection}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
          </View>

          {/* Phone Number Input */}
          <TextInput
            style={styles.phoneInput}
            placeholder="Mobile number"
            placeholderTextColor="#666"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              phoneNumber.length !== 10 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={phoneNumber.length !== 10 || isLoading}
          >
            <Text style={styles.continueIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Helper Text */}
        <Text style={styles.helperText}>
          {phoneNumber.length}/10 digits
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#333',
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  flag: {
    fontSize: 24,
    marginRight: 8,
  },
  countryCode: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  continueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});

