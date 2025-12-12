import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface TranscriptionModalProps {
  visible: boolean;
  transcript: string;
  onSubmit: (editedTranscript: string) => void;
  onCancel: () => void;
}

export function TranscriptionModal({
  visible,
  transcript,
  onSubmit,
  onCancel,
}: TranscriptionModalProps) {
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const isProcessing = transcript === 'Processing audio...';

  useEffect(() => {
    setEditedTranscript(transcript);
  }, [transcript]);

  const handleSubmit = () => {
    if (editedTranscript.trim()) {
      onSubmit(editedTranscript.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onCancel}
        />
        
        <View style={styles.content}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isProcessing ? 'Processing...' : 'Review Transcript'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Transcript Input */}
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <View style={styles.processingDot} />
              <Text style={styles.processingText}>
                Transcribing your audio...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.hint}>
                Edit the transcript below if needed, then submit to get a response.
              </Text>
              
              <TextInput
                style={styles.textInput}
                value={editedTranscript}
                onChangeText={setEditedTranscript}
                multiline
                placeholder="Type or edit your question..."
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
                autoFocus
              />
            </>
          )}

          {/* Actions */}
          {!isProcessing && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !editedTranscript.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!editedTranscript.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    maxHeight: '80%',
    ...shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    fontSize: typography.size.base,
    color: colors.textPrimary,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  processingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  processingText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
});

