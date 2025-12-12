import { Router } from 'express';
import { ProfileService } from '../services/profile.service';
import { VitalModel } from '../models/Vital';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createProfileSchema,
  updateProfileSchema,
  createVitalSchema,
  uuidSchema,
} from '../utils/validators';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /profiles
 * Get all profiles for authenticated user
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const profiles = await ProfileService.getUserProfiles(req.user!.id);

    res.json({
      success: true,
      data: { profiles },
    });
  })
);

/**
 * POST /profiles
 * Create new profile
 */
router.post(
  '/',
  validateRequest({
    body: createProfileSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await ProfileService.createProfile(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: { profile },
    });
  })
);

/**
 * GET /profiles/:id
 * Get single profile with details
 */
router.get(
  '/:id',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const data = await ProfileService.getProfileWithVitals(id, req.user!.id);

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * PATCH /profiles/:id
 * Update profile
 */
router.patch(
  '/:id',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    body: updateProfileSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const profile = await ProfileService.updateProfile(
      id,
      req.user!.id,
      req.body
    );

    res.json({
      success: true,
      data: { profile },
    });
  })
);

/**
 * DELETE /profiles/:id
 * Delete profile
 */
router.delete(
  '/:id',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    await ProfileService.deleteProfile(id, req.user!.id);

    res.status(204).send();
  })
);

/**
 * POST /profiles/:id/vitals
 * Add vital reading for profile
 */
router.post(
  '/:id/vitals',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    body: createVitalSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    // Verify profile ownership
    await ProfileService.getProfile(id, req.user!.id);

    const vital = await VitalModel.create(id, req.body);

    res.status(201).json({
      success: true,
      data: { vital },
    });
  })
);

/**
 * GET /profiles/:id/vitals
 * Get vitals for profile
 */
router.get(
  '/:id/vitals',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    query: Joi.object({
      type: Joi.string().valid('bp', 'hr', 'temp', 'weight', 'glucose', 'spo2'),
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { type, limit, offset } = req.query as any;

    // Verify profile ownership
    await ProfileService.getProfile(id, req.user!.id);

    const vitals = await VitalModel.findByProfileId(id, type, limit, offset);

    res.json({
      success: true,
      data: { vitals },
    });
  })
);

export default router;

