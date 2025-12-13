const { createClient } = require('@supabase/supabase-js');

class MemoryUpdate {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Update memory after LLM response
   * Creates events, updates issues, and checks for insights
   */
  async updateMemory(profileId, query, llmResponse, currentMemory) {
    try {
      console.log(`[MemoryUpdate] Updating memory for profile ${profileId}`);

      // 1. Create event for this conversation
      await this.createConversationEvent(profileId, query, llmResponse);

      // 2. Process issue updates from LLM
      if (llmResponse._suggestedIssueUpdates && llmResponse._suggestedIssueUpdates.length > 0) {
        await this.processIssueUpdates(profileId, llmResponse._suggestedIssueUpdates, currentMemory);
      }

      // 3. Auto-update issue statuses based on time rules
      await this.autoUpdateIssueStatuses(profileId);

      console.log('[MemoryUpdate] Memory update complete');

    } catch (error) {
      console.error('[MemoryUpdate] Error updating memory:', error);
      // Don't throw - memory update failure shouldn't break the response
    }
  }

  /**
   * Create an event for this conversation
   */
  async createConversationEvent(profileId, query, llmResponse) {
    try {
      const { error } = await this.supabase
        .from('event_memory')
        .insert({
          profile_id: profileId,
          event_type: 'conversation',
          description: query,
          metadata: {
            reflection: llmResponse.reflection,
            interpretation: llmResponse.interpretation,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      console.log('[MemoryUpdate] Conversation event created');

    } catch (error) {
      console.error('[MemoryUpdate] Error creating conversation event:', error);
    }
  }

  /**
   * Process issue updates suggested by LLM
   */
  async processIssueUpdates(profileId, suggestedUpdates, currentMemory) {
    for (const update of suggestedUpdates) {
      try {
        if (update.action === 'none') continue;

        if (update.action === 'create') {
          await this.createIssue(profileId, update, currentMemory);
        } else if (update.action === 'update') {
          await this.updateIssue(update);
        } else if (update.action === 'resolve') {
          await this.resolveIssue(update);
        }

      } catch (error) {
        console.error(`[MemoryUpdate] Error processing issue update:`, error);
      }
    }
  }

  /**
   * Create a new issue (with duplicate check)
   */
  async createIssue(profileId, update, currentMemory) {
    try {
      // Rule: Don't create duplicate issues
      const existingIssue = await this.findSimilarIssue(profileId, update.label, currentMemory);
      
      if (existingIssue) {
        console.log(`[MemoryUpdate] Issue "${update.label}" already exists, updating instead`);
        await this.updateIssue({
          ...update,
          issueId: existingIssue.id
        });
        return;
      }

      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('active_issues')
        .insert({
          profile_id: profileId,
          label: update.label,
          status: update.status || 'active',
          severity: update.severity || 'mild',
          first_reported_at: now,
          last_mentioned_at: now,
          notes: update.reason
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[MemoryUpdate] Created new issue: ${update.label}`);

      // Log to history
      await this.logIssueHistory(data.id, null, update.status, null, update.severity, 'Issue created');

    } catch (error) {
      console.error('[MemoryUpdate] Error creating issue:', error);
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(update) {
    try {
      if (!update.issueId) {
        console.log('[MemoryUpdate] No issueId provided for update, skipping');
        return;
      }

      // Get current issue for history logging
      const { data: currentIssue } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('id', update.issueId)
        .single();

      if (!currentIssue) {
        console.log(`[MemoryUpdate] Issue ${update.issueId} not found`);
        return;
      }

      // Update issue
      const { error } = await this.supabase
        .from('active_issues')
        .update({
          status: update.status || currentIssue.status,
          severity: update.severity || currentIssue.severity,
          last_mentioned_at: new Date().toISOString(),
          notes: update.reason || currentIssue.notes
        })
        .eq('id', update.issueId);

      if (error) throw error;

      console.log(`[MemoryUpdate] Updated issue: ${currentIssue.label}`);

      // Log to history if status or severity changed
      if (update.status !== currentIssue.status || update.severity !== currentIssue.severity) {
        await this.logIssueHistory(
          update.issueId,
          currentIssue.status,
          update.status || currentIssue.status,
          currentIssue.severity,
          update.severity || currentIssue.severity,
          update.reason || 'Status updated'
        );
      }

    } catch (error) {
      console.error('[MemoryUpdate] Error updating issue:', error);
    }
  }

  /**
   * Resolve an issue
   */
  async resolveIssue(update) {
    try {
      if (!update.issueId) {
        console.log('[MemoryUpdate] No issueId provided for resolve, skipping');
        return;
      }

      // Get current issue
      const { data: currentIssue } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('id', update.issueId)
        .single();

      if (!currentIssue) {
        console.log(`[MemoryUpdate] Issue ${update.issueId} not found`);
        return;
      }

      // Update to resolved
      const { error } = await this.supabase
        .from('active_issues')
        .update({
          status: 'resolved',
          last_mentioned_at: new Date().toISOString(),
          notes: update.reason || 'Issue resolved'
        })
        .eq('id', update.issueId);

      if (error) throw error;

      console.log(`[MemoryUpdate] Resolved issue: ${currentIssue.label}`);

      // Log to history
      await this.logIssueHistory(
        update.issueId,
        currentIssue.status,
        'resolved',
        currentIssue.severity,
        currentIssue.severity,
        update.reason || 'Issue resolved'
      );

    } catch (error) {
      console.error('[MemoryUpdate] Error resolving issue:', error);
    }
  }

  /**
   * Find similar issue to avoid duplicates
   */
  async findSimilarIssue(profileId, label, currentMemory) {
    // First check current memory (already loaded)
    const similarInMemory = currentMemory.activeIssues.find(issue => 
      this.isSimilarLabel(issue.label, label)
    );

    if (similarInMemory) return similarInMemory;

    // Query database for active/monitoring issues
    try {
      const { data, error } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('profile_id', profileId)
        .in('status', ['active', 'monitoring', 'improving']);

      if (error) throw error;

      return (data || []).find(issue => this.isSimilarLabel(issue.label, label));

    } catch (error) {
      console.error('[MemoryUpdate] Error finding similar issue:', error);
      return null;
    }
  }

  /**
   * Check if two issue labels are similar (basic string matching)
   */
  isSimilarLabel(label1, label2) {
    const normalize = (str) => str.toLowerCase().trim();
    const l1 = normalize(label1);
    const l2 = normalize(label2);

    // Exact match
    if (l1 === l2) return true;

    // One contains the other
    if (l1.includes(l2) || l2.includes(l1)) return true;

    // Common keywords match
    const keywords1 = l1.split(/\s+/);
    const keywords2 = l2.split(/\s+/);
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    
    return commonKeywords.length >= 2;
  }

  /**
   * Auto-update issue statuses based on time rules
   */
  async autoUpdateIssueStatuses(profileId) {
    try {
      const { data: issues, error } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('profile_id', profileId)
        .neq('status', 'resolved');

      if (error) throw error;

      for (const issue of issues || []) {
        const daysSinceLastMention = this.getDaysDiff(issue.last_mentioned_at);

        // Rule: If not mentioned in 30 days and status is active, mark as resolved
        if (daysSinceLastMention > 30 && issue.status === 'active') {
          await this.supabase
            .from('active_issues')
            .update({ status: 'resolved' })
            .eq('id', issue.id);

          await this.logIssueHistory(
            issue.id,
            'active',
            'resolved',
            issue.severity,
            issue.severity,
            'Auto-resolved: no mention in 30 days'
          );

          console.log(`[MemoryUpdate] Auto-resolved issue: ${issue.label}`);
        }

        // Rule: If mentioned again after "improving", revert to active
        if (issue.status === 'improving' && daysSinceLastMention < 2) {
          await this.supabase
            .from('active_issues')
            .update({ status: 'active' })
            .eq('id', issue.id);

          await this.logIssueHistory(
            issue.id,
            'improving',
            'active',
            issue.severity,
            issue.severity,
            'Symptom recurrence'
          );

          console.log(`[MemoryUpdate] Reactivated issue: ${issue.label}`);
        }
      }

    } catch (error) {
      console.error('[MemoryUpdate] Error auto-updating issue statuses:', error);
    }
  }

  /**
   * Log issue status change to history
   */
  async logIssueHistory(issueId, oldStatus, newStatus, oldSeverity, newSeverity, reason) {
    try {
      const { error } = await this.supabase
        .from('issue_history')
        .insert({
          issue_id: issueId,
          old_status: oldStatus,
          new_status: newStatus,
          old_severity: oldSeverity,
          new_severity: newSeverity,
          reason: reason
        });

      if (error) throw error;

    } catch (error) {
      console.error('[MemoryUpdate] Error logging issue history:', error);
    }
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
   * Create an insight (called by insight detector)
   */
  async createInsight(profileId, insightText, confidence, relatedIssueId = null) {
    try {
      // Check if insight already exists
      const { data: existing } = await this.supabase
        .from('insight_memory')
        .select('*')
        .eq('profile_id', profileId)
        .ilike('insight', `%${insightText.substring(0, 20)}%`)
        .single();

      if (existing) {
        console.log('[MemoryUpdate] Insight already exists, skipping');
        return;
      }

      const { error } = await this.supabase
        .from('insight_memory')
        .insert({
          profile_id: profileId,
          insight: insightText,
          confidence: confidence,
          related_issue_id: relatedIssueId
        });

      if (error) throw error;

      console.log(`[MemoryUpdate] Created insight: ${insightText}`);

    } catch (error) {
      console.error('[MemoryUpdate] Error creating insight:', error);
    }
  }
}

module.exports = MemoryUpdate;

