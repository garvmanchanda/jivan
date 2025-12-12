import { Router } from 'express';
import { ReportModel } from '../models/Report';
import { ProfileService } from '../services/profile.service';
import { storageService } from '../services/storage.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { createReportSchema, uuidSchema } from '../utils/validators';
import Joi from 'joi';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /reports/upload-url
 * Get signed URL for report upload
 */
router.post(
  '/upload-url',
  validateRequest({
    body: Joi.object({
      file_type: Joi.string().required(),
      profile_id: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { profile_id } = req.body;

    // Verify profile ownership
    await ProfileService.getProfile(profile_id, req.user!.id);

    const prefix = process.env.S3_REPORTS_PREFIX || 'reports';
    const uploadData = await storageService.getUploadUrl(req.body.file_type, prefix);

    res.json({
      success: true,
      data: uploadData,
    });
  })
);

/**
 * GET /reports/:id
 * Get report details
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

    const report = await ReportModel.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    // Verify ownership
    if (report.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Unauthorized access to report',
        },
      });
    }

    res.json({
      success: true,
      data: { report },
    });
  })
);

/**
 * GET /reports/:id/download
 * Get signed download URL for report
 */
router.get(
  '/:id/download',
  validateRequest({
    params: Joi.object({
      id: uuidSchema.required(),
    }),
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const report = await ReportModel.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    // Verify ownership
    if (report.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Unauthorized access to report',
        },
      });
    }

    const downloadUrl = await storageService.getDownloadUrl(report.file_path);

    res.json({
      success: true,
      data: {
        download_url: downloadUrl,
        expires_in: 3600,
      },
    });
  })
);

/**
 * DELETE /reports/:id
 * Delete report
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

    const deleted = await ReportModel.delete(id, req.user!.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    res.status(204).send();
  })
);

export default router;

