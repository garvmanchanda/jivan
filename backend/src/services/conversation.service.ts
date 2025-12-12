import { ConversationModel } from '../models/Conversation';
import { ProfileModel } from '../models/Profile';
import { VitalModel } from '../models/Vital';
import { storageService } from './storage.service';
import { addConversationJob } from '../config/queue';
import {
  Conversation,
  CreateConversationDTO,
  ConversationStatus,
} from '../../../shared/types/conversation.types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

/**
 * Conversation service for managing health conversations
 */
export class ConversationService {
  /**
   * Create new conversation
   */
  static async createConversation(
    userId: string,
    data: CreateConversationDTO
  ): Promise<{ conversation: Conversation; jobId: string }> {
    try {
      // Verify profile ownership
      const profileBelongsToUser = await ProfileModel.belongsToUser(
        data.profile_id,
        userId
      );

      if (!profileBelongsToUser) {
        throw new AppError(
          'Unauthorized access to profile',
          403,
          'FORBIDDEN'
        );
      }

      // Create conversation record
      const conversation = await ConversationModel.create(userId, data);

      // Enqueue processing job
      const job = await addConversationJob(conversation.id);

      logger.info('Conversation created and queued', {
        conversationId: conversation.id,
        jobId: job.id,
        userId,
        inputType: data.input_type,
      });

      return {
        conversation,
        jobId: job.id as string,
      };
    } catch (error) {
      logger.error('Failed to create conversation', { error, userId });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to create conversation', 500);
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(
    conversationId: string,
    userId: string
  ): Promise<Conversation> {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Verify ownership
    if (conversation.user_id !== userId) {
      throw new AppError(
        'Unauthorized access to conversation',
        403,
        'FORBIDDEN'
      );
    }

    return conversation;
  }

  /**
   * Get conversations for a profile
   */
  static async getProfileConversations(
    profileId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ conversations: Conversation[]; total: number }> {
    // Verify profile ownership
    const profileBelongsToUser = await ProfileModel.belongsToUser(
      profileId,
      userId
    );

    if (!profileBelongsToUser) {
      throw new AppError('Unauthorized access to profile', 403, 'FORBIDDEN');
    }

    const conversations = await ConversationModel.findByProfileId(
      profileId,
      limit,
      offset
    );

    const total = await ConversationModel.countByProfile(profileId);

    return {
      conversations,
      total,
    };
  }

  /**
   * Get conversations for user
   */
  static async getUserConversations(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Conversation[]> {
    return await ConversationModel.findByUserId(userId, limit, offset);
  }

  /**
   * Update conversation feedback
   */
  static async updateFeedback(
    conversationId: string,
    userId: string,
    rating: number,
    reason?: string
  ): Promise<Conversation> {
    // Verify ownership
    await this.getConversation(conversationId, userId);

    const updated = await ConversationModel.updateFeedback(conversationId, {
      rating,
      reason,
    });

    if (!updated) {
      throw new AppError('Failed to update feedback', 500);
    }

    logger.info('Conversation feedback updated', {
      conversationId,
      rating,
    });

    return updated;
  }

  /**
   * Get signed URL for audio upload
   */
  static async getAudioUploadUrl(): Promise<{
    uploadUrl: string;
    fileKey: string;
    expiresAt: Date;
  }> {
    try {
      const prefix = process.env.S3_AUDIO_PREFIX || 'audio';
      
      return await storageService.getUploadUrl('audio/webm', prefix);
    } catch (error) {
      logger.error('Failed to generate upload URL', { error });
      throw new AppError('Failed to generate upload URL', 500);
    }
  }

  /**
   * Check conversation status
   */
  static async getStatus(
    conversationId: string,
    userId: string
  ): Promise<{
    status: ConversationStatus;
    conversation?: Conversation;
  }> {
    const conversation = await this.getConversation(conversationId, userId);

    return {
      status: conversation.status,
      conversation:
        conversation.status === ConversationStatus.COMPLETED
          ? conversation
          : undefined,
    };
  }
}

