import { StructuredResponse } from '../../../../shared/types/conversation.types';
import { logger } from '../../utils/logger';
import { SAFETY_CONFIG } from '../../config/providers';

export interface SafetyCheckResult {
  isSafe: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldEscalate: boolean;
  modifiedResponse?: StructuredResponse;
}

/**
 * Safety Validator for LLM outputs
 */
export class SafetyValidator {
  /**
   * Validate LLM response for safety concerns
   */
  static validate(response: StructuredResponse, originalTranscript: string): SafetyCheckResult {
    const issues: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let shouldEscalate = false;

    // Check for emergency keywords in original transcript
    const transcriptLower = originalTranscript.toLowerCase();
    
    for (const keyword of SAFETY_CONFIG.emergencyKeywords) {
      if (transcriptLower.includes(keyword)) {
        issues.push(`Emergency keyword detected: "${keyword}"`);
        severity = 'critical';
        shouldEscalate = true;
      }
    }

    for (const keyword of SAFETY_CONFIG.dangerousKeywords) {
      if (transcriptLower.includes(keyword)) {
        issues.push(`Dangerous keyword detected: "${keyword}"`);
        severity = 'critical';
        shouldEscalate = true;
      }
    }

    // Check for missing critical fields
    if (!response.red_flags || response.red_flags.length === 0) {
      issues.push('Response missing red flags');
      severity = 'medium';
    }

    // Check for inappropriate medical advice
    const concerningPhrases = [
      'prescribe',
      'prescription',
      'medication dosage',
      'stop taking',
      'don\'t see a doctor',
      'no need to consult',
      'definitely have',
      'you are diagnosed with',
    ];

    const allText = [
      response.summary,
      ...response.causes,
      ...response.self_care,
      ...response.recommendations,
    ].join(' ').toLowerCase();

    for (const phrase of concerningPhrases) {
      if (allText.includes(phrase)) {
        issues.push(`Potentially inappropriate advice: contains "${phrase}"`);
        if (severity === 'low') severity = 'medium';
      }
    }

    // Check if response encourages professional consultation
    const consultKeywords = [
      'consult',
      'doctor',
      'physician',
      'healthcare provider',
      'medical professional',
      'seek medical',
    ];

    const hasConsultAdvice = consultKeywords.some((keyword) =>
      allText.includes(keyword)
    );

    if (!hasConsultAdvice) {
      issues.push('Response does not encourage professional consultation');
      if (severity === 'low') severity = 'medium';
    }

    // Check for disclaimer language
    const hasDisclaimer =
      allText.includes('not a diagnosis') ||
      allText.includes('not medical advice') ||
      allText.includes('consult a healthcare');

    if (!hasDisclaimer) {
      issues.push('Response missing disclaimer language');
      if (severity === 'low') severity = 'medium';
    }

    // Modify response if safety issues detected
    let modifiedResponse: StructuredResponse | undefined;

    if (shouldEscalate || severity === 'critical') {
      modifiedResponse = this.addEmergencyGuidance(response);
    }

    if (issues.length > 0 && severity !== 'critical') {
      modifiedResponse = this.addSafetyNotices(response);
    }

    const isSafe = severity !== 'critical' && !shouldEscalate;

    if (!isSafe) {
      logger.warn('Safety validation failed', {
        issues,
        severity,
        shouldEscalate,
      });
    }

    return {
      isSafe,
      issues,
      severity,
      shouldEscalate,
      modifiedResponse,
    };
  }

  /**
   * Add emergency guidance to response
   */
  private static addEmergencyGuidance(
    response: StructuredResponse
  ): StructuredResponse {
    const emergencyNotice =
      'IMPORTANT: Based on your description, this may require immediate medical attention.';

    const emergencyRedFlags = [
      'Call 911 immediately if you are experiencing a medical emergency',
      'Go to the nearest emergency room if symptoms are severe or worsening',
      'Do not delay emergency care - your safety is the top priority',
    ];

    return {
      ...response,
      summary: `${emergencyNotice} ${response.summary}`,
      red_flags: [...emergencyRedFlags, ...response.red_flags],
      recommendations: [
        'Seek immediate medical attention - call 911 or go to ER',
        ...response.recommendations.filter(
          (r) => !r.toLowerCase().includes('monitor')
        ),
      ],
    };
  }

  /**
   * Add safety notices to response
   */
  private static addSafetyNotices(
    response: StructuredResponse
  ): StructuredResponse {
    const safetyNotice =
      'This guidance is for informational purposes only and is not a medical diagnosis.';

    const disclaimerRecommendation =
      'Always consult with a qualified healthcare provider for proper medical evaluation and advice.';

    return {
      ...response,
      summary: `${response.summary} ${safetyNotice}`,
      recommendations: [
        ...response.recommendations,
        disclaimerRecommendation,
      ],
    };
  }

  /**
   * Check if transcript indicates emergency
   */
  static isEmergency(transcript: string): boolean {
    const transcriptLower = transcript.toLowerCase();

    for (const keyword of SAFETY_CONFIG.emergencyKeywords) {
      if (transcriptLower.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract safety score (0-100, higher is safer)
   */
  static calculateSafetyScore(result: SafetyCheckResult): number {
    let score = 100;

    switch (result.severity) {
      case 'critical':
        score -= 80;
        break;
      case 'high':
        score -= 50;
        break;
      case 'medium':
        score -= 25;
        break;
      case 'low':
        score -= 10;
        break;
    }

    score -= result.issues.length * 5;

    if (result.shouldEscalate) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }
}

