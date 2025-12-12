import { Router } from 'express';
import { ConversationService } from '../services/conversation.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createConversationSchema,
  updateFeedbackSchema,
  uuidSchema,
  getUploadUrlSchema,
} from '../utils/validators';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /conversations/upload-url
 * Get signed URL for audio upload
 */
router.get(
  '/upload-url',
  validateRequest({
    query: getUploadUrlSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const uploadData = await ConversationService.getAudioUploadUrl();

    res.json({
      success: true,
      data: uploadData,
    });
  })
);

/**
 * POST /conversations
 * Create new conversation
 */
router.post(
  '/',
  validateRequest({
    body: createConversationSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { conversation, jobId } =
      await ConversationService.createConversation(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      data: {
        conversation,
        job_id: jobId,
      },
    });
  })
);

/**
 * GET /conversations/:id
 * Get conversation details
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

    const conversation = await ConversationService.getConversation(
      id,
      req.user!.id
    );

    res.json({
      success: true,
      data: { conversation },
    });
  })
);

/**
 * GET /conversations/:id/status
 * Get conversation status (for polling)
 */
router.get(
  '/:id/status',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const statusData = await ConversationService.getStatus(id, req.user!.id);

    res.json({
      success: true,
      data: statusData,
    });
  })
);

/**
 * PATCH /conversations/:id/feedback
 * Update conversation feedback
 */
router.patch(
  '/:id/feedback',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
    body: updateFeedbackSchema,
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { rating, reason } = req.body;

    const conversation = await ConversationService.updateFeedback(
      id,
      req.user!.id,
      rating,
      reason
    );

    res.json({
      success: true,
      data: { conversation },
    });
  })
);

/**
 * GET /conversations
 * Get all conversations for authenticated user
 */
router.get(
  '/',
  validateRequest({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { limit, offset } = req.query as any;

    const conversations = await ConversationService.getUserConversations(
      req.user!.id,
      limit,
      offset
    );

    res.json({
      success: true,
      data: { conversations },
    });
  })
);

export default router;

