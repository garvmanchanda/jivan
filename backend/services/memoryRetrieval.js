const { createClient } = require('@supabase/supabase-js');

class MemoryRetrieval {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Retrieve relevant memory for a given profile and query
   * Returns: { activeIssues, recentEvents, insights }
   */
  async retrieveMemory(profileId, queryMetadata = {}) {
    try {
      console.log(`[MemoryRetrieval] Fetching memory for profile ${profileId}`);

      // Fetch in parallel for speed
      const [activeIssues, recentEvents, insights] = await Promise.all([
        this.getActiveIssues(profileId),
        this.getRecentEvents(profileId, 3),
        this.getInsights(profileId, 2)
      ]);

      console.log(`[MemoryRetrieval] Retrieved: ${activeIssues.length} issues, ${recentEvents.length} events, ${insights.length} insights`);

      return {
        activeIssues: activeIssues || [],
        recentEvents: recentEvents || [],
        insights: insights || []
      };

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching memory:', error);
      // Return empty memory on error - don't fail the whole request
      return {
        activeIssues: [],
        recentEvents: [],
        insights: []
      };
    }
  }

  /**
   * Get top 2 active issues ordered by severity and recency
   */
  async getActiveIssues(profileId, limit = 2) {
    try {
      const { data, error } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('profile_id', profileId)
        .in('status', ['active', 'monitoring'])
        .order('severity', { ascending: false }) // severe -> moderate -> mild
        .order('last_mentioned_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Sort severity properly (severe > moderate > mild)
      const severityOrder = { 'severe': 3, 'moderate': 2, 'mild': 1 };
      return (data || []).sort((a, b) => {
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.last_mentioned_at) - new Date(a.last_mentioned_at);
      });

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching active issues:', error);
      return [];
    }
  }

  /**
   * Get recent health events (conversations, vitals entries, etc.)
   */
  async getRecentEvents(profileId, limit = 3) {
    try {
      const { data, error } = await this.supabase
        .from('event_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching recent events:', error);
      return [];
    }
  }

  /**
   * Get learned insights ordered by confidence
   */
  async getInsights(profileId, limit = 2) {
    try {
      const { data, error } = await this.supabase
        .from('insight_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('confidence', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching insights:', error);
      return [];
    }
  }

  /**
   * Get issue history for a specific issue
   */
  async getIssueHistory(issueId) {
    try {
      const { data, error } = await this.supabase
        .from('issue_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching issue history:', error);
      return [];
    }
  }

  /**
   * Search for events by keyword (for insight detection)
   */
  async searchEventsByKeyword(profileId, keyword) {
    try {
      const { data, error } = await this.supabase
        .from('event_memory')
        .select('*')
        .eq('profile_id', profileId)
        .ilike('description', `%${keyword}%`)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error searching events:', error);
      return [];
    }
  }

  /**
   * Get events by type (e.g., 'vitals', 'conversation', 'report_finding')
   */
  async getEventsByType(profileId, eventType, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('event_memory')
        .select('*')
        .eq('profile_id', profileId)
        .eq('event_type', eventType)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching events by type:', error);
      return [];
    }
  }

  /**
   * Get all active issues for a profile (for UI display)
   */
  async getAllActiveIssues(profileId) {
    try {
      const { data, error } = await this.supabase
        .from('active_issues')
        .select('*')
        .eq('profile_id', profileId)
        .neq('status', 'resolved')
        .order('last_mentioned_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching all active issues:', error);
      return [];
    }
  }

  /**
   * Get all insights for a profile (for UI display)
   */
  async getAllInsights(profileId) {
    try {
      const { data, error } = await this.supabase
        .from('insight_memory')
        .select('*')
        .eq('profile_id', profileId)
        .order('confidence', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[MemoryRetrieval] Error fetching all insights:', error);
      return [];
    }
  }
}

module.exports = MemoryRetrieval;

