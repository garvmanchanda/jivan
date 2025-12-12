import { Mixpanel } from 'mixpanel-react-native';
import { config } from '../config';

// Initialize Mixpanel
const mixpanel = new Mixpanel(config.mixpanel.token, true);

// Analytics events enum for type safety
export enum AnalyticsEvent {
  APP_OPEN = 'app_open',
  START_RECORDING = 'start_recording',
  RECORDING_COMPLETED = 'recording_completed',
  CONVERSATION_REQUESTED = 'conversation_requested',
  CONVERSATION_COMPLETED = 'conversation_completed',
  HABIT_STARTED = 'habit_started',
  HABIT_LOGGED = 'habit_logged',
  FEEDBACK_GIVEN = 'feedback_given',
}

class Analytics {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;
    
    try {
      await mixpanel.init();
      
      if (userId) {
        mixpanel.identify(userId);
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize Mixpanel:', error);
    }
  }

  identify(userId: string, properties?: Record<string, unknown>): void {
    try {
      mixpanel.identify(userId);
      
      if (properties) {
        mixpanel.getPeople().set(properties);
      }
    } catch (error) {
      console.warn('Failed to identify user:', error);
    }
  }

  reset(): void {
    try {
      mixpanel.reset();
    } catch (error) {
      console.warn('Failed to reset analytics:', error);
    }
  }

  private track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
    try {
      mixpanel.track(event, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    } catch (error) {
      console.warn(`Failed to track event ${event}:`, error);
    }
  }

  // ============================================
  // EVENT TRACKING METHODS
  // ============================================

  /**
   * Track app open event
   */
  trackAppOpen(): void {
    this.track(AnalyticsEvent.APP_OPEN);
  }

  /**
   * Track when user starts recording
   */
  trackStartRecording(profileId: string): void {
    this.track(AnalyticsEvent.START_RECORDING, {
      profile_id: profileId,
    });
  }

  /**
   * Track when recording is completed
   */
  trackRecordingCompleted(profileId: string, durationSeconds: number): void {
    this.track(AnalyticsEvent.RECORDING_COMPLETED, {
      profile_id: profileId,
      duration_seconds: durationSeconds,
    });
  }

  /**
   * Track when conversation is requested (sent to API)
   */
  trackConversationRequested(profileId: string): void {
    this.track(AnalyticsEvent.CONVERSATION_REQUESTED, {
      profile_id: profileId,
    });
  }

  /**
   * Track when conversation is completed (response received)
   */
  trackConversationCompleted(
    profileId: string,
    conversationId: string,
    processingTimeMs: number
  ): void {
    this.track(AnalyticsEvent.CONVERSATION_COMPLETED, {
      profile_id: profileId,
      conversation_id: conversationId,
      processing_time_ms: processingTimeMs,
    });
  }

  /**
   * Track when a new habit is started
   */
  trackHabitStarted(profileId: string, habitId: string, habitName: string): void {
    this.track(AnalyticsEvent.HABIT_STARTED, {
      profile_id: profileId,
      habit_id: habitId,
      habit_name: habitName,
    });
  }

  /**
   * Track when a habit is logged
   */
  trackHabitLogged(profileId: string, habitId: string): void {
    this.track(AnalyticsEvent.HABIT_LOGGED, {
      profile_id: profileId,
      habit_id: habitId,
    });
  }

  /**
   * Track when feedback is given
   */
  trackFeedbackGiven(rating: number, feedbackType: string): void {
    this.track(AnalyticsEvent.FEEDBACK_GIVEN, {
      rating,
      feedback_type: feedbackType,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

