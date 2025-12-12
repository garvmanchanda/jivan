import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { transcribeAudio, getAIResponse } from '../services/ai';
import { getActiveProfileId, getProfiles, saveConversation } from '../services/supabaseStorage';
import { Conversation } from '../types';

// Silence detection config
const SILENCE_THRESHOLD = -45; // dB level considered silence
const SILENCE_DURATION_MS = 2000; // 2 seconds of silence to auto-stop
const MIN_RECORDING_MS = 1000; // Minimum recording duration before auto-stop

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'transcribing' | 'analyzing' | 'done'>('transcribing');
  const [transcript, setTranscript] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const dotAnim = useRef(new Animated.Value(0)).current;
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
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isRecording]);

  // Animated dots for "analyzing" stage
  useEffect(() => {
    if (processingStage === 'analyzing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 2, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 3, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [processingStage]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Please grant microphone permission');
        router.back();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use recording options with metering enabled
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      recordingStartRef.current = Date.now();
      silenceStartRef.current = null;

      // Start metering for silence detection
      meteringIntervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            const level = status.metering;
            setAudioLevel(level);

            const now = Date.now();
            const recordingDuration = now - (recordingStartRef.current || now);

            // Only check for silence after minimum recording time
            if (recordingDuration > MIN_RECORDING_MS) {
              if (level < SILENCE_THRESHOLD) {
                // Start silence timer if not already started
                if (silenceStartRef.current === null) {
                  silenceStartRef.current = now;
                } else if (now - silenceStartRef.current > SILENCE_DURATION_MS) {
                  // Auto-stop after silence duration
                  console.log('Auto-stopping due to silence detection');
                  stopRecordingRef.current?.();
                }
              } else {
                // Reset silence timer on sound
                silenceStartRef.current = null;
              }
            }
          }
        } catch (e) {
          // Ignore metering errors
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start recording', err);
      router.back();
    }
  };

  // Use ref for stopRecording to avoid stale closure in metering interval
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const stopRecording = async () => {
    if (!recording) return;

    // Clear metering interval
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
        Alert.alert(
          'Recording Failed',
          'Unable to save your recording. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      console.log('Recording saved, starting transcription...');

      // Transcribe audio with retry logic
      let transcribedText: string;
      try {
        transcribedText = await transcribeAudio(uri);
        setTranscript(transcribedText);
        console.log('Transcription complete:', transcribedText);
      } catch (transcribeError: any) {
        console.error('Transcription error:', transcribeError);
        Alert.alert(
          'Transcription Failed',
          transcribeError.message || 'Unable to transcribe your voice. Please try again.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Retry', onPress: stopRecording }
          ]
        );
        setIsProcessing(false);
        return;
      }

      // Get profile context
      const activeProfileId = await getActiveProfileId();
      const profiles = await getProfiles();
      const activeProfile = profiles.find(p => p.id === activeProfileId);

      console.log('Getting AI analysis with streaming...');
      setProcessingStage('analyzing');

      // Get AI response with streaming for perceived speed
      const aiResponse = await getAIResponse(
        transcribedText,
        { age: activeProfile?.age || 30 },
        // Streaming callback - update UI as response comes in
        (partialContent: string) => {
          setStreamingContent(partialContent);
        }
      );

      console.log('AI analysis complete');
      setProcessingStage('done');

      // Save conversation
      const conversation: Conversation = {
        id: Date.now().toString(),
        profileId: activeProfileId!,
        query: transcribedText,
        summary: aiResponse.summary,
        recommendations: aiResponse.recommendations,
        redFlag: aiResponse.redFlags.join('\n\n'),
        timestamp: new Date().toISOString(),
      };
      await saveConversation(conversation);

      // Navigate to response screen with data directly
      router.replace({
        pathname: '/response',
        params: {
          conversationId: conversation.id,
          query: transcribedText,
          summary: aiResponse.summary,
          recommendations: JSON.stringify(aiResponse.recommendations),
          redFlag: aiResponse.redFlags.join('\n\n'),
        },
      });

    } catch (error: any) {
      console.error('Unexpected error:', error);
      Alert.alert(
        'Processing Error',
        'An unexpected error occurred. Your recording was saved, but we couldn\'t process it. Please try again later.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
      setIsProcessing(false);
    }
  };

  // Assign stopRecording to ref for use in metering interval
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
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
            <Text style={styles.statusText}>
              {processingStage === 'transcribing'
                ? 'Transcribing...'
                : processingStage === 'analyzing'
                ? 'Analyzing...'
                : 'Done!'}
            </Text>

            {transcript && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcript}>"{transcript}"</Text>
              </View>
            )}

            {streamingContent && processingStage === 'analyzing' && (
              <View style={styles.streamingBox}>
                <Text style={styles.streamingLabel}>Jeevan is thinking...</Text>
                <Text style={styles.streamingText} numberOfLines={8}>
                  {streamingContent.substring(0, 300)}
                  {streamingContent.length > 300 ? '...' : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <>
            <Animated.View
              style={[
                styles.recordingCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.innerCircle}>
                <Text style={styles.micIcon}>🎤</Text>
              </View>
            </Animated.View>
            <Text style={styles.statusText}>Listening...</Text>
          </>
        )}
      </View>

      {!isProcessing && (
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        </View>
      )}
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
  },
  backText: {
    color: '#7c3aed',
    fontSize: 16,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  processingContainer: {
    flex: 1,
    width: '100%',
  },
  processingContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  recordingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#5b21b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 60,
  },
  processingIcon: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingEmoji: {
    fontSize: 60,
  },
  statusText: {
    marginTop: 16,
    fontSize: 20,
    color: '#7c3aed',
    fontWeight: '600',
  },
  transcriptBox: {
    marginTop: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcript: {
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  streamingBox: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  streamingLabel: {
    fontSize: 12,
    color: '#7c3aed',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streamingText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});

