import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ProfileScroller } from '../../components/ProfileScroller';
import { MicButton } from '../../components/MicButton';
import { TranscriptionModal } from '../../components/TranscriptionModal';
import { ResponseCard } from '../../components/ResponseCard';
import { useProfileStore } from '../../store/profileStore';
import { useAuthStore } from '../../store/authStore';
import { uploadAudio, sendConversation } from '../../services/api';
import { analytics } from '../../services/analytics';
import { colors, typography, spacing } from '../../theme';
import type { LLMResponse } from '../../types';

export function HomeScreen() {
  const { user } = useAuthStore();
  const { profiles, activeProfileId, fetchProfiles, activeProfile } = useProfileStore();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<LLMResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profiles on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [fetchProfiles])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const handleRecordingComplete = async (uri: string, duration: number) => {
    setAudioUri(uri);
    analytics.trackRecordingCompleted(activeProfileId || '', duration);
    
    // Show transcription modal for editing
    setShowTranscriptionModal(true);
    setTranscript('Processing audio...');
    
    // Upload and transcribe
    try {
      if (!user?.id || !activeProfileId) {
        throw new Error('No user or profile selected');
      }
      
      const audioUrl = await uploadAudio(uri, user.id);
      
      // Get transcription by calling the API (it will use Whisper)
      const response = await sendConversation(activeProfileId, audioUrl);
      
      if (response.success && response.transcript) {
        setTranscript(response.transcript);
        setLastResponse(response.llm_response || null);
        setShowTranscriptionModal(false);
      } else {
        setTranscript('Could not transcribe audio. Please type your question.');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setTranscript('Could not transcribe audio. Please type your question.');
    }
  };

  const handleTranscriptSubmit = async (editedTranscript: string) => {
    setShowTranscriptionModal(false);
    setIsProcessing(true);
    
    try {
      if (!activeProfileId) {
        throw new Error('No profile selected');
      }
      
      const response = await sendConversation(activeProfileId, undefined, editedTranscript);
      
      if (response.success && response.llm_response) {
        setLastResponse(response.llm_response);
      }
    } catch (error) {
      console.error('Conversation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentProfile = activeProfile();
  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>
            How can I help you today?
          </Text>
        </View>

        {/* Profile Scroller */}
        <ProfileScroller />

        {/* Current Profile Info */}
        {currentProfile && (
          <View style={styles.activeProfileCard}>
            <Text style={styles.activeProfileLabel}>Speaking for:</Text>
            <Text style={styles.activeProfileName}>{currentProfile.name}</Text>
            {currentProfile.relationship !== 'self' && (
              <Text style={styles.activeProfileRelation}>
                ({currentProfile.relationship})
              </Text>
            )}
          </View>
        )}

        {/* Last Response */}
        {lastResponse && (
          <ResponseCard response={lastResponse} />
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <Text style={styles.processingText}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Mic Button - Fixed at bottom */}
      <View style={styles.micContainer}>
        <MicButton
          onRecordingStart={() => {
            setIsRecording(true);
            analytics.trackStartRecording(activeProfileId || '');
          }}
          onRecordingComplete={handleRecordingComplete}
          onRecordingCancel={() => setIsRecording(false)}
          disabled={!activeProfileId || isProcessing}
        />
        <Text style={styles.micHint}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to ask a question'}
        </Text>
      </View>

      {/* Transcription Modal */}
      <TranscriptionModal
        visible={showTranscriptionModal}
        transcript={transcript}
        onSubmit={handleTranscriptSubmit}
        onCancel={() => setShowTranscriptionModal(false)}
      />
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 200, // Space for mic button
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activeProfileCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeProfileLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  activeProfileName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  activeProfileRelation: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  processingCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
  },
  processingText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  micContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  micHint: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});

