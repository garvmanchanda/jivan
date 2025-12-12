import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from '../../store/profileStore';
import { getConversations } from '../../services/api';
import { colors, typography, spacing, borderRadius } from '../../theme';
import type { Conversation, LLMResponse } from '../../types';

export function ChatScreen() {
  const { activeProfileId, activeProfile, profiles } = useProfileStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!activeProfileId) return;
    
    setIsLoading(true);
    try {
      const data = await getConversations(activeProfileId);
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfileId]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const currentProfile = activeProfile();

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const response = item.llm_response as LLMResponse;
    const date = new Date(item.created_at);
    
    return (
      <TouchableOpacity style={styles.conversationCard}>
        <View style={styles.conversationHeader}>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: getUrgencyColor(response.urgency_level) }
          ]}>
            <Text style={styles.urgencyText}>{response.urgency_level}</Text>
          </View>
          <Text style={styles.timestamp}>
            {formatDate(date)}
          </Text>
        </View>
        
        <Text style={styles.transcript} numberOfLines={2}>
          {item.transcript}
        </Text>
        
        <Text style={styles.summary} numberOfLines={3}>
          {response.summary}
        </Text>
        
        {response.recommendations.length > 0 && (
          <View style={styles.recommendationsPreview}>
            <Ionicons 
              name="bulb-outline" 
              size={14} 
              color={colors.primary} 
            />
            <Text style={styles.recommendationsCount}>
              {response.recommendations.length} recommendation{response.recommendations.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="chatbubbles-outline" 
        size={64} 
        color={colors.textMuted} 
      />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation from the Home screen by tapping the microphone
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Conversation History</Text>
        {currentProfile && (
          <Text style={styles.profileName}>
            {currentProfile.name}'s conversations
          </Text>
        )}
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function getUrgencyColor(level: string): string {
  switch (level) {
    case 'low':
      return colors.urgencyLow;
    case 'medium':
      return colors.urgencyMedium;
    case 'high':
      return colors.urgencyHigh;
    case 'emergency':
      return colors.urgencyEmergency;
    default:
      return colors.textMuted;
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  }
  
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  
  if (diffHours < 48) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  profileName: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  conversationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  urgencyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  transcript: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  recommendationsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  recommendationsCount: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: typography.size.base * typography.lineHeight.relaxed,
  },
});

