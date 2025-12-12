import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profiles.routes';
import conversationRoutes from './conversations.routes';
import habitRoutes from './habits.routes';
import reportRoutes from './reports.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/conversations', conversationRoutes);
router.use('/habits', habitRoutes);
router.use('/reports', reportRoutes);

// Add habits routes under profiles as well (REST convention)
import { HabitModel } from '../models/Habit';
import { ProfileService } from '../services/profile.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { createHabitSchema, uuidSchema } from '../utils/validators';
import { createReportSchema } from '../utils/validators';
import { ReportModel } from '../models/Report';
import { addOCRJob } from '../config/queue';
import Joi from 'joi';

// Profile-specific habit routes
router.post(
  '/profiles/:profileId/habits',
  authenticate,
  validateRequest({
    params: Joi.object({
      profileId: uuidSchema.required(),
    }),
    body: createHabitSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profileId } = req.params;

    // Verify profile ownership
    await ProfileService.getProfile(profileId, req.user!.id);

    const habit = await HabitModel.create(profileId, req.body);

    res.status(201).json({
      success: true,
      data: { habit },
    });
  })
);

router.get(
  '/profiles/:profileId/habits',
  authenticate,
  validateRequest({
    params: Joi.object({
      profileId: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profileId } = req.params;

    // Verify profile ownership
    await ProfileService.getProfile(profileId, req.user!.id);

    const habits = await HabitModel.findByProfileId(profileId, true);

    res.json({
      success: true,
      data: { habits },
    });
  })
);

// Profile-specific report routes
router.post(
  '/profiles/:profileId/reports',
  authenticate,
  validateRequest({
    params: Joi.object({
      profileId: uuidSchema.required(),
    }),
    body: createReportSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profileId } = req.params;

    // Verify profile ownership
    await ProfileService.getProfile(profileId, req.user!.id);

    const report = await ReportModel.create(req.user!.id, profileId, req.body);

    // Enqueue OCR job
    await addOCRJob(report.id);

    res.status(201).json({
      success: true,
      data: { report },
    });
  })
);

router.get(
  '/profiles/:profileId/reports',
  authenticate,
  validateRequest({
    params: Joi.object({
      profileId: uuidSchema.required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profileId } = req.params;
    const { limit, offset } = req.query as any;

    // Verify profile ownership
    await ProfileService.getProfile(profileId, req.user!.id);

    const reports = await ReportModel.findByProfileId(profileId, limit, offset);

    res.json({
      success: true,
      data: { reports },
    });
  })
);

// Profile-specific conversation routes
router.get(
  '/profiles/:profileId/conversations',
  authenticate,
  validateRequest({
    params: Joi.object({
      profileId: uuidSchema.required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profileId } = req.params;
    const { limit, offset } = req.query as any;

    const { conversations, total } = await require('../services/conversation.service')
      .ConversationService.getProfileConversations(
        profileId,
        req.user!.id,
        limit,
        offset
      );

    res.json({
      success: true,
      data: { conversations, total },
    });
  })
);

export default router;

