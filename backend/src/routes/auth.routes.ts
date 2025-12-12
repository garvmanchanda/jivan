import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import Joi from 'joi';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user with Firebase token
 */
router.post(
  '/login',
  validateRequest({
    body: Joi.object({
      firebase_token: Joi.string().required(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { firebase_token } = req.body;

    const { user } = await AuthService.authenticateWithFirebase(firebase_token);

    logger.info('User logged in', { userId: user.id });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
        },
      },
    });
  })
);

/**
 * POST /auth/signup
 * Sign up new user with Firebase token
 */
router.post(
  '/signup',
  validateRequest({
    body: Joi.object({
      firebase_token: Joi.string().required(),
      phone: Joi.string().allow(null, ''),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { firebase_token } = req.body;

    const { user } = await AuthService.authenticateWithFirebase(firebase_token);

    logger.info('User signed up', { userId: user.id });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
        },
      },
    });
  })
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: any, res) => {
    const user = await AuthService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * PATCH /auth/settings
 * Update user settings
 */
router.patch(
  '/settings',
  authenticate,
  validateRequest({
    body: Joi.object({
      settings: Joi.object().required(),
    }),
  }),
  asyncHandler(async (req: any, res) => {
    const { settings } = req.body;

    const user = await AuthService.updateUserSettings(req.user.id, settings);

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * DELETE /auth/account
 * Delete user account
 */
router.delete(
  '/account',
  authenticate,
  asyncHandler(async (req: any, res) => {
    await AuthService.deleteUserAccount(req.user.id, req.user.firebase_uid);

    res.json({
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    });
  })
);

export default router;

