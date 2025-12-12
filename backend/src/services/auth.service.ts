import { UserModel, CreateUserDTO } from '../models/User';
import { verifyIdToken, getUserByUid } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Authentication service
 */
export class AuthService {
  /**
   * Authenticate user with Firebase token
   */
  static async authenticateWithFirebase(firebaseToken: string) {
    try {
      // Verify Firebase token
      const decodedToken = await verifyIdToken(firebaseToken);
      const { uid, email } = decodedToken;

      if (!email) {
        throw new Error('Email not found in Firebase token');
      }

      // Check if user exists in our database
      let user = await UserModel.findByFirebaseUid(uid);

      // If user doesn't exist, create new user
      if (!user) {
        const createUserData: CreateUserDTO = {
          email,
          firebase_uid: uid,
        };

        user = await UserModel.create(createUserData);

        logger.info('New user created', {
          userId: user.id,
          email: user.email,
        });
      } else {
        // Update last active timestamp
        await UserModel.updateLastActive(user.id);
      }

      return {
        user,
        firebaseUid: uid,
      };
    } catch (error) {
      logger.error('Authentication failed', { error });
      throw new Error('Authentication failed');
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Remove sensitive fields
      const { password_hash, ...userProfile } = user;

      return userProfile;
    } catch (error) {
      logger.error('Failed to get user profile', { error, userId });
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(
    userId: string,
    settings: Record<string, any>
  ) {
    try {
      const user = await UserModel.update(userId, { settings });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to update user settings', { error, userId });
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUserAccount(userId: string, firebaseUid: string) {
    try {
      // Delete from our database
      await UserModel.delete(userId);

      // Note: Firebase user deletion should be handled separately
      // or through Firebase Admin SDK if needed

      logger.info('User account deleted', { userId });
    } catch (error) {
      logger.error('Failed to delete user account', { error, userId });
      throw error;
    }
  }

  /**
   * Verify user ownership (used in middleware)
   */
  static async verifyUserOwnership(
    userId: string,
    resourceUserId: string
  ): Promise<boolean> {
    return userId === resourceUserId;
  }
}

