import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase';
import { UserModel } from '../models/User';
import { logger, hashPII } from '../utils/logger';

/**
 * Extend Express Request to include user
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firebase_uid: string;
  };
  correlationId?: string;
}

/**
 * Authentication middleware - verifies Firebase token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);

    // Get user from database
    const user = await UserModel.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firebase_uid: decodedToken.uid,
    };

    // Update last active timestamp (async, don't wait)
    UserModel.updateLastActive(user.id).catch((err) => {
      logger.warn('Failed to update last active timestamp', { error: err });
    });

    logger.debug('User authenticated', {
      userId: hashPII(user.id),
      correlationId: req.correlationId,
    });

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await verifyIdToken(token);
      const user = await UserModel.findByFirebaseUid(decodedToken.uid);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firebase_uid: decodedToken.uid,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Admin role check middleware
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Get Firebase user to check custom claims
    const { getAuth } = await import('../config/firebase');
    const auth = getAuth();
    const firebaseUser = await auth.getUser(req.user.firebase_uid);

    const customClaims = firebaseUser.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Admin check error', { error });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
};

