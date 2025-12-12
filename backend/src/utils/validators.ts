import Joi from 'joi';

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = Joi.string().uuid();

// Email validation
export const emailSchema = Joi.string().email().lowercase().trim();

// Phone validation (basic)
export const phoneSchema = Joi.string()
  .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
  .allow(null, '');

// Date validation
export const dateSchema = Joi.date().iso();

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * User validation schemas
 */
export const createUserSchema = Joi.object({
  email: emailSchema.required(),
  phone: phoneSchema,
  firebase_token: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  phone: phoneSchema,
  settings: Joi.object(),
});

/**
 * Profile validation schemas
 */
export const createProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  relation: Joi.string()
    .valid('self', 'spouse', 'child', 'parent', 'sibling', 'other')
    .required(),
  dob: dateSchema.allow(null),
  sex: Joi.string().valid('male', 'female', 'other', 'unknown').required(),
  notes: Joi.string().allow(null, ''),
  avatar_url: Joi.string().uri().allow(null, ''),
  metadata: Joi.object().default({}),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  relation: Joi.string().valid('self', 'spouse', 'child', 'parent', 'sibling', 'other'),
  dob: dateSchema.allow(null),
  sex: Joi.string().valid('male', 'female', 'other', 'unknown'),
  notes: Joi.string().allow(null, ''),
  avatar_url: Joi.string().uri().allow(null, ''),
  metadata: Joi.object(),
});

/**
 * Conversation validation schemas
 */
export const createConversationSchema = Joi.object({
  profile_id: uuidSchema.required(),
  input_type: Joi.string().valid('voice', 'text').required(),
  transcript: Joi.string().when('input_type', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null, ''),
  }),
  audio_s3_key: Joi.string().when('input_type', {
    is: 'voice',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null, ''),
  }),
  metadata: Joi.object(),
});

export const updateFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  reason: Joi.string().allow(null, ''),
});

/**
 * Vital validation schemas
 */
export const createVitalSchema = Joi.object({
  type: Joi.string()
    .valid('bp', 'hr', 'temp', 'weight', 'glucose', 'spo2')
    .required(),
  value: Joi.object().required(),
  recorded_at: dateSchema,
  source: Joi.string().valid('manual', 'device').default('manual'),
});

/**
 * Habit validation schemas
 */
export const createHabitSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow(null, ''),
  frequency: Joi.string().valid('daily', 'weekly').required(),
  start_date: dateSchema.default(new Date().toISOString().split('T')[0]),
  metadata: Joi.object().default({}),
});

export const createHabitLogSchema = Joi.object({
  date: dateSchema.required(),
  completed: Joi.boolean().required(),
  note: Joi.string().allow(null, ''),
});

/**
 * Report validation schemas
 */
export const createReportSchema = Joi.object({
  file_key: Joi.string().required(),
  file_name: Joi.string().required(),
  file_type: Joi.string().required(),
});

/**
 * Storage validation schemas
 */
export const getUploadUrlSchema = Joi.object({
  file_type: Joi.string().required(),
  prefix: Joi.string().valid('audio', 'reports').default('uploads'),
});

/**
 * Validate request body against schema
 */
export const validate = <T>(
  schema: Joi.ObjectSchema,
  data: any
): { value: T; error?: Joi.ValidationError } => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

