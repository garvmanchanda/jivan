import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
} from '../services/supabaseStorage';
import { Profile } from '../types';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfile] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Good morning');
  const micScale = useRef(new Animated.Value(1)).current;
  const micBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfiles();
    updateGreeting();
    startBounceAnimation();
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

  // Continuous gentle bounce animation
  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micBounce, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(micBounce, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
      } else {
        setActiveProfile(active);
      }
    }
  };

  const handleProfileSelect = async (profileId: string) => {
    setActiveProfile(profileId);
    await setActiveProfileId(profileId);
  };

  const handleMicPressIn = () => {
    Animated.spring(micScale, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handleMicPressOut = () => {
    Animated.spring(micScale, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
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

  return (
    <View style={styles.container}>
      {/* Top Nav - Profile Selector */}
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
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Photo Circle Icon */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {activeProfile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        </View>

        {/* Greeting Text */}
        <Text style={styles.greetingText}>{greeting}, {activeProfile?.name || 'there'}</Text>

        {/* Mic Button Section - No shadow, with bounce */}
        <View style={styles.micSection}>
          <TouchableOpacity
            onPressIn={handleMicPressIn}
            onPressOut={handleMicPressOut}
            onPress={handleMicPress}
            activeOpacity={1}
          >
            <Animated.View 
              style={[
                styles.micButton, 
                { 
                  transform: [
                    { scale: micScale },
                    { translateY: micBounce }
                  ] 
                }
              ]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.micTitle}>Ready when you are</Text>
          <Text style={styles.micSubtitle}>Tap to speak</Text>
        </View>
      </View>

      {/* Profile & Insights CTA at Bottom Center */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.profileInsightsButton}
          onPress={handleProfilePress}
          activeOpacity={0.85}
        >
          <Text style={styles.profileInsightsIcon}>✨</Text>
          <Text style={styles.profileInsightsText}>Profile & Insights</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  profileScroll: {
    flexGrow: 0,
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
  },
  addProfileIcon: {
    color: colors.textSecondary,
    fontSize: typography.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.xl,
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
  greetingText: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.xxxl,
  },
  micSection: {
    alignItems: 'center',
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 50,
  },
  micTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    marginTop: spacing.xxl,
  },
  micSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sm,
    marginTop: spacing.xs,
  },
  bottomSection: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  profileInsightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  profileInsightsIcon: {
    fontSize: 16,
  },
  profileInsightsText: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
