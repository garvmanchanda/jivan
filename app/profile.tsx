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
const CARD_SIZE = (width - 60) / 2;

export default function ProfileScreen() {
  const router = useRouter();
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const loadedProfiles = await getProfiles();
    const currentProfile = loadedProfiles.find(p => p.id === profileId);
    setProfile(currentProfile || null);

    const profileVitals = await getVitals(profileId);
    setVitals(profileVitals);

    const profileConversations = await getConversations(profileId);
    setConversations(profileConversations.slice(0, 10));
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

  const dailyVitals = [
    { type: 'steps', label: 'Steps', unit: 'steps', isDaily: true, icon: '👟' },
    { type: 'sleep', label: 'Sleep', unit: 'hrs', isDaily: true, icon: '😴' },
    { type: 'water', label: 'Hydration', unit: 'L', isDaily: true, icon: '💧' },
    { type: 'alcohol', label: 'Alcohol', unit: 'drinks', isDaily: true, icon: '🍺' },
    { type: 'cigarettes', label: 'Smoke', unit: 'count', isDaily: true, icon: '🚬' },
  ];

  const getTodayVital = (type: string) => {
    const today = new Date().toDateString();
    const filtered = vitals.filter(v => v.type === type && new Date(v.date).toDateString() === today);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Today's Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tracking</Text>
            <TouchableOpacity onPress={() => router.push('/tracking-history')}>
              <Text style={styles.viewHistoryLink}>View History →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trackingGrid}>
            {dailyVitals.map((vital) => {
              const vitalData = getTodayVital(vital.type);
              return (
                <TouchableOpacity
                  key={vital.type}
                  style={styles.trackingCard}
                  onPress={() => handleEditVital(vital.type, vital.label, vital.unit, true, vitalData?.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.trackingCardHeader}>
                    <Text style={styles.trackingIcon}>{vital.icon}</Text>
                    <View style={styles.addButton}>
                      <Text style={styles.addButtonText}>+</Text>
                    </View>
                  </View>
                  <Text style={styles.trackingValue}>
                    {vitalData ? `${vitalData.value}${vital.unit === 'L' ? ' L' : vital.unit === 'hrs' ? 'h' : ''}` : '--'}
                  </Text>
                  <Text style={styles.trackingLabel}>{vital.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Your Health Journey */}
        <View style={styles.section}>
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
                  Track your active issues, insights and health patterns over time.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.viewInsightsButton}
              onPress={() => router.push({
                pathname: '/health-journey',
                params: { profileId: profile.id, profileName: profile.name },
              })}
            >
              <Text style={styles.viewInsightsText}>View Insights</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Section 3: Recent Conversations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start by tapping the mic on home</Text>
            </View>
          ) : (
            conversations.map((conv) => (
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
            ))
          )}
        </View>

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
    marginBottom: spacing.lg,
  },
  viewHistoryLink: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  trackingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  trackingCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-between',
  },
  trackingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trackingIcon: {
    fontSize: 28,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  trackingValue: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
  },
  trackingLabel: {
    color: colors.textMuted,
    fontSize: typography.sm,
  },
  healthJourneyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  healthJourneyContent: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  healthJourneyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  healthJourneyIcon: {
    fontSize: 24,
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
  viewInsightsButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewInsightsText: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
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
