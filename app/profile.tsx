import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getVitals,
  saveVital,
  getConversations,
  deleteProfile,
  updateProfileAge,
} from '../services/supabaseStorage';
import { Profile, Vital, Conversation } from '../types';
import { CustomModal, AlertModal } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [editingVital, setEditingVital] = useState<{
    type: string;
    label: string;
    unit: string;
    isDaily: boolean;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    loadProfileData();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  };

  const loadProfileData = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const loadedProfiles = await getProfiles();
    setProfiles(loadedProfiles);

    const currentProfile = loadedProfiles.find(p => p.id === profileId);
    setProfile(currentProfile || null);

    const profileVitals = await getVitals(profileId);
    setVitals(profileVitals);

    const profileConversations = await getConversations(profileId);
    setConversations(profileConversations.slice(0, 10));
  };

  const handleProfileSelect = async (profileId: string) => {
    await setActiveProfileId(profileId);
    loadProfileData();
  };

  const handleEditVital = (type: string, label: string, unit: string, isDaily: boolean, currentValue?: number) => {
    setEditingVital({ type, label, unit, isDaily });
    setEditValue(currentValue ? currentValue.toString() : '');
    setEditModalVisible(true);
  };

  const handleSaveVital = async () => {
    if (!profile || !editingVital || !editValue) return;

    const value = parseFloat(editValue);
    if (isNaN(value)) return;

    const newVital: Vital = {
      type: editingVital.type as any,
      value,
      unit: editingVital.unit,
      date: new Date().toISOString(),
      isDaily: editingVital.isDaily,
    };

    await saveVital(profile.id, newVital);
    
    if (editingVital.type === 'age') {
      await updateProfileAge(profile.id, Math.floor(value));
    }
    
    setEditModalVisible(false);
    setEditValue('');
    setEditingVital(null);
    loadProfileData();
  };

  const handleDeleteProfile = async () => {
    if (!profile) return;
    try {
      await deleteProfile(profile.id);
      router.back();
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
    setDeleteAlertVisible(false);
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const vitalTypes = [
    { type: 'weight', label: 'Weight', unit: 'kg', isDaily: false },
    { type: 'height', label: 'Height', unit: 'cm', isDaily: false },
    { type: 'age', label: 'Age', unit: 'years', isDaily: false },
  ];

  const dailyVitals = [
    { type: 'steps', label: 'Steps', unit: 'steps', isDaily: true, icon: '👟', color: colors.accentGreen },
    { type: 'sleep', label: 'Sleep', unit: 'hrs', isDaily: true, icon: '😴', color: colors.primaryLight },
    { type: 'water', label: 'Hydration', unit: 'L', isDaily: true, icon: '💧', color: colors.accentBlue },
    { type: 'alcohol', label: 'Alcohol', unit: 'drinks', isDaily: true, icon: '🍺', color: colors.accentYellow },
    { type: 'cigarettes', label: 'Smoke', unit: 'count', isDaily: true, icon: '🚬', color: colors.accentRed },
  ];

  const getLatestVital = (type: string) => {
    const filtered = vitals.filter(v => v.type === type);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  const getTodayVital = (type: string) => {
    const today = new Date().toDateString();
    const filtered = vitals.filter(v => v.type === type && new Date(v.date).toDateString() === today);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  const weightVital = getLatestVital('weight');
  const heightVital = getLatestVital('height');
  const stepsVital = getTodayVital('steps');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Insights</Text>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => setDeleteAlertVisible(true)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.profileScroll}
        contentContainerStyle={styles.profileScrollContent}
      >
        {profiles.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.profilePill,
              profile?.id === p.id && styles.profilePillActive,
            ]}
            onPress={() => handleProfileSelect(p.id)}
          >
            <Text
              style={[
                styles.profilePillText,
                profile?.id === p.id && styles.profilePillTextActive,
              ]}
            >
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar & Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.greetingText}>{greeting}, {profile.name}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weightVital?.value || '--'}</Text>
            <Text style={styles.statUnit}>kg</Text>
            <Text style={styles.statLabel}>WEIGHT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{heightVital?.value || '--'}</Text>
            <Text style={styles.statUnit}>cm</Text>
            <Text style={styles.statLabel}>HEIGHT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.age || '--'}</Text>
            <Text style={styles.statUnit}>yrs</Text>
            <Text style={styles.statLabel}>AGE</Text>
          </View>
        </View>

        {/* Health Journey Card */}
        <TouchableOpacity
          style={styles.healthJourneyCard}
          onPress={() => router.push({
            pathname: '/health-journey',
            params: { profileId: profile.id, profileName: profile.name },
          })}
          activeOpacity={0.85}
        >
          <View style={styles.healthJourneyContent}>
            <View style={styles.healthJourneyIconContainer}>
              <Text style={styles.healthJourneyIcon}>🌟</Text>
            </View>
            <View style={styles.healthJourneyText}>
              <Text style={styles.healthJourneyTitle}>Your Health Journey</Text>
              <Text style={styles.healthJourneySubtitle}>
                3 new insights available based on your recent activity patterns.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewTimelineButton}>
            <Text style={styles.viewTimelineText}>View Timeline</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Today's Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tracking</Text>
            <TouchableOpacity onPress={() => router.push('/tracking-history')}>
              <Text style={styles.editGoalsLink}>Edit Goals</Text>
            </TouchableOpacity>
          </View>

          {/* Steps - Featured */}
          <TouchableOpacity 
            style={styles.stepsCard}
            onPress={() => handleEditVital('steps', 'Steps', 'steps', true, stepsVital?.value)}
            activeOpacity={0.8}
          >
            <View style={styles.stepsContent}>
              <Text style={styles.stepsIcon}>👟</Text>
              <Text style={styles.stepsLabel}>Steps</Text>
            </View>
            <View style={styles.stepsValueContainer}>
              <Text style={styles.stepsValue}>{stepsVital?.value?.toLocaleString() || '0'}</Text>
              <View style={styles.stepsProgress}>
                <View style={[styles.stepsProgressFill, { width: `${Math.min((stepsVital?.value || 0) / 100, 100)}%` }]} />
              </View>
              <Text style={styles.stepsGoal}>Goal: 10,000</Text>
            </View>
            <TouchableOpacity style={styles.addStepsButton}>
              <Text style={styles.addStepsIcon}>+</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Other Daily Vitals Grid */}
          <View style={styles.dailyVitalsGrid}>
            {dailyVitals.filter(v => v.type !== 'steps').map((vital) => {
              const vitalData = getTodayVital(vital.type);
              return (
                <TouchableOpacity
                  key={vital.type}
                  style={styles.dailyVitalCard}
                  onPress={() => handleEditVital(vital.type, vital.label, vital.unit, true, vitalData?.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dailyVitalHeader}>
                    <Text style={styles.dailyVitalIcon}>{vital.icon}</Text>
                    <TouchableOpacity style={styles.dailyVitalAddButton}>
                      <Text style={styles.dailyVitalAddIcon}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.dailyVitalValue}>
                    {vitalData ? `${vitalData.value}${vital.unit === 'L' ? ' L' : vital.unit === 'hrs' ? 'h' : ''}` : '--'}
                  </Text>
                  <Text style={styles.dailyVitalLabel}>{vital.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            {conversations.slice(0, 3).map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.conversationItem}
                onPress={() => router.push({
                  pathname: '/response',
                  params: { conversationId: conv.id },
                })}
                activeOpacity={0.8}
              >
                <View style={styles.conversationDot} />
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationText} numberOfLines={2}>
                    {conv.query}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {new Date(conv.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.conversationArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <CustomModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title={editingVital ? `Edit ${editingVital.label}` : 'Edit'}
        subtitle={`Enter value in ${editingVital?.unit}`}
      >
        <TextInput
          style={styles.modalInput}
          placeholder="Enter value"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={editValue}
          onChangeText={setEditValue}
          autoFocus
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonCancel]}
            onPress={() => setEditModalVisible(false)}
          >
            <Text style={styles.modalButtonTextCancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonSave]}
            onPress={handleSaveVital}
          >
            <Text style={styles.modalButtonTextSave}>Save</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>

      {/* Delete Alert */}
      <AlertModal
        visible={deleteAlertVisible}
        title="Delete Profile"
        message={`Are you sure you want to delete ${profile.name}'s profile? You will not be able to recover this data.`}
        buttons={[
          { text: 'Cancel', onPress: () => setDeleteAlertVisible(false), style: 'cancel' },
          { text: 'Delete', onPress: handleDeleteProfile, style: 'destructive' },
        ]}
      />
    </View>
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
  },
  backButton: {
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
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
  profileScroll: {
    maxHeight: 50,
    marginBottom: spacing.lg,
  },
  profileScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  profilePill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    marginRight: spacing.sm,
  },
  profilePillActive: {
    backgroundColor: colors.primary,
  },
  profilePillText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  profilePillTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.lg,
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  editAvatarIcon: {
    fontSize: 12,
  },
  greetingText: {
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
  },
  statUnit: {
    color: colors.textMuted,
    fontSize: typography.xs,
    marginTop: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.medium,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.lg,
  },
  healthJourneyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  healthJourneyContent: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  healthJourneyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  healthJourneyIcon: {
    fontSize: 22,
  },
  healthJourneyText: {
    flex: 1,
  },
  healthJourneyTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    marginBottom: spacing.xs,
  },
  healthJourneySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    lineHeight: 20,
  },
  viewTimelineButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewTimelineText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  editGoalsLink: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  stepsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stepsContent: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  stepsIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  stepsLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  stepsValueContainer: {
    flex: 1,
  },
  stepsValue: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  stepsProgress: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  stepsProgressFill: {
    height: '100%',
    backgroundColor: colors.accentGreen,
    borderRadius: 3,
  },
  stepsGoal: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  addStepsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStepsIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: typography.medium,
  },
  dailyVitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dailyVitalCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dailyVitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dailyVitalIcon: {
    fontSize: 20,
  },
  dailyVitalAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyVitalAddIcon: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  dailyVitalValue: {
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  dailyVitalLabel: {
    color: colors.textMuted,
    fontSize: typography.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  conversationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    marginBottom: spacing.xs,
  },
  conversationTime: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  conversationArrow: {
    color: colors.textMuted,
    fontSize: typography.lg,
  },
  modalInput: {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: typography.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.backgroundTertiary,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  modalButtonTextSave: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
