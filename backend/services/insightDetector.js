const { createClient } = require('@supabase/supabase-js');
const MemoryRetrieval = require('./memoryRetrieval');
const MemoryUpdate = require('./memoryUpdate');

class InsightDetector {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.memoryRetrieval = new MemoryRetrieval();
    this.memoryUpdate = new MemoryUpdate();
  }

  /**
   * Main entry point - detect insights for a profile
   */
  async detectInsights(profileId) {
    try {
      console.log(`[InsightDetector] Analyzing patterns for profile ${profileId}`);

      // Run all pattern detection rules
      await Promise.all([
        this.detectSleepEnergyCorrelation(profileId),
        this.detectStressSymptomPatterns(profileId),
        this.detectHabitImprovements(profileId),
      ]);

      console.log('[InsightDetector] Pattern analysis complete');

    } catch (error) {
      console.error('[InsightDetector] Error detecting insights:', error);
    }
  }

  /**
   * Rule 1: Sleep-Energy correlation
   * Detect if poor sleep correlates with fatigue/low energy
   */
  async detectSleepEnergyCorrelation(profileId) {
    try {
      // Get sleep vital events
      const sleepEvents = await this.getVitalEvents(profileId, 'sleep', 7); // Last 7 days

      // Get fatigue-related conversation events
      const fatigueEvents = await this.memoryRetrieval.searchEventsByKeyword(
        profileId,
        'tired|fatigue|exhausted|energy|weak'
      );

      // Need at least 3 data points of each
      if (sleepEvents.length < 3 || fatigueEvents.length < 2) {
        return;
      }

      // Simple correlation: Check if fatigue events occurred on days with low sleep
      let correlationCount = 0;
      const LOW_SLEEP_THRESHOLD = 6; // hours

      for (const fatigueEvent of fatigueEvents.slice(0, 5)) {
        const fatigueDate = new Date(fatigueEvent.timestamp);
        
        // Find sleep data from the night before
        const relevantSleep = sleepEvents.find(sleepEvent => {
          const sleepDate = new Date(sleepEvent.timestamp);
          const dayDiff = Math.abs(fatigueDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60 * 24);
          return dayDiff <= 1;
        });

        if (relevantSleep && relevantSleep.metadata.value < LOW_SLEEP_THRESHOLD) {
          correlationCount++;
        }
      }

      // If 60%+ of fatigue events correlate with low sleep, create insight
      const correlationRate = correlationCount / Math.min(fatigueEvents.length, 5);
      
      if (correlationRate >= 0.6) {
        const avgLowSleep = sleepEvents
          .filter(e => e.metadata.value < LOW_SLEEP_THRESHOLD)
          .reduce((sum, e) => sum + e.metadata.value, 0) / 
          sleepEvents.filter(e => e.metadata.value < LOW_SLEEP_THRESHOLD).length;

        await this.memoryUpdate.createInsight(
          profileId,
          `Your fatigue tends to occur when you sleep less than ${LOW_SLEEP_THRESHOLD} hours. Average sleep on those days: ${avgLowSleep.toFixed(1)} hours.`,
          correlationRate
        );

        console.log(`[InsightDetector] Sleep-energy correlation detected (${Math.round(correlationRate * 100)}% confidence)`);
      }

    } catch (error) {
      console.error('[InsightDetector] Error in sleep-energy correlation:', error);
    }
  }

  /**
   * Rule 2: Stress-Symptom patterns
   * Detect if stress mentions correlate with physical symptoms
   */
  async detectStressSymptomPatterns(profileId) {
    try {
      // Get stress-related events
      const stressEvents = await this.memoryRetrieval.searchEventsByKeyword(
        profileId,
        'stress|anxious|anxiety|worry|nervous|overwhelmed'
      );

      // Get symptom events (headaches, stomach issues, etc.)
      const symptomEvents = await this.memoryRetrieval.searchEventsByKeyword(
        profileId,
        'headache|stomach|nausea|pain|ache|tense'
      );

      if (stressEvents.length < 2 || symptomEvents.length < 2) {
        return;
      }

      // Check temporal proximity (within 24 hours)
      let correlationCount = 0;

      for (const symptom of symptomEvents.slice(0, 5)) {
        const symptomDate = new Date(symptom.timestamp);
        
        const nearbyStress = stressEvents.find(stress => {
          const stressDate = new Date(stress.timestamp);
          const hoursDiff = Math.abs(symptomDate.getTime() - stressDate.getTime()) / (1000 * 60 * 60);
          return hoursDiff <= 24;
        });

        if (nearbyStress) {
          correlationCount++;
        }
      }

      const correlationRate = correlationCount / Math.min(symptomEvents.length, 5);

      if (correlationRate >= 0.5) {
        await this.memoryUpdate.createInsight(
          profileId,
          'Your physical symptoms often appear during or shortly after periods of stress. Stress management techniques may help reduce these symptoms.',
          correlationRate
        );

        console.log(`[InsightDetector] Stress-symptom pattern detected (${Math.round(correlationRate * 100)}% confidence)`);
      }

    } catch (error) {
      console.error('[InsightDetector] Error in stress-symptom pattern:', error);
    }
  }

  /**
   * Rule 3: Habit improvements
   * Detect if tracking habits has led to improvements
   */
  async detectHabitImprovements(profileId) {
    try {
      // Check if user has active issues
      const activeIssues = await this.memoryRetrieval.getActiveIssues(profileId, 5);

      if (activeIssues.length === 0) {
        return;
      }

      // For each issue, check if related vitals show improvement
      for (const issue of activeIssues) {
        // Sleep issue example
        if (issue.label.toLowerCase().includes('sleep')) {
          const improvement = await this.calculateVitalImprovement(
            profileId,
            'sleep',
            issue.first_reported_at
          );

          if (improvement > 10) { // 10% improvement
            await this.memoryUpdate.createInsight(
              profileId,
              `Since you started tracking sleep ${this.getDaysAgo(issue.first_reported_at)} days ago, your sleep has improved by approximately ${Math.round(improvement)}%. Keep up the good work!`,
              0.8,
              issue.id
            );

            console.log(`[InsightDetector] Habit improvement detected for: ${issue.label}`);
          }
        }

        // Water intake issue example
        if (issue.label.toLowerCase().includes('hydration') || issue.label.toLowerCase().includes('water')) {
          const improvement = await this.calculateVitalImprovement(
            profileId,
            'water',
            issue.first_reported_at
          );

          if (improvement > 15) {
            await this.memoryUpdate.createInsight(
              profileId,
              `Your water intake has increased by ${Math.round(improvement)}% since you started tracking. This is great for your overall health!`,
              0.8,
              issue.id
            );

            console.log(`[InsightDetector] Hydration improvement detected`);
          }
        }
      }

    } catch (error) {
      console.error('[InsightDetector] Error in habit improvements:', error);
    }
  }

  /**
   * Calculate improvement in a vital since a given date
   */
  async calculateVitalImprovement(profileId, vitalType, sinceDate) {
    try {
      // Get vital events
      const allEvents = await this.getVitalEvents(profileId, vitalType, 30);

      if (allEvents.length < 4) {
        return 0; // Not enough data
      }

      const sinceDateTime = new Date(sinceDate).getTime();

      // Split into before and after
      const before = allEvents.filter(e => new Date(e.timestamp).getTime() < sinceDateTime);
      const after = allEvents.filter(e => new Date(e.timestamp).getTime() >= sinceDateTime);

      if (before.length < 2 || after.length < 2) {
        return 0;
      }

      // Calculate averages
      const avgBefore = before.reduce((sum, e) => sum + e.metadata.value, 0) / before.length;
      const avgAfter = after.reduce((sum, e) => sum + e.metadata.value, 0) / after.length;

      // Calculate percentage improvement
      const improvement = ((avgAfter - avgBefore) / avgBefore) * 100;

      return improvement;

    } catch (error) {
      console.error('[InsightDetector] Error calculating vital improvement:', error);
      return 0;
    }
  }

  /**
   * Get vital events from event_memory
   */
  async getVitalEvents(profileId, vitalType, daysBack = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const { data, error } = await this.supabase
        .from('event_memory')
        .select('*')
        .eq('profile_id', profileId)
        .eq('event_type', 'vitals')
        .gte('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Filter by vital type in metadata
      return (data || []).filter(event => 
        event.metadata?.type === vitalType
      );

    } catch (error) {
      console.error('[InsightDetector] Error fetching vital events:', error);
      return [];
    }
  }

  /**
   * Utility: Get days ago from a date string
   */
  getDaysAgo(dateString) {
    const past = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}

module.exports = InsightDetector;

