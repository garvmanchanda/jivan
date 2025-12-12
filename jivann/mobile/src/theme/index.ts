// Jivan Theme - Deep navy with warm coral accents
// Inspired by calm, trustworthy healthcare aesthetics

export const colors = {
  // Primary palette
  primary: '#FF6B5B',        // Warm coral - action, warmth
  primaryDark: '#E55A4A',    // Darker coral for pressed states
  primaryLight: '#FF8A7D',   // Lighter coral for highlights
  
  // Background colors
  background: '#0A1628',     // Deep navy - calm, professional
  backgroundLight: '#0F1F36', // Slightly lighter for cards
  backgroundElevated: '#152742', // For elevated surfaces
  
  // Surface colors
  surface: '#1A2F4A',        // Card backgrounds
  surfaceHover: '#213A5A',   // Card hover/pressed
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  textInverse: '#0A1628',
  
  // Accent colors
  success: '#48BB78',        // Green for positive states
  warning: '#ECC94B',        // Yellow for warnings
  error: '#FC8181',          // Red for errors
  info: '#63B3ED',           // Blue for informational
  
  // Urgency colors
  urgencyLow: '#48BB78',
  urgencyMedium: '#ECC94B',
  urgencyHigh: '#F6AD55',
  urgencyEmergency: '#FC8181',
  
  // Border colors
  border: '#2D3748',
  borderLight: '#4A5568',
  
  // Overlay
  overlay: 'rgba(10, 22, 40, 0.8)',
} as const;

export const typography = {
  // Font families - Using system fonts with Avenir Next for iOS
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

