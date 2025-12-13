const OpenAI = require('openai');
const MemoryRetrieval = require('./memoryRetrieval');
const MemoryUpdate = require('./memoryUpdate');

class PromptManager {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.memoryRetrieval = new MemoryRetrieval();
    this.memoryUpdate = new MemoryUpdate();
  }

  /**
   * Main entry point - processes a health query with full memory context
   */
  async processQuery(query, profileId, profileContext = {}) {
    try {
      console.log(`[PromptManager] Processing query for profile ${profileId}`);

      // 1. Extract query metadata (basic for now)
      const queryMeta = this.extractQueryMetadata(query);

      // 2. Retrieve relevant memory
      const memory = await this.memoryRetrieval.retrieveMemory(profileId, queryMeta);

      // 3. Build context-aware prompt
      const { systemPrompt, userPrompt } = this.buildPrompt(query, memory, profileContext);

      // 4. Call LLM
      const llmResponse = await this.callLLM(systemPrompt, userPrompt);

      // 5. Validate response
      const validated = this.validateResponse(llmResponse);

      // 6. Update memory (issues, events, insights)
      await this.memoryUpdate.updateMemory(profileId, query, validated, memory);

      // 7. Return structured response to frontend
      return this.formatResponse(validated);

    } catch (error) {
      console.error('[PromptManager] Error processing query:', error);
      throw error;
    }
  }

  /**
   * Extract basic metadata from query (extensible for NLP later)
   */
  extractQueryMetadata(query) {
    const lowerQuery = query.toLowerCase();
    
    // Basic keyword detection
    const hasPain = /pain|hurt|ache|sore/.test(lowerQuery);
    const hasFatigue = /tired|fatigue|exhausted|energy|weak/.test(lowerQuery);
    const hasSleep = /sleep|insomnia|wake|rest/.test(lowerQuery);
    const hasStress = /stress|anxious|anxiety|worry|nervous/.test(lowerQuery);
    const hasDigestive = /stomach|digest|nausea|vomit|diarrhea/.test(lowerQuery);

    return {
      keywords: { hasPain, hasFatigue, hasSleep, hasStress, hasDigestive },
      length: query.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build context-rich prompts with memory
   */
  buildPrompt(query, memory, profileContext) {
    // Format temporal context
    const temporalContext = this.buildTemporalContext(memory.activeIssues);
    
    // Build system prompt with memory
    const systemPrompt = `You are Jeevan, a healthcare concierge managing an ongoing health journey.

CRITICAL CONTEXT:
You are NOT starting fresh. You have memory of this person's health over time.
${memory.activeIssues.length > 0 ? '\nACTIVE ONGOING ISSUES:' : '\nNo active issues currently tracked.'}
${temporalContext}
${memory.recentEvents.length > 0 ? '\nRECENT HEALTH EVENTS:' : ''}
${memory.recentEvents.map(event => `- ${event.description} (${this.formatDate(event.timestamp)})`).join('\n')}
${memory.insights.length > 0 ? '\nLEARNED INSIGHTS:' : ''}
${memory.insights.map(insight => `- ${insight.insight} (confidence: ${Math.round(insight.confidence * 100)}%)`).join('\n')}

YOUR RESPONSE MUST:
1. REFLECTION: Mirror their feeling AND reference continuity if applicable
   - If this relates to an existing issue, acknowledge it: "I see you're still experiencing the [issue] we've been tracking since [date]."
   - If it's new, be empathetic: "I understand this is concerning for you."
   
2. CONTEXTUAL INTERPRETATION: Connect today's query to past patterns (if any)
   - Reference insights: "This aligns with the pattern we noticed..."
   - Or note if it's new: "This seems to be a new concern separate from what we've been tracking."
   
3. GUIDANCE: Specific, actionable, safe steps (4-6 items)
   - Include timing, dosages, practical instructions
   - Cover rest, hydration, nutrition, over-the-counter remedies
   
4. RED FLAGS: Clear escalation signals (3-4 items)
   - When to seek immediate care
   - Warning signs to watch for
   - Follow-up recommendations
   
5. ONE FOLLOW-UP: Either ask a clarifying question OR set a time-based check-in
   - Example: "Let's check in tomorrow evening - if you're still feeling this way, I'll help you find a doctor."
   - Or: "Can you tell me more about when this started?"

6. SUGGESTED ISSUE UPDATES: How should we update the memory?
   - Create new issue if this is a new concern worth tracking
   - Update existing issue if status/severity changed
   - Resolve issue if user indicates improvement
   - Mark as monitoring if improving but needs watching

SAFETY RULES:
- Never diagnose or prescribe medications
- For severe symptoms (chest pain, difficulty breathing, severe headache), ALWAYS flag emergency
- For children, pregnant women, elderly: lower threshold for medical consultation
- When uncertain, recommend professional care

OUTPUT JSON SCHEMA:
{
  "reflection": "Empathetic acknowledgment WITH continuity reference if applicable",
  "interpretation": "What this means given their ongoing issues and patterns (or note if it's new)",
  "guidance": ["Detailed step 1 with timing", "Detailed step 2", "Step 3", "Step 4"],
  "redFlags": ["When to seek care point 1", "Warning sign 2", "Follow-up recommendation 3"],
  "followUp": "One specific question OR time-based next step",
  "recommendations": ["Lifestyle recommendation 1", "Recommendation 2", "Recommendation 3"],
  "suggestedIssueUpdates": [
    {
      "action": "create | update | resolve | none",
      "issueId": "uuid for update/resolve, null for create",
      "label": "Brief issue name like 'Headaches' or 'Poor sleep'",
      "status": "active | improving | resolved | monitoring",
      "severity": "mild | moderate | severe",
      "reason": "1-2 sentence explanation for this update"
    }
  ]
}

IMPORTANT: 
- Always include the suggestedIssueUpdates array even if action is "none"
- Be conservative about creating new issues - only for ongoing/recurring concerns
- One-time minor issues don't need tracking`;

    const userPrompt = `USER QUERY: "${query}"

PATIENT CONTEXT:
${profileContext.age ? `- Age: ${profileContext.age} years` : '- Age: Not provided'}
${profileContext.gender ? `- Gender: ${profileContext.gender}` : ''}
${profileContext.conditions ? `- Existing conditions: ${profileContext.conditions}` : ''}
${profileContext.medications ? `- Current medications: ${profileContext.medications}` : ''}
${profileContext.recentVitals ? `- Recent vitals: ${JSON.stringify(profileContext.recentVitals)}` : ''}

Please provide comprehensive health guidance following all principles and structure outlined in your system instructions.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Build temporal context for active issues
   */
  buildTemporalContext(activeIssues) {
    if (!activeIssues || activeIssues.length === 0) return '';

    return activeIssues.map(issue => {
      const durationDays = this.getDaysDiff(issue.first_reported_at);
      const timeSinceLastMention = this.getDaysDiff(issue.last_mentioned_at);
      
      return `- ${issue.label} (${issue.status}, ${issue.severity}) - ongoing for ${durationDays} days, last discussed ${timeSinceLastMention} days ago`;
    }).join('\n');
  }

  /**
   * Call OpenAI with prompts
   */
  async callLLM(systemPrompt, userPrompt) {
    console.log('[PromptManager] Calling OpenAI GPT-3.5-turbo...');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 2000,
    });

    const response = JSON.parse(completion.choices[0].message.content);
    console.log('[PromptManager] LLM response received');

    return response;
  }

  /**
   * Validate LLM response structure
   */
  validateResponse(response) {
    // Check required fields
    const requiredFields = ['reflection', 'interpretation', 'guidance', 'redFlags', 'followUp'];
    
    for (const field of requiredFields) {
      if (!response[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure arrays
    if (!Array.isArray(response.guidance)) {
      throw new Error('guidance must be an array');
    }
    if (!Array.isArray(response.redFlags)) {
      throw new Error('redFlags must be an array');
    }

    // Ensure suggestedIssueUpdates exists
    if (!response.suggestedIssueUpdates) {
      response.suggestedIssueUpdates = [];
    }

    return response;
  }

  /**
   * Format response for frontend
   */
  formatResponse(validated) {
    return {
      reflection: validated.reflection,
      interpretation: validated.interpretation,
      guidance: validated.guidance,
      redFlags: validated.redFlags,
      followUp: validated.followUp,
      recommendations: validated.recommendations || [],
      // Internal use only - not sent to frontend
      _suggestedIssueUpdates: validated.suggestedIssueUpdates
    };
  }

  /**
   * Utility: Get days difference from now
   */
  getDaysDiff(dateString) {
    const past = new Date(dateString);
    const now = new Date();
    const diffMs = now - past;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Utility: Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = this.getDaysDiff(dateString);

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

module.exports = PromptManager;

