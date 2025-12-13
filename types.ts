// Core data types for Jivan app

export interface Profile {
  id: string;
  name: string;
  age: number;
  relation: string;
  avatar?: string;
}

export interface Vital {
  type: 'weight' | 'height' | 'age' | 'sleep' | 'water' | 'alcohol' | 'cigarettes' | 'steps';
  value: number;
  unit: string;
  date: string;
  isDaily?: boolean; // true for daily tracking (sleep, water, alcohol, cigarettes, steps)
}

export interface Habit {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

export interface Conversation {
  id: string;
  profileId: string;
  query: string;
  summary: string;
  recommendations: string[];
  redFlag?: string;
  timestamp: string;
}

export interface AIResponse {
  summary: string;
  causes: string[];
  selfCare: string[];
  redFlags: string[];
  recommendations: string[];
}

// V2 Response with memory and context
export interface AIResponseV2 {
  reflection: string;
  interpretation: string;
  guidance: string[];
  redFlags: string[];
  followUp: string;
  recommendations: string[];
}

// Active Issue tracking
export interface ActiveIssue {
  id: string;
  profileId: string;
  label: string;
  status: 'active' | 'improving' | 'resolved' | 'monitoring';
  severity: 'mild' | 'moderate' | 'severe';
  firstReportedAt: string;
  lastMentionedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Insight Memory
export interface Insight {
  id: string;
  profileId: string;
  insight: string;
  confidence: number; // 0 to 1
  relatedIssueId?: string;
  supportingEventIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Event Memory
export interface EventMemory {
  id: string;
  profileId: string;
  eventType: 'conversation' | 'vitals' | 'report_finding' | 'device_vital';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

// Issue History
export interface IssueHistory {
  id: string;
  issueId: string;
  oldStatus?: string;
  newStatus: string;
  oldSeverity?: string;
  newSeverity?: string;
  changedAt: string;
  reason?: string;
}

