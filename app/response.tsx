import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getConversations, getActiveProfileId } from '../services/supabaseStorage';
import { Conversation } from '../types';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

export default function ResponseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (params.query && params.summary) {
      const directConversation: Conversation = {
        id: params.conversationId as string,
        profileId: '',
        query: params.query as string,
        summary: params.summary as string,
        recommendations: params.recommendations
          ? JSON.parse(params.recommendations as string)
          : [],
        redFlag: params.redFlag as string || '',
        timestamp: new Date().toISOString(),
      };
      setConversation(directConversation);
    } else {
      loadConversation();
    }
  }, []);

  const loadConversation = async () => {
    const profileId = await getActiveProfileId();
    if (!profileId) return;

    const conversations = await getConversations(profileId);
    const found = conversations.find(c => c.id === params.conversationId);
    setConversation(found || null);
  };

  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Insight</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Query Section */}
        <View style={styles.queryCard}>
          <View style={styles.queryHeader}>
            <View style={styles.queryIconContainer}>
              <Text style={styles.queryIcon}>💭</Text>
            </View>
            <Text style={styles.queryLabel}>YOUR QUESTION</Text>
          </View>
          <Text style={styles.queryText}>{conversation.query}</Text>
        </View>

        {/* Response Section */}
        <View style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <View style={styles.responseIconContainer}>
              <Text style={styles.responseIcon}>🌟</Text>
            </View>
            <Text style={styles.responseLabel}>INSIGHT</Text>
          </View>
          
          <Text style={styles.summaryText}>{conversation.summary}</Text>

          {conversation.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>Key Points</Text>
              {conversation.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet}>
                    <Text style={styles.recommendationBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Next Steps */}
        {conversation.redFlag && (
          <View style={styles.nextStepsCard}>
            <View style={styles.nextStepsHeader}>
              <Text style={styles.nextStepsIcon}>💙</Text>
              <Text style={styles.nextStepsTitle}>Next Steps</Text>
            </View>
            <Text style={styles.nextStepsText}>{conversation.redFlag}</Text>
          </View>
        )}

        {/* Minimal Text CTAs */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            onPress={() => router.push('/record')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionLink}>Ask another question →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionLinkSecondary}>Back to home</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
  queryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  queryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  queryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  queryIcon: {
    fontSize: 16,
  },
  queryLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 1,
  },
  queryText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    lineHeight: 26,
  },
  responseCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  responseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  responseIcon: {
    fontSize: 18,
  },
  responseLabel: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 1,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: typography.md,
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  recommendationsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.xl,
  },
  recommendationsTitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  recommendationBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  recommendationBulletText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  recommendationText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    lineHeight: 24,
    flex: 1,
  },
  nextStepsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBlue,
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextStepsIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  nextStepsTitle: {
    color: colors.accentBlue,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  nextStepsText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    lineHeight: 24,
  },
  actionsSection: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  actionLink: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  actionLinkSecondary: {
    color: colors.textMuted,
    fontSize: typography.sm,
  },
});
