import { Router } from 'express';
import { HabitModel, HabitLogModel } from '../models/Habit';
import { ProfileService } from '../services/profile.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createHabitSchema,
  createHabitLogSchema,
  uuidSchema,
} from '../utils/validators';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /habits
 * Get all habits for user's profiles
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const profiles = await ProfileService.getUserProfiles(req.user!.id);
    
    const allHabits = await Promise.all(
      profiles.map(async (profile) => ({
        profile_id: profile.id,
        profile_name: profile.name,
        habits: await HabitModel.findByProfileId(profile.id, true),
      }))
    );

    res.json({
      success: true,
      data: { habits: allHabits },
    });
  })
);

/**
 * GET /habits/:id
 * Get habit details with logs
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

    const habit = await HabitModel.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Habit not found',
        },
      });
    }

    // Verify profile ownership
    await ProfileService.getProfile(habit.profile_id, req.user!.id);

    // Get habit logs and streak
    const logs = await HabitLogModel.findByHabitId(id, 30);
    const streak = await HabitLogModel.calculateStreak(id);
    const completionRate = await HabitLogModel.getCompletionRate(id, 30);

    res.json({
      success: true,
      data: {
        habit,
        logs,
        streak,
        completion_rate: completionRate,
      },
    });
  })
);

/**
 * PATCH /habits/:id
 * Update habit
 */
router.patch(
  '/:id',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    body: Joi.object({
      title: Joi.string().min(1).max(255),
      description: Joi.string().allow(null, ''),
      active: Joi.boolean(),
      metadata: Joi.object(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const habit = await HabitModel.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Habit not found',
        },
      });
    }

    // Verify profile ownership
    await ProfileService.getProfile(habit.profile_id, req.user!.id);

    const updated = await HabitModel.update(id, req.body);

    res.json({
      success: true,
      data: { habit: updated },
    });
  })
);

/**
 * DELETE /habits/:id
 * Delete (deactivate) habit
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

    const habit = await HabitModel.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Habit not found',
        },
      });
    }

    // Verify profile ownership
    await ProfileService.getProfile(habit.profile_id, req.user!.id);

    await HabitModel.delete(id);

    res.status(204).send();
  })
);

/**
 * POST /habits/:id/log
 * Log habit completion
 */
router.post(
  '/:id/log',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    body: createHabitLogSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const habit = await HabitModel.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Habit not found',
        },
      });
    }

    // Verify profile ownership
    await ProfileService.getProfile(habit.profile_id, req.user!.id);

    const log = await HabitLogModel.upsert(habit.id, habit.profile_id, req.body);

    res.status(201).json({
      success: true,
      data: { log },
    });
  })
);

/**
 * GET /habits/:id/logs
 * Get habit logs
 */
router.get(
  '/:id/logs',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(365).default(30),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { limit } = req.query as any;

    const habit = await HabitModel.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Habit not found',
        },
      });
    }

    // Verify profile ownership
    await ProfileService.getProfile(habit.profile_id, req.user!.id);

    const logs = await HabitLogModel.findByHabitId(id, limit);

    res.json({
      success: true,
      data: { logs },
    });
  })
);

export default router;

