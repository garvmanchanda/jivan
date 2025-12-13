import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getVitals,
} from '../services/supabaseStorage';
import { Profile, Vital } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfile] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [greeting, setGreeting] = useState('Good morning');
  const micScale = useRef(new Animated.Value(1)).current;
  const micGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    loadProfiles();
    updateGreeting();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfiles();
    }, [])
  );

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  };

  const loadProfiles = async () => {
    const loadedProfiles = await getProfiles();
    setProfiles(loadedProfiles);
    
    if (loadedProfiles.length > 0) {
      const active = await getActiveProfileId();
      const activeExists = active && loadedProfiles.some(p => p.id === active);
      
      if (!active || !activeExists) {
        const firstProfileId = loadedProfiles[0].id;
        setActiveProfile(firstProfileId);
        await setActiveProfileId(firstProfileId);
        loadVitalsData(firstProfileId);
      } else {
        setActiveProfile(active);
        loadVitalsData(active);
      }
    }
  };

  const loadVitalsData = async (profileId: string) => {
    const profileVitals = await getVitals(profileId);
    setVitals(profileVitals);
  };

  const handleProfileSelect = async (profileId: string) => {
    setActiveProfile(profileId);
    await setActiveProfileId(profileId);
    loadVitalsData(profileId);
  };

  const handleMicPressIn = () => {
    Animated.parallel([
      Animated.spring(micScale, {
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.timing(micGlow, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMicPressOut = () => {
    Animated.parallel([
      Animated.spring(micScale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(micGlow, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMicPress = () => {
    if (!activeProfileId) return;
    router.push('/record');
  };

  const handleProfilePress = () => {
    if (!activeProfileId) return;
    router.push('/profile');
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  // Get latest vitals
  const getLatestVital = (type: string) => {
    const filtered = vitals.filter(v => v.type === type);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  const weightVital = getLatestVital('weight');
  const heightVital = getLatestVital('height');

  return (
    <View style={styles.container}>
      {/* Header with Profile Selector */}
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroll}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profilePill,
                activeProfileId === profile.id && styles.profilePillActive,
              ]}
              onPress={() => handleProfileSelect(profile.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.profileText,
                  activeProfileId === profile.id && styles.profileTextActive,
                ]}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.addProfileButton}
            onPress={() => router.push('/add-profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.addProfileIcon}>+</Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar & Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {activeProfile?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.greetingText}>{greeting}, {activeProfile?.name || 'there'}</Text>
          <Text style={styles.subGreetingText}>Let's check your progress</Text>
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
            <Text style={styles.statValue}>{activeProfile?.age || '--'}</Text>
            <Text style={styles.statUnit}>yrs</Text>
            <Text style={styles.statLabel}>AGE</Text>
          </View>
        </View>

        {/* Health Journey Card */}
        <TouchableOpacity
          style={styles.healthJourneyCard}
          onPress={() => router.push({
            pathname: '/health-journey',
            params: { profileId: activeProfileId, profileName: activeProfile?.name },
          })}
          activeOpacity={0.85}
        >
          <View style={styles.healthJourneyContent}>
            <View style={styles.healthJourneyIcon}>
              <Text style={styles.healthJourneyEmoji}>🌟</Text>
            </View>
            <View style={styles.healthJourneyText}>
              <Text style={styles.healthJourneyTitle}>Your Health Journey</Text>
              <Text style={styles.healthJourneySubtitle}>
                3 new insights available based on your recent activity patterns.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewTimelineButton} activeOpacity={0.8}>
            <Text style={styles.viewTimelineText}>View Timeline</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Mic Button Section */}
        <View style={styles.micSection}>
          <Animated.View style={[styles.micGlow, { opacity: micGlow }]} />
          <TouchableOpacity
            onPressIn={handleMicPressIn}
            onPressOut={handleMicPressOut}
            onPress={handleMicPress}
            activeOpacity={1}
          >
            <Animated.View style={[styles.micButton, { transform: [{ scale: micScale }] }]}>
              <Text style={styles.micIcon}>🎤</Text>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.micTitle}>How can I help?</Text>
          <Text style={styles.micSubtitle}>Tap to speak</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Text style={styles.navIcon}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Text style={styles.navIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Profile & Insights Floating Button */}
      <TouchableOpacity 
        style={styles.profileInsightsButton}
        onPress={handleProfilePress}
        activeOpacity={0.85}
      >
        <Text style={styles.profileInsightsIcon}>✨</Text>
        <Text style={styles.profileInsightsText}>Profile & Insights</Text>
      </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  profileScroll: {
    flex: 1,
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
  profileText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  profileTextActive: {
    color: colors.textPrimary,
  },
  addProfileButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addProfileIcon: {
    color: colors.textSecondary,
    fontSize: typography.xl,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 180,
  },
  greetingSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarBadgeIcon: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: typography.bold,
  },
  greetingText: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  subGreetingText: {
    color: colors.textSecondary,
    fontSize: typography.base,
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
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  healthJourneyIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  healthJourneyEmoji: {
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
  micSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  micGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  micIcon: {
    fontSize: 50,
  },
  micTitle: {
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    marginTop: spacing.xxl,
  },
  micSubtitle: {
    color: colors.textMuted,
    fontSize: typography.base,
    marginTop: spacing.sm,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  navIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  profileInsightsButton: {
    position: 'absolute',
    bottom: 100,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  profileInsightsIcon: {
    fontSize: 14,
  },
  profileInsightsText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
