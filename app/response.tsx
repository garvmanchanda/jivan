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

export default function ResponseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    // Check if data was passed directly (faster path)
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
      // Fallback: load from database (for viewing old conversations)
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Query Display */}
        <View style={styles.querySection}>
          <Text style={styles.label}>You asked</Text>
          <Text style={styles.queryText}>{conversation.query}</Text>
        </View>

        {/* Response Card */}
        <View style={styles.responseCard}>
          <Text style={styles.summaryText}>{conversation.summary}</Text>

          {conversation.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              {conversation.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Next Steps - Caring Guidance */}
        {conversation.redFlag && (
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>💙 Next Steps</Text>
            <Text style={styles.nextStepsText}>{conversation.redFlag}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backText: {
    color: '#7c3aed',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  querySection: {
    marginBottom: 24,
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  queryText: {
    color: '#fff',
    fontSize: 18,
  },
  responseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  recommendationsSection: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    color: '#7c3aed',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  nextStepsCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#60a5fa',
  },
  nextStepsTitle: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nextStepsText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
  },
});

