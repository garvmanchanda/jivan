import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { transcribeAudio, getAIResponseV2 } from '../services/ai';
import { getActiveProfileId, getProfiles, saveConversation } from '../services/supabaseStorage';
import { Conversation } from '../types';
import { AlertModal } from '../components/CustomModal';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

const SILENCE_THRESHOLD = -45;
const SILENCE_DURATION_MS = 2000;
const MIN_RECORDING_MS = 1000;

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'transcribing' | 'analyzing' | 'done'>('transcribing');
  const [transcript, setTranscript] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] as any[] });
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const waveAnim3 = useRef(new Animated.Value(1)).current;
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(waveAnim2, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(waveAnim3, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isRecording]);

  const showAlert = (title: string, message: string, buttons: any[]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Please grant microphone permission to record audio.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartRef.current = Date.now();
      silenceStartRef.current = null;

      meteringIntervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            const level = status.metering;

            const now = Date.now();
            const recordingDuration = now - (recordingStartRef.current || now);

            if (recordingDuration > MIN_RECORDING_MS) {
              if (level < SILENCE_THRESHOLD) {
                if (silenceStartRef.current === null) {
                  silenceStartRef.current = now;
                } else if (now - silenceStartRef.current > SILENCE_DURATION_MS) {
                  stopRecordingRef.current?.();
                }
              } else {
                silenceStartRef.current = null;
              }
            }
          }
        } catch (e) {}
      }, 100);
    } catch (err) {
      console.error('Failed to start recording', err);
      router.back();
    }
  };

  const stopRecordingRef = useRef<(() => void) | null>(null);

  const stopRecording = async () => {
    if (!recording) return;

    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);
    setProcessingStage('transcribing');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        showAlert('Recording Failed', 'Unable to save your recording. Please try again.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      let transcribedText: string;
      try {
        transcribedText = await transcribeAudio(uri);
        setTranscript(transcribedText);
      } catch (transcribeError: any) {
        showAlert('Transcription Failed', transcribeError.message || 'Unable to transcribe your voice.', [
          { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
          { text: 'Retry', onPress: startRecording }
        ]);
        setIsProcessing(false);
        return;
      }

      const activeProfileId = await getActiveProfileId();
      const profiles = await getProfiles();
      const activeProfile = profiles.find(p => p.id === activeProfileId);

      setProcessingStage('analyzing');

      const aiResponse = await getAIResponseV2(
        transcribedText,
        activeProfileId!,
        { 
          name: activeProfile?.name,
          age: activeProfile?.age || 30 
        }
      );

      setProcessingStage('done');

      const conversation: Conversation = {
        id: Date.now().toString(),
        profileId: activeProfileId!,
        query: transcribedText,
        summary: `${aiResponse.reflection}\n\n${aiResponse.interpretation}`,
        recommendations: aiResponse.recommendations,
        redFlag: aiResponse.redFlags.join('\n\n'),
        timestamp: new Date().toISOString(),
      };
      await saveConversation(conversation);

      router.replace({
        pathname: '/response',
        params: {
          conversationId: conversation.id,
          query: transcribedText,
          summary: `${aiResponse.reflection}\n\n${aiResponse.interpretation}`,
          recommendations: JSON.stringify(aiResponse.recommendations),
          redFlag: aiResponse.redFlags.join('\n\n'),
        },
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      showAlert('Processing Error', 'An unexpected error occurred. Please try again later.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  });

  return (
    <View style={styles.container}>
      {/* Back Button - Purple like mic */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.centerSection}>
        {isProcessing ? (
          <ScrollView
            style={styles.processingContainer}
            contentContainerStyle={styles.processingContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.processingIcon}>
              <Text style={styles.processingEmoji}>
                {processingStage === 'transcribing' ? '🎧' : processingStage === 'analyzing' ? '🧠' : '✅'}
              </Text>
            </View>

            <Text style={styles.processingTitle}>
              {processingStage === 'transcribing'
                ? 'Transcribing...'
                : processingStage === 'analyzing'
                ? 'Analyzing...'
                : 'Done!'}
            </Text>

            {transcript && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>YOU SAID</Text>
                <Text style={styles.transcript}>"{transcript}"</Text>
              </View>
            )}

            {streamingContent && processingStage === 'analyzing' && (
              <View style={styles.streamingBox}>
                <Text style={styles.streamingText} numberOfLines={8}>
                  {streamingContent.substring(0, 300)}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.recordingView}>
            {/* Animated Waves */}
            <Animated.View style={[styles.wave, styles.wave3, { transform: [{ scale: waveAnim3 }], opacity: waveAnim3.interpolate({ inputRange: [1, 1.4], outputRange: [0.1, 0] }) }]} />
            <Animated.View style={[styles.wave, styles.wave2, { transform: [{ scale: waveAnim2 }], opacity: waveAnim2.interpolate({ inputRange: [1, 1.3], outputRange: [0.15, 0] }) }]} />
            <Animated.View style={[styles.wave, styles.wave1, { transform: [{ scale: waveAnim1 }], opacity: waveAnim1.interpolate({ inputRange: [1, 1.2], outputRange: [0.2, 0] }) }]} />
            
            {/* Recording Circle */}
            <Animated.View style={[styles.recordingCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.micIcon}>🎤</Text>
            </Animated.View>

            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}
      </View>

      {!isProcessing && (
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
          <Text style={styles.stopHint}>Stop</Text>
        </View>
      )}

      <AlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons.length > 0 ? alertConfig.buttons : [
          { text: 'OK', onPress: () => setAlertVisible(false) }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.xl,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 22,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  recordingView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  wave1: {
    width: 200,
    height: 200,
  },
  wave2: {
    width: 260,
    height: 260,
  },
  wave3: {
    width: 320,
    height: 320,
  },
  recordingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 50,
  },
  listeningText: {
    color: colors.textSecondary,
    fontSize: typography.lg,
    marginTop: spacing.xxl,
  },
  processingContainer: {
    flex: 1,
    width: '100%',
  },
  processingContent: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  processingEmoji: {
    fontSize: 36,
  },
  processingTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.medium,
    marginBottom: spacing.xxxl,
  },
  transcriptBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  transcriptLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  transcript: {
    fontSize: typography.md,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  streamingBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  streamingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.accentRed,
    borderRadius: 3,
  },
  stopHint: {
    color: colors.textMuted,
    fontSize: typography.xs,
    marginTop: spacing.sm,
  },
});
