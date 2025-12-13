import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getUserByPhone, createUser, getProfiles, setCurrentUserId, setActiveProfileId } from '../services/supabaseStorage';
import { clearOldLocalData } from '../services/migrateToSupabase';
import { AlertModal } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleContinue = async () => {
    if (phoneNumber.length !== 10) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      showAlert('Invalid Number', 'Phone number should contain only digits');
      return;
    }

    setIsLoading(true);

    try {
      const existingUser = await getUserByPhone(phoneNumber);
      
      if (existingUser) {
        console.log('Returning user found:', existingUser.id);
        await setCurrentUserId(existingUser.id);
        await clearOldLocalData();
        
        const profiles = await getProfiles(existingUser.id);
        
        if (profiles.length > 0) {
          await setActiveProfileId(profiles[0].id);
          console.log('User has profiles, auto-selected first profile, going to home');
          router.replace('/home');
        } else {
          console.log('User has no profiles, going to onboarding');
          router.replace('/onboarding-profile');
        }
      } else {
        console.log('New user, creating account');
        const newUser = await createUser(phoneNumber);
        await setCurrentUserId(newUser.id);
        await clearOldLocalData();
        
        console.log('New user created, going to onboarding');
        router.replace('/onboarding-profile');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      showAlert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.substring(0, 10);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDotActive} />
        <View style={styles.progressDot} />
      </View>

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
            placeholderTextColor={colors.textMuted}
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
            activeOpacity={0.8}
          >
            <Text style={styles.continueIcon}>{isLoading ? '...' : '→'}</Text>
          </TouchableOpacity>
        </View>

        {/* Helper Text */}
        <Text style={styles.helperText}>
          {phoneNumber.length}/10 digits
        </Text>
      </View>

      <AlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: 'OK', onPress: () => setAlertVisible(false) }]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.xl,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: typography.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 70,
  },
  progressDotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.backgroundTertiary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.base,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  flag: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  countryCode: {
    color: colors.textMuted,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  phoneInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontWeight: typography.medium,
  },
  continueButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  continueButtonDisabled: {
    backgroundColor: colors.backgroundTertiary,
    shadowOpacity: 0,
  },
  continueIcon: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: typography.bold,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
