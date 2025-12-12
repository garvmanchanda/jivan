import { query } from '../config/database';
import {
  Conversation,
  CreateConversationDTO,
  ConversationStatus,
  StructuredResponse,
  InputType,
} from '../../../shared/types/conversation.types';

export class ConversationModel {
  /**
   * Create a new conversation
   */
  static async create(
    userId: string,
    data: CreateConversationDTO
  ): Promise<Conversation> {
    const queryText = `
      INSERT INTO conversations (
        user_id, profile_id, input_type, transcript, audio_s3_key, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userId,
      data.profile_id,
      data.input_type,
      data.transcript || null,
      data.audio_s3_key || null,
      ConversationStatus.QUEUED,
    ];

    const result = await query<Conversation>(queryText, values);
    return result.rows[0];
  }

  /**
   * Find conversation by ID
   */
  static async findById(id: string): Promise<Conversation | null> {
    const result = await query<Conversation>(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find conversations by profile ID
   */
  static async findByProfileId(
    profileId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Conversation[]> {
    const result = await query<Conversation>(
      `SELECT * FROM conversations 
       WHERE profile_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Find conversations by user ID
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Conversation[]> {
    const result = await query<Conversation>(
      `SELECT * FROM conversations 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get recent conversations for profile context
   */
  static async getRecentForContext(
    profileId: string,
    limit: number = 3
  ): Promise<Conversation[]> {
    const result = await query<Conversation>(
      `SELECT * FROM conversations 
       WHERE profile_id = $1 
         AND status = $2
         AND structured_response IS NOT NULL
       ORDER BY created_at DESC 
       LIMIT $3`,
      [profileId, ConversationStatus.COMPLETED, limit]
    );
    return result.rows;
  }

  /**
   * Update conversation status
   */
  static async updateStatus(
    id: string,
    status: ConversationStatus,
    errorMessage?: string
  ): Promise<Conversation | null> {
    const queryText = `
      UPDATE conversations
      SET status = $1, error_message = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await query<Conversation>(queryText, [
      status,
      errorMessage || null,
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Update conversation with transcript
   */
  static async updateTranscript(
    id: string,
    transcript: string,
    asrProvider: string
  ): Promise<Conversation | null> {
    const queryText = `
      UPDATE conversations
      SET transcript = $1, asr_provider = $2, status = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await query<Conversation>(queryText, [
      transcript,
      asrProvider,
      ConversationStatus.PROCESSING,
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Update conversation with LLM response
   */
  static async updateWithResponse(
    id: string,
    structuredResponse: StructuredResponse,
    llmModel: string,
    llmPromptVersion: string
  ): Promise<Conversation | null> {
    const queryText = `
      UPDATE conversations
      SET 
        structured_response = $1, 
        llm_model = $2, 
        llm_prompt_version = $3,
        status = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await query<Conversation>(queryText, [
      JSON.stringify(structuredResponse),
      llmModel,
      llmPromptVersion,
      ConversationStatus.COMPLETED,
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Update conversation feedback
   */
  static async updateFeedback(
    id: string,
    feedback: { rating: number; reason?: string }
  ): Promise<Conversation | null> {
    const result = await query<Conversation>(
      'UPDATE conversations SET feedback = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(feedback), id]
    );
    return result.rows[0] || null;
  }

  /**
   * Count conversations by profile
   */
  static async countByProfile(profileId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM conversations WHERE profile_id = $1',
      [profileId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

