import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/phone-entry');
  };

  const handleLogin = () => {
    router.push('/phone-entry');
  };

  return (
    <View style={styles.container}>
      {/* Abstract Purple Blob Background */}
      <View style={styles.blobContainer}>
        <View style={styles.blobOuter}>
          <View style={styles.blobInner}>
            <View style={styles.blobCore} />
          </View>
        </View>
        {/* Glow effect */}
        <View style={styles.glowEffect} />
      </View>

      {/* Logo & Brand Section */}
      <View style={styles.brandSection}>
        <Text style={styles.appName}>Jeevan</Text>
        <Text style={styles.tagline}>
          Your journey to holistic wellness{'\n'}starts here. Track, understand, and{'\n'}thrive.
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
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
  blobContainer: {
    position: 'absolute',
    top: height * 0.08,
    left: 0,
    right: 0,
    alignItems: 'center',
    height: height * 0.4,
  },
  blobOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleX: 1.2 }, { rotate: '-15deg' }],
  },
  blobInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleY: 1.3 }],
  },
  blobCore: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    transform: [{ rotate: '30deg' }, { scaleX: 1.4 }],
    ...shadows.glow,
  },
  glowEffect: {
    position: 'absolute',
    top: 40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
    elevation: 0,
  },
  brandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.35,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: typography.bold,
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: typography.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xxxl,
  },
  bottomSection: {
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 60,
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.button,
  },
  getStartedText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  arrowIcon: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  loginText: {
    color: colors.textMuted,
    fontSize: typography.base,
    marginTop: spacing.xl,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
});
