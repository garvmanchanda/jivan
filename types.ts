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

