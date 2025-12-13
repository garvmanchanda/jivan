import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getActiveIssues, getInsights, getEventMemory } from '../services/ai';
import { ActiveIssue, Insight, EventMemory } from '../types';
import { createClient } from '@supabase/supabase-js';
import { CustomModal, AlertModal } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gzmfehoyqyjydegwgbjz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function HealthJourney() {
  const router = useRouter();
  const { profileId, profileName } = useLocalSearchParams<{ profileId: string; profileName: string }>();

  const [activeIssues, setActiveIssues] = useState<ActiveIssue[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'issues' | 'insights' | 'timeline'>('issues');
  const [selectedIssue, setSelectedIssue] = useState<ActiveIssue | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    loadHealthJourneyData();
  }, [profileId]);

  const loadHealthJourneyData = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      const [issuesData, insightsData, eventsData] = await Promise.all([
        getActiveIssues(profileId),
        getInsights(profileId),
        getEventMemory(profileId, 10)
      ]);

      setActiveIssues(issuesData);
      setInsights(insightsData);
      setRecentEvents(eventsData);
    } catch (error) {
      console.error('Error loading health journey:', error);
      setAlertConfig({ title: 'Error', message: 'Failed to load health journey data' });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.statusActive;
      case 'improving': return colors.statusImproving;
      case 'monitoring': return colors.statusMonitoring;
      case 'resolved': return colors.statusResolved;
      default: return colors.textMuted;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe': return { label: 'SEVERE', color: colors.severitySevere };
      case 'moderate': return { label: 'MODERATE', color: colors.severityModerate };
      case 'mild': return { label: 'MILD', color: colors.severityMild };
      default: return { label: 'UNKNOWN', color: colors.textMuted };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleUpdateIssueStatus = async (newStatus: string) => {
    if (!selectedIssue) return;

    try {
      const { error } = await supabase
        .from('active_issues')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedIssue.id);

      if (error) throw error;

      setStatusModalVisible(false);
      setSelectedIssue(null);
      await loadHealthJourneyData();
      
      setAlertConfig({ title: 'Success', message: `Issue marked as ${newStatus}` });
      setAlertVisible(true);
    } catch (error) {
      console.error('Error updating issue:', error);
      setAlertConfig({ title: 'Error', message: 'Failed to update issue status' });
      setAlertVisible(true);
    }
  };

  const openStatusModal = (issue: ActiveIssue) => {
    setSelectedIssue(issue);
    setStatusModalVisible(true);
  };

  const renderIssues = () => (
    <View style={styles.tabContent}>
      {activeIssues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>No active health issues</Text>
          <Text style={styles.emptySubtitle}>You're doing great! Keep it up.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>ACTIVE ISSUES</Text>
          {activeIssues.map((issue) => {
            const severity = getSeverityLabel(issue.severity);
            return (
              <TouchableOpacity 
                key={issue.id} 
                style={styles.issueCard}
                onPress={() => openStatusModal(issue)}
                activeOpacity={0.85}
              >
                <View style={styles.issueHeader}>
                  <View style={styles.issueIconContainer}>
                    <Text style={styles.issueIcon}>⚡</Text>
                  </View>
                  <View style={styles.issueTitleContainer}>
                    <Text style={styles.issueTitle}>{issue.label}</Text>
                    <Text style={styles.issueDate}>Last log: {formatDate(issue.lastMentionedAt)}</Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: `${severity.color}20` }]}>
                    <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.issueArrow}>
                  <Text style={styles.issueArrowText}>›</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.tabContent}>
      {insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptySubtitle}>Keep tracking your health to discover patterns</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>DAILY INSIGHTS</Text>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <Text style={styles.insightIcon}>💜</Text>
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Sleep Correlation Found</Text>
                <Text style={styles.insightText}>{insight.insight}</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAnalysisLink}>View Analysis →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.tabContent}>
      {recentEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Your health timeline will appear here</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          {recentEvents.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <View style={styles.timelineDot} />
                {index < recentEvents.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineType}>{event.eventType}</Text>
                <Text style={styles.timelineDescription}>{event.description}</Text>
                <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Journey</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your health journey...</Text>
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
        <View style={styles.headerCenter}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>👤</Text>
          </View>
          <Text style={styles.headerTitle}>Health Journey</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Banner */}
      {profileName && (
        <View style={styles.profileBanner}>
          <Text style={styles.profileBannerText}>Good Morning, {profileName}</Text>
          <Text style={styles.profileBannerSubtext}>Here is your daily health summary.</Text>
        </View>
      )}

      {/* Stability Score (Optional) */}
      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>STABILITY SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>85</Text>
            <Text style={styles.scorePercent}>%</Text>
            <View style={styles.scoreTrend}>
              <Text style={styles.scoreTrendText}>+2%</Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreProgress}>
          <View style={[styles.scoreProgressFill, { width: '85%' }]} />
        </View>
        <Text style={styles.scoreMessage}>You're doing well today. Keep maintaining your routine.</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'issues' && styles.tabActive]}
          onPress={() => setSelectedTab('issues')}
        >
          <Text style={[styles.tabText, selectedTab === 'issues' && styles.tabTextActive]}>
            Issues
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'insights' && styles.tabActive]}
          onPress={() => setSelectedTab('insights')}
        >
          <Text style={[styles.tabText, selectedTab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'timeline' && styles.tabActive]}
          onPress={() => setSelectedTab('timeline')}
        >
          <Text style={[styles.tabText, selectedTab === 'timeline' && styles.tabTextActive]}>
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'issues' && renderIssues()}
        {selectedTab === 'insights' && renderInsights()}
        {selectedTab === 'timeline' && renderTimeline()}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Status Update Modal */}
      <CustomModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        title="Update Status"
        subtitle={selectedIssue?.label}
      >
        <View style={styles.statusOptions}>
          {['active', 'improving', 'monitoring', 'resolved'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                selectedIssue?.status === status && styles.statusOptionActive,
              ]}
              onPress={() => handleUpdateIssueStatus(status)}
            >
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={styles.statusOptionText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStatusModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </CustomModal>

      <AlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: 'OK', onPress: () => setAlertVisible(false) }]}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerIcon: {
    fontSize: 14,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  profileBanner: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  profileBannerText: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  profileBannerSubtext: {
    color: colors.textSecondary,
    fontSize: typography.base,
  },
  scoreCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: typography.bold,
  },
  scorePercent: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.medium,
  },
  scoreTrend: {
    backgroundColor: colors.accentGreen + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  scoreTrendText: {
    color: colors.accentGreen,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  scoreProgress: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    backgroundColor: colors.accentGreen,
    borderRadius: 3,
  },
  scoreMessage: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    marginTop: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  tabContent: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.base,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  issueHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  issueIcon: {
    fontSize: 20,
  },
  issueTitleContainer: {
    flex: 1,
  },
  issueTitle: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    marginBottom: 2,
  },
  issueDate: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  severityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    letterSpacing: 0.5,
  },
  issueArrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueArrowText: {
    color: colors.textMuted,
    fontSize: 24,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  insightIcon: {
    fontSize: 18,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    marginBottom: spacing.xs,
  },
  insightText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  viewAnalysisLink: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.cardBorder,
    marginTop: spacing.sm,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timelineType: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  timelineDescription: {
    color: colors.textPrimary,
    fontSize: typography.base,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  timelineDate: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  statusOptions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statusOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  statusOptionText: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.medium,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
