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
import { AlertModal, SuccessToast } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

export default function AddProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [showSuccess, setShowSuccess] = useState(false);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Missing Information', 'Please enter a name');
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
      const newProfile: Profile = {
        id: '',
        name: name.trim(),
        age: Number(age),
        relation: 'Family',
      };

      await saveProfile(newProfile);
      await setActiveProfileId(newProfile.id);

      if (weight) {
        await saveVital(newProfile.id, {
          type: 'weight',
          value: Number(weight),
          unit: 'kg',
          date: new Date().toISOString(),
          isDaily: false,
        });
      }

      if (height) {
        await saveVital(newProfile.id, {
          type: 'height',
          value: Number(height),
          unit: 'cm',
          date: new Date().toISOString(),
          isDaily: false,
        });
      }

      await saveVital(newProfile.id, {
        type: 'age',
        value: Number(age),
        unit: 'years',
        date: new Date().toISOString(),
        isDaily: false,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.avatarHint}>Add family member</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Age *</Text>
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.inputSmall]}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.unitText}>years</Text>
            </View>
          </View>

          {/* Weight and Height */}
          <View style={styles.twoColumnRow}>
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

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Creating...' : 'Create Profile'}
          </Text>
          {!isLoading && <Text style={styles.arrowIcon}>→</Text>}
        </TouchableOpacity>

        <Text style={styles.note}>
          * Required fields. You can update other details later.
        </Text>
      </ScrollView>

      <AlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: 'OK', onPress: () => setAlertVisible(false) }]}
      />

      <SuccessToast visible={showSuccess} message="Profile created successfully!" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xxl,
  },
  avatarSection: {
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
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  avatarIcon: {
    fontSize: 40,
    opacity: 0.5,
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: typography.sm,
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
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
  },
  inputSmall: {
    width: 100,
  },
  input: {
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingVertical: spacing.lg,
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.button,
  },
  saveButtonDisabled: {
    backgroundColor: colors.backgroundTertiary,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  arrowIcon: {
    color: colors.textPrimary,
    fontSize: typography.lg,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
