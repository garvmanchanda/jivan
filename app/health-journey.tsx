import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getActiveIssues, getInsights, getEventMemory } from '../services/ai';
import { ActiveIssue, Insight, EventMemory } from '../types';

export default function HealthJourney() {
  const router = useRouter();
  const { profileId, profileName } = useLocalSearchParams<{ profileId: string; profileName: string }>();

  const [activeIssues, setActiveIssues] = useState<ActiveIssue[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'issues' | 'insights' | 'timeline'>('issues');

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
      Alert.alert('Error', 'Failed to load health journey data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#FF6B6B';
      case 'improving': return '#4ECDC4';
      case 'monitoring': return '#FFE66D';
      case 'resolved': return '#95E1D3';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return '🔴';
      case 'moderate': return '🟡';
      case 'mild': return '🟢';
      default: return '⚪️';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderIssues = () => (
    <View style={styles.section}>
      {activeIssues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyText}>No active health issues</Text>
          <Text style={styles.emptySubtext}>You're doing great!</Text>
        </View>
      ) : (
        activeIssues.map((issue) => (
          <View key={issue.id} style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <View style={styles.issueTitle}>
                <Text style={styles.severityIcon}>{getSeverityIcon(issue.severity)}</Text>
                <Text style={styles.issueLabel}>{issue.label}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                <Text style={styles.statusText}>{issue.status}</Text>
              </View>
            </View>

            <View style={styles.issueDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First reported:</Text>
                <Text style={styles.detailValue}>{formatDate(issue.firstReportedAt)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last mentioned:</Text>
                <Text style={styles.detailValue}>{formatDate(issue.lastMentionedAt)}</Text>
              </View>
              {issue.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{issue.notes}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.section}>
      {insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyText}>No insights yet</Text>
          <Text style={styles.emptySubtext}>Keep tracking your health to discover patterns</Text>
        </View>
      ) : (
        insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>💡</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(insight.confidence * 100)}% confident
                </Text>
              </View>
            </View>
            <Text style={styles.insightText}>{insight.insight}</Text>
            <Text style={styles.insightDate}>Discovered {formatDate(insight.createdAt)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.section}>
      {recentEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>Your health timeline will appear here</Text>
        </View>
      ) : (
        recentEvents.map((event) => (
          <View key={event.id} style={styles.timelineCard}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineType}>{event.eventType}</Text>
              <Text style={styles.timelineDescription}>{event.description}</Text>
              <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Health Journey</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your health journey...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Health Journey</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Name */}
      {profileName && (
        <View style={styles.profileBanner}>
          <Text style={styles.profileName}>{profileName}'s Journey</Text>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'issues' && styles.activeTab]}
          onPress={() => setSelectedTab('issues')}
        >
          <Text style={[styles.tabText, selectedTab === 'issues' && styles.activeTabText]}>
            Issues ({activeIssues.filter(i => i.status !== 'resolved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'insights' && styles.activeTab]}
          onPress={() => setSelectedTab('insights')}
        >
          <Text style={[styles.tabText, selectedTab === 'insights' && styles.activeTabText]}>
            Insights ({insights.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'timeline' && styles.activeTab]}
          onPress={() => setSelectedTab('timeline')}
        >
          <Text style={[styles.tabText, selectedTab === 'timeline' && styles.activeTabText]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    fontSize: 32,
    color: '#4A90E2',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  profileBanner: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4A90E2',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  issueLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  issueDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 24,
  },
  confidenceBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#856404',
  },
  insightText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 8,
  },
  insightDate: {
    fontSize: 12,
    color: '#999',
  },
  timelineCard: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
  },
});

