import { LLMMessage } from './LLMProvider.interface';
import { Profile } from '../../../../shared/types/profile.types';
import { Conversation } from '../../../../shared/types/conversation.types';
import { Vital } from '../../../../shared/types/profile.types';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { LLM_CONFIG } from '../../config/providers';

/**
 * Prompt Manager for building LLM prompts with context
 */
export class PromptManager {
  private systemPrompt: string;
  private promptVersion: string;

  constructor() {
    // Load system prompt from file
    const systemPromptPath = path.join(
      __dirname,
      '../../prompts/system_prompt.md'
    );

    try {
      this.systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
    } catch (error) {
      logger.error('Failed to load system prompt', { error });
      throw new Error('System prompt not found');
    }

    this.promptVersion = LLM_CONFIG.promptVersion;

    logger.info('Prompt Manager initialized', {
      version: this.promptVersion,
    });
  }

  /**
   * Build complete prompt with context
   */
  buildPrompt(
    transcript: string,
    profile?: Profile,
    recentConversations?: Conversation[],
    vitals?: Vital[]
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // System prompt
    messages.push({
      role: 'system',
      content: this.systemPrompt,
    });

    // Build user prompt with context
    let userPrompt = this.buildUserPrompt(
      transcript,
      profile,
      recentConversations,
      vitals
    );

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    return messages;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(
    transcript: string,
    profile?: Profile,
    recentConversations?: Conversation[],
    vitals?: Vital[]
  ): string {
    let prompt = '# User Query\n\n';

    // Add profile context
    if (profile) {
      prompt += '## Profile Context\n\n';
      prompt += `- Name: ${profile.name}\n`;
      prompt += `- Relation: ${profile.relation}\n`;
      
      if (profile.dob) {
        const age = this.calculateAge(new Date(profile.dob));
        prompt += `- Age: ${age} years\n`;
      }
      
      prompt += `- Sex: ${profile.sex}\n`;
      
      if (profile.notes) {
        prompt += `- Medical Notes: ${profile.notes}\n`;
      }
      
      prompt += '\n';
    }

    // Add vital readings context
    if (vitals && vitals.length > 0) {
      prompt += '## Recent Vital Readings\n\n';
      
      for (const vital of vitals.slice(0, 5)) {
        prompt += `- ${vital.type.toUpperCase()}: ${JSON.stringify(vital.value)} (recorded: ${vital.recorded_at})\n`;
      }
      
      prompt += '\n';
    }

    // Add recent conversation history
    if (recentConversations && recentConversations.length > 0) {
      prompt += '## Recent Conversation History\n\n';
      
      for (const conv of recentConversations.slice(0, 3)) {
        if (conv.transcript && conv.structured_response) {
          prompt += `### Previous Query:\n${conv.transcript}\n\n`;
          prompt += `### Previous Summary:\n${conv.structured_response.summary}\n\n`;
        }
      }
    }

    // Add current query
    prompt += '## Current Health Query\n\n';
    prompt += transcript;
    prompt += '\n\n';

    // Explicit JSON instruction
    prompt += '## Instructions\n\n';
    prompt += 'Please analyze the above health query and provide a structured response in valid JSON format according to the schema defined in the system prompt. Ensure your response includes all required fields: summary, causes, self_care, red_flags, recommendations, and follow_up.\n';

    return prompt;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get fallback response
   */
  getFallbackResponse(): any {
    const fallbackPath = path.join(
      __dirname,
      '../../prompts/fallback_template.md'
    );

    try {
      const fallbackContent = fs.readFileSync(fallbackPath, 'utf-8');
      
      // Extract JSON from markdown code block
      const jsonMatch = fallbackContent.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (error) {
      logger.error('Failed to load fallback response', { error });
    }

    // Hard-coded fallback as last resort
    return {
      summary:
        "We're unable to process your query at this time. Please consult a healthcare professional for proper evaluation.",
      causes: [
        'System temporarily unavailable',
        'Professional medical evaluation recommended',
      ],
      self_care: [
        'Monitor your symptoms closely',
        'Keep a record of symptoms and changes',
        'Stay hydrated and rest',
      ],
      red_flags: [
        'Seek emergency care for severe symptoms: chest pain, difficulty breathing, severe bleeding',
        'Contact doctor immediately if symptoms worsen rapidly',
      ],
      recommendations: [
        'Consult your primary care physician',
        'Visit urgent care if symptoms persist',
        'Call 911 for medical emergencies',
      ],
      follow_up: [
        'Schedule appointment with healthcare provider',
        'Track symptoms to share with doctor',
      ],
    };
  }

  /**
   * Get prompt version
   */
  getPromptVersion(): string {
    return this.promptVersion;
  }

  /**
   * Validate response schema
   */
  validateResponse(response: any): boolean {
    const requiredFields = [
      'summary',
      'causes',
      'self_care',
      'red_flags',
      'recommendations',
      'follow_up',
    ];

    for (const field of requiredFields) {
      if (!response[field]) {
        logger.warn('Response missing required field', { field });
        return false;
      }

      // Check if arrays have content
      if (Array.isArray(response[field]) && response[field].length === 0) {
        logger.warn('Response field is empty array', { field });
        return false;
      }
    }

    return true;
  }
}

