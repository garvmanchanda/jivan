/**
 * Profile-related TypeScript type definitions
 * Shared between backend and mobile
 */

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

export enum Relation {
  SELF = 'self',
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  OTHER = 'other',
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  relation: Relation;
  dob: string | null;
  sex: Sex;
  notes: string | null;
  avatar_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileDTO {
  name: string;
  relation: Relation;
  dob?: string;
  sex: Sex;
  notes?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProfileDTO {
  name?: string;
  relation?: Relation;
  dob?: string;
  sex?: Sex;
  notes?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export enum VitalType {
  BP = 'bp',
  HR = 'hr',
  TEMP = 'temp',
  WEIGHT = 'weight',
  GLUCOSE = 'glucose',
  SPO2 = 'spo2',
}

export enum VitalSource {
  MANUAL = 'manual',
  DEVICE = 'device',
}

export interface Vital {
  id: string;
  profile_id: string;
  type: VitalType;
  value: Record<string, any>;
  recorded_at: string;
  source: VitalSource;
}

export interface CreateVitalDTO {
  type: VitalType;
  value: Record<string, any>;
  recorded_at?: string;
  source?: VitalSource;
}

