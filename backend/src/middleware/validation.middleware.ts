import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Request validation middleware factory
 */
export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        errors.body = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        errors.query = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        errors.params = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
      } else {
        req.params = value;
      }
    }

    // If there are validation errors, return 400
    if (Object.keys(errors).length > 0) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
    }

    next();
  };
};

/**
 * Add correlation ID to requests for tracking
 */
export const addCorrelationId = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const correlationId =
    req.headers['x-correlation-id'] ||
    `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

