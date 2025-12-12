import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={[
        styles.iconContainer,
        danger && styles.iconContainerDanger
      ]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={danger ? colors.error : colors.primary} 
        />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={[
          styles.settingsItemTitle,
          danger && styles.settingsItemTitleDanger
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.textMuted} 
      />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { user, signOut, isLoading } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleNotImplemented = (feature: string) => {
    Alert.alert(
      'Coming Soon',
      `${feature} will be available in a future update.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountEmail}>{user?.email}</Text>
                <Text style={styles.accountId}>ID: {user?.id.slice(0, 8)}...</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profiles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Profiles</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="people-outline"
              title="Manage Profiles"
              subtitle="Add or edit family members"
              onPress={() => handleNotImplemented('Profile management')}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="medical-outline"
              title="Medical Information"
              subtitle="Update conditions, allergies, medications"
              onPress={() => handleNotImplemented('Medical information')}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage reminders and alerts"
              onPress={() => handleNotImplemented('Notifications')}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => handleNotImplemented('Language settings')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={() => handleNotImplemented('Help')}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="chatbox-outline"
              title="Send Feedback"
              onPress={() => handleNotImplemented('Feedback')}
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => handleNotImplemented('Privacy Policy')}
            />
          </View>
        </View>

        {/* Sign Out Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingsItem
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <Text style={styles.version}>
          Jivan v1.0.0 (Build 1)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  accountDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  accountEmail: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  accountId: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(252, 129, 129, 0.1)',
  },
  settingsItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingsItemTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  settingsItemTitleDanger: {
    color: colors.error,
  },
  settingsItemSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.base + 36 + spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.size.xs,
    color: colors.textMuted,
    paddingVertical: spacing['2xl'],
  },
});

