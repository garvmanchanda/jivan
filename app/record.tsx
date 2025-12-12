import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { transcribeAudio, getAIResponse } from '../services/ai';
import { getActiveProfileId, getProfiles, saveConversation } from '../services/supabaseStorage';
import { Conversation } from '../types';

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    startRecording();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
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

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      router.back();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);

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

      console.log('Getting AI analysis...');

      // Get AI response with retry logic and fallback
      const aiResponse = await getAIResponse(transcribedText, {
        age: activeProfile?.age || 30,
      });

      console.log('AI analysis complete');

      // Save conversation (even if using fallback response)
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

      // Navigate to response screen with data directly (faster than re-fetching)
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.centerSection}>
        {isProcessing ? (
          <>
            <View style={styles.processingIcon}>
              <Text style={styles.processingText}>⏳</Text>
            </View>
            <Text style={styles.statusText}>Analyzing...</Text>
            {transcript && <Text style={styles.transcript}>{transcript}</Text>}
          </>
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
    paddingHorizontal: 40,
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
  processingText: {
    fontSize: 80,
  },
  statusText: {
    marginTop: 24,
    fontSize: 20,
    color: '#7c3aed',
    fontWeight: '600',
  },
  transcript: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
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

