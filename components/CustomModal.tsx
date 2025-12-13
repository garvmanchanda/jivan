import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, borderRadius, typography, spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  button.style === 'cancel' && styles.alertButtonCancel,
                  button.style === 'destructive' && styles.alertButtonDestructive,
                  buttons.length === 1 && styles.alertButtonFull,
                ]}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.alertButtonText,
                    button.style === 'cancel' && styles.alertButtonTextCancel,
                    button.style === 'destructive' && styles.alertButtonTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface SuccessToastProps {
  visible: boolean;
  message: string;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <View style={styles.toastContainer}>
      <View style={styles.toast}>
        <Text style={styles.toastIcon}>✓</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.primary,
    fontSize: typography.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  content: {
    padding: spacing.xxl,
  },
  // Alert Modal Styles
  alertContainer: {
    width: width - 64,
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xxl,
  },
  alertTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  alertMessage: {
    color: colors.textSecondary,
    fontSize: typography.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  alertButtonCancel: {
    backgroundColor: colors.backgroundTertiary,
  },
  alertButtonDestructive: {
    backgroundColor: colors.accentRed,
  },
  alertButtonFull: {
    flex: 1,
  },
  alertButtonText: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  alertButtonTextCancel: {
    color: colors.textSecondary,
  },
  alertButtonTextDestructive: {
    color: colors.textPrimary,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  toastIcon: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  toastMessage: {
    color: colors.textPrimary,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
});

