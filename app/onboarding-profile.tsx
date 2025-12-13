import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveProfile, setActiveProfileId, saveVital } from '../services/supabaseStorage';
import { Profile } from '../types';
import { AlertModal } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleProceed = async () => {
    if (!name.trim()) {
      showAlert('Missing Information', 'Please enter your name');
      return;
    }

    if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 150) {
      showAlert('Invalid Age', 'Please enter a valid age (1-150)');
      return;
    }

    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      showAlert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    if (height && (isNaN(Number(height)) || Number(height) <= 0)) {
      showAlert('Invalid Height', 'Please enter a valid height');
      return;
    }

    setIsLoading(true);

    try {
      const userProfile: Profile = {
        id: '',
        name: name.trim(),
        age: Number(age),
        relation: 'Self',
      };

      await saveProfile(userProfile);
      await setActiveProfileId(userProfile.id);

      if (weight) {
        await saveVital(userProfile.id, {
          type: 'weight',
          value: Number(weight),
          unit: 'kg',
          date: new Date().toISOString(),
          isDaily: false,
        });
      }

      if (height) {
        await saveVital(userProfile.id, {
          type: 'height',
          value: Number(height),
          unit: 'cm',
          date: new Date().toISOString(),
          isDaily: false,
        });
      }

      await saveVital(userProfile.id, {
        type: 'age',
        value: Number(age),
        unit: 'years',
        date: new Date().toISOString(),
        isDaily: false,
      });

      router.replace('/home');
    } catch (error) {
      console.error('Failed to create profile:', error);
      showAlert('Error', 'Failed to create profile. Please try again.');
      setIsLoading(false);
    }
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
        <View style={styles.progressDotActive} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Let's get to know you</Text>
          <Text style={styles.subtitle}>
            We use this to personalize your health insights.
          </Text>
        </View>

        {/* Avatar Section */}
        <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View style={styles.cameraButton}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
          <Text style={styles.uploadText}>UPLOAD PHOTO</Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>What should we call you?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="E.g. Alex Doe"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.inputIcon}>👤</Text>
            </View>
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Age</Text>
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.inputSmall]}>
                <TextInput
                  style={styles.input}
                  placeholder="28"
                  placeholderTextColor={colors.textMuted}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.unitText}>years</Text>
            </View>
          </View>

          {/* Weight and Height Row */}
          <View style={styles.twoColumnRow}>
            {/* Weight */}
            <View style={styles.halfField}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.inputSmall]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.unitText}>kg</Text>
              </View>
            </View>

            {/* Height */}
            <View style={styles.halfField}>
              <Text style={styles.label}>Height</Text>
              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.inputSmall]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.unitText}>cm</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Create Profile Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleProceed}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          🔒 Your data is private and stored locally
        </Text>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.base,
    lineHeight: 22,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  avatarIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 14,
  },
  uploadText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  form: {
    marginBottom: spacing.xxl,
  },
  fieldGroup: {
    marginBottom: spacing.xxl,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
  },
  inputSmall: {
    flex: 0,
    width: 80,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingVertical: spacing.lg,
  },
  inputIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  unitText: {
    color: colors.textMuted,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  halfField: {
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.button,
  },
  createButtonDisabled: {
    backgroundColor: colors.backgroundTertiary,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  arrowIcon: {
    color: colors.textPrimary,
    fontSize: typography.lg,
  },
  privacyNote: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
