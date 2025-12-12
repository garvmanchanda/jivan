import { Worker, Job } from 'bullmq';
import { ConversationModel } from '../models/Conversation';
import { ProfileModel } from '../models/Profile';
import { VitalModel } from '../models/Vital';
import { storageService } from '../services/storage.service';
import { ASRProviderFactory } from '../services/asr/ASRProviderFactory';
import { OpenAIGPTProvider } from '../services/llm/OpenAIGPTProvider';
import { PromptManager } from '../services/llm/PromptManager';
import { SafetyValidator } from '../services/llm/SafetyValidator';
import { ConversationStatus } from '../../../shared/types/conversation.types';
import { logger } from '../utils/logger';
import { LLM_CONFIG } from '../config/providers';

interface ConversationJobData {
  conversationId: string;
}

// Initialize services
const asrProvider = ASRProviderFactory.getDefaultProvider();
const llmProvider = new OpenAIGPTProvider();
const promptManager = new PromptManager();

/**
 * Process conversation job
 */
async function processConversation(job: Job<ConversationJobData>) {
  const { conversationId } = job.data;

  logger.info('Processing conversation job', {
    conversationId,
    jobId: job.id,
  });

  try {
    // Update status to processing
    await ConversationModel.updateStatus(conversationId, ConversationStatus.PROCESSING);

    // Step 1: Get conversation
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Step 2: Get transcript (either from text input or ASR)
    let transcript = conversation.transcript;

    if (conversation.input_type === 'voice' && conversation.audio_s3_key) {
      logger.debug('Transcribing audio', { conversationId });

      // Download audio from S3
      const audioBuffer = await storageService.downloadFile(
        conversation.audio_s3_key
      );

      // Transcribe using ASR
      const asrResult = await asrProvider.transcribe(audioBuffer);
      transcript = asrResult.transcript;

      // Update conversation with transcript
      await ConversationModel.updateTranscript(
        conversationId,
        transcript,
        asrProvider.name
      );

      logger.info('Audio transcribed successfully', {
        conversationId,
        transcriptLength: transcript.length,
      });
    }

    if (!transcript) {
      throw new Error('No transcript available');
    }

    // Step 3: Get context (profile, vitals, recent conversations)
    const profile = await ProfileModel.findById(conversation.profile_id);
    const vitals = profile ? await VitalModel.getSummary(profile.id) : [];
    const recentConversations = await ConversationModel.getRecentForContext(
      conversation.profile_id,
      3
    );

    logger.debug('Context gathered', {
      conversationId,
      hasProfile: !!profile,
      vitalsCount: vitals.length,
      recentConversationsCount: recentConversations.length,
    });

    // Step 4: Build prompt
    const messages = promptManager.buildPrompt(
      transcript,
      profile || undefined,
      recentConversations,
      vitals
    );

    logger.debug('Prompt built', {
      conversationId,
      messageCount: messages.length,
    });

    // Step 5: Get LLM response
    const llmResponse = await llmProvider.completeJSONWithRetry(messages);

    logger.debug('LLM response received', {
      conversationId,
      hasResponse: !!llmResponse,
    });

    // Step 6: Validate response schema
    if (!promptManager.validateResponse(llmResponse)) {
      throw new Error('Invalid response schema from LLM');
    }

    // Step 7: Safety validation
    const safetyCheck = SafetyValidator.validate(llmResponse, transcript);

    logger.info('Safety validation completed', {
      conversationId,
      isSafe: safetyCheck.isSafe,
      severity: safetyCheck.severity,
      issuesCount: safetyCheck.issues.length,
    });

    // Use modified response if safety validator made changes
    const finalResponse = safetyCheck.modifiedResponse || llmResponse;

    // Step 8: Update conversation with final response
    await ConversationModel.updateWithResponse(
      conversationId,
      finalResponse,
      LLM_CONFIG.openai.model,
      promptManager.getPromptVersion()
    );

    logger.info('Conversation processed successfully', {
      conversationId,
      jobId: job.id,
      safetyScore: SafetyValidator.calculateSafetyScore(safetyCheck),
    });

    return {
      conversationId,
      status: 'completed',
      safetyCheck,
    };
  } catch (error: any) {
    logger.error('Conversation processing failed', {
      conversationId,
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });

    // Update conversation status to failed
    await ConversationModel.updateStatus(
      conversationId,
      ConversationStatus.FAILED,
      error.message
    );

    // Optionally, save fallback response
    try {
      const fallbackResponse = promptManager.getFallbackResponse();
      await ConversationModel.updateWithResponse(
        conversationId,
        fallbackResponse,
        'fallback',
        promptManager.getPromptVersion()
      );
    } catch (fallbackError) {
      logger.error('Failed to save fallback response', {
        conversationId,
        error: fallbackError,
      });
    }

    throw error;
  }
}

/**
 * Create and start conversation worker
 */
export function createConversationWorker() {
  const worker = new Worker<ConversationJobData>(
    'conversation-processing',
    processConversation,
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
      autorun: true,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Conversation job completed', {
      jobId: job.id,
      conversationId: job.data.conversationId,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Conversation job failed', {
      jobId: job?.id,
      conversationId: job?.data.conversationId,
      error: err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error('Worker error', { error: err });
  });

  logger.info('Conversation worker started');

  return worker;
}

