import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/phone-entry');
  };

  return (
    <View style={styles.container}>
      {/* Logo Section - Center */}
      <View style={styles.centerSection}>
        {/* J-shaped Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.jShape}>
            <View style={styles.jTop} />
            <View style={styles.jVertical} />
            <View style={styles.jCurve} />
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Jeevan</Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Tagline */}
        <Text style={styles.tagline}>Your health companion</Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  jShape: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  jTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  jVertical: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 16,
    height: 85,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  jCurve: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 48,
    backgroundColor: '#7c3aed',
    borderRadius: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 16,
  },
  bottomSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  tagline: {
    color: '#888',
    fontSize: 18,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

