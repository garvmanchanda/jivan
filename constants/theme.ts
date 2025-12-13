// Design System Constants based on the new UI design

export const colors = {
  // Background colors
  background: '#0A0A0F',
  backgroundSecondary: '#12121A',
  backgroundTertiary: '#1A1A24',
  card: '#16161F',
  cardBorder: '#2A2A35',
  
  // Primary colors
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  primaryGlow: 'rgba(139, 92, 246, 0.3)',
  
  // Accent colors
  accent: '#6366F1',
  accentBlue: '#60A5FA',
  accentGreen: '#34D399',
  accentYellow: '#FBBF24',
  accentRed: '#F87171',
  accentPink: '#F472B6',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textDisabled: '#52525B',
  
  // Status colors
  statusActive: '#EF4444',
  statusImproving: '#22C55E',
  statusMonitoring: '#EAB308',
  statusResolved: '#10B981',
  
  // Severity colors
  severityMild: '#22C55E',
  severityModerate: '#EAB308',
  severitySevere: '#EF4444',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 42,
  
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const shadows = {
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

