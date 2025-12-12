import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from '../store/profileStore';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { FamilyMember } from '../types';

interface ProfileAvatarProps {
  profile: FamilyMember;
  isActive: boolean;
  onPress: () => void;
}

function ProfileAvatar({ profile, isActive, onPress }: ProfileAvatarProps) {
  const getRelationshipIcon = (relationship: string): keyof typeof Ionicons.glyphMap => {
    switch (relationship) {
      case 'self':
        return 'person';
      case 'spouse':
        return 'heart';
      case 'child':
        return 'happy';
      case 'parent':
        return 'people';
      default:
        return 'person-outline';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity
      style={[styles.profileItem, isActive && styles.profileItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, isActive && styles.avatarActive]}>
        <Text style={[styles.avatarText, isActive && styles.avatarTextActive]}>
          {getInitials(profile.name)}
        </Text>
        {isActive && (
          <View style={styles.activeIndicator} />
        )}
      </View>
      <Text
        style={[styles.profileName, isActive && styles.profileNameActive]}
        numberOfLines={1}
      >
        {profile.name}
      </Text>
      <View style={styles.relationshipBadge}>
        <Ionicons
          name={getRelationshipIcon(profile.relationship)}
          size={10}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

interface AddProfileButtonProps {
  onPress: () => void;
}

function AddProfileButton({ onPress }: AddProfileButtonProps) {
  return (
    <TouchableOpacity
      style={styles.addProfileButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.addAvatar}>
        <Ionicons name="add" size={24} color={colors.primary} />
      </View>
      <Text style={styles.addText}>Add</Text>
    </TouchableOpacity>
  );
}

export function ProfileScroller() {
  const { profiles, activeProfileId, setActiveProfile } = useProfileStore();

  const handleAddProfile = () => {
    // TODO: Navigate to add profile screen
    console.log('Add profile pressed');
  };

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No profiles yet</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleAddProfile}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.createButtonText}>Create a profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Family Profiles</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {profiles.map((profile) => (
          <ProfileAvatar
            key={profile.id}
            profile={profile}
            isActive={profile.id === activeProfileId}
            onPress={() => setActiveProfile(profile.id)}
          />
        ))}
        <AddProfileButton onPress={handleAddProfile} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  profileItem: {
    alignItems: 'center',
    width: 72,
  },
  profileItemActive: {
    // Active state styling is on children
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  avatarTextActive: {
    color: colors.textPrimary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileName: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  profileNameActive: {
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
  },
  relationshipBadge: {
    marginTop: 2,
  },
  addProfileButton: {
    alignItems: 'center',
    width: 72,
  },
  addAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addText: {
    marginTop: spacing.xs,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textMuted,
  },
  emptyContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
});

