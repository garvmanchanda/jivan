import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { LLMResponse, SuggestedAction } from '../types';

interface ResponseCardProps {
  response: LLMResponse;
  onActionPress?: (action: SuggestedAction) => void;
}

export function ResponseCard({ response, onActionPress }: ResponseCardProps) {
  const urgencyColors: Record<string, string> = {
    low: colors.urgencyLow,
    medium: colors.urgencyMedium,
    high: colors.urgencyHigh,
    emergency: colors.urgencyEmergency,
  };

  const getActionIcon = (actionType: string): keyof typeof Ionicons.glyphMap => {
    switch (actionType) {
      case 'track_symptom':
        return 'pulse';
      case 'schedule_appointment':
        return 'calendar';
      case 'set_reminder':
        return 'alarm';
      case 'log_medication':
        return 'medical';
      case 'start_habit':
        return 'fitness';
      case 'call_provider':
        return 'call';
      case 'call_emergency':
        return 'warning';
      case 'view_info':
        return 'information-circle';
      default:
        return 'chevron-forward';
    }
  };

  return (
    <View style={styles.container}>
      {/* Urgency Badge */}
      <View style={styles.header}>
        <View style={[
          styles.urgencyBadge,
          { backgroundColor: urgencyColors[response.urgency_level] }
        ]}>
          <Text style={styles.urgencyText}>
            {response.urgency_level.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.intentBadge}>{response.intent.replace('_', ' ')}</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{response.summary}</Text>

      {/* Recommendations */}
      {response.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {response.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="bulb" size={16} color={colors.warning} />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDescription}>
                  {rec.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Follow-up Questions */}
      {response.follow_up_questions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I'd like to know</Text>
          {response.follow_up_questions.map((question, index) => (
            <View key={index} style={styles.questionItem}>
              <Ionicons
                name="help-circle"
                size={18}
                color={colors.info}
              />
              <Text style={styles.questionText}>{question}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggested Actions */}
      {response.suggested_actions.length > 0 && (
        <View style={styles.actionsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScroll}
          >
            {response.suggested_actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => onActionPress?.(action)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getActionIcon(action.action_type)}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Disclaimer */}
      {response.disclaimer && (
        <Text style={styles.disclaimer}>{response.disclaimer}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  urgencyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  intentBadge: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  summary: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  recommendationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 201, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  recommendationDescription: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  questionText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  actionsSection: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.base,
  },
  actionsScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  disclaimer: {
    marginTop: spacing.lg,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: typography.size.xs * typography.lineHeight.relaxed,
  },
});

