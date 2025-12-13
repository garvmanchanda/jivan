import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getActiveIssues, getInsights, getEventMemory } from '../services/ai';
import { ActiveIssue, Insight, EventMemory } from '../types';
import { createClient } from '@supabase/supabase-js';

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
      await loadHealthJourneyData(); // Reload data
      
      Alert.alert('Success', `Issue marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating issue:', error);
      Alert.alert('Error', 'Failed to update issue status');
    }
  };

  const openStatusModal = (issue: ActiveIssue) => {
    setSelectedIssue(issue);
    setStatusModalVisible(true);
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
              
              <TouchableOpacity 
                style={styles.updateStatusButton}
                onPress={() => openStatusModal(issue)}
              >
                <Text style={styles.updateStatusText}>Update Status</Text>
              </TouchableOpacity>
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

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Issue Status</Text>
            <Text style={styles.modalSubtitle}>
              {selectedIssue?.label}
            </Text>

            <TouchableOpacity
              style={[styles.statusOption, selectedIssue?.status === 'active' && styles.statusOptionActive]}
              onPress={() => handleUpdateIssueStatus('active')}
            >
              <Text style={styles.statusOptionIcon}>🔴</Text>
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>Active</Text>
                <Text style={styles.statusOptionDesc}>Issue is ongoing</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, selectedIssue?.status === 'improving' && styles.statusOptionActive]}
              onPress={() => handleUpdateIssueStatus('improving')}
            >
              <Text style={styles.statusOptionIcon}>🟢</Text>
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>Improving</Text>
                <Text style={styles.statusOptionDesc}>Getting better</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, selectedIssue?.status === 'monitoring' && styles.statusOptionActive]}
              onPress={() => handleUpdateIssueStatus('monitoring')}
            >
              <Text style={styles.statusOptionIcon}>🟡</Text>
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>Monitoring</Text>
                <Text style={styles.statusOptionDesc}>Watching closely</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, selectedIssue?.status === 'resolved' && styles.statusOptionActive]}
              onPress={() => handleUpdateIssueStatus('resolved')}
            >
              <Text style={styles.statusOptionIcon}>✅</Text>
              <View style={styles.statusOptionText}>
                <Text style={styles.statusOptionTitle}>Resolved</Text>
                <Text style={styles.statusOptionDesc}>Issue is resolved</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  backButton: {
    fontSize: 32,
    color: '#7c3aed',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileBanner: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7c3aed',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#7c3aed',
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
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  issueCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
    color: '#fff',
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
    borderTopColor: '#2a2a2a',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  notesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  updateStatusButton: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
  },
  insightText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 8,
  },
  insightDate: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#7c3aed',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timelineType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#7c3aed',
    fontSize: 16,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  statusOptionActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#1a1a2e',
  },
  statusOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
  },
  statusOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusOptionDesc: {
    color: '#666',
    fontSize: 13,
  },
  modalCancelButton: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
});

