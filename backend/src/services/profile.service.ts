import { ProfileModel } from '../models/Profile';
import { VitalModel } from '../models/Vital';
import {
  Profile,
  CreateProfileDTO,
  UpdateProfileDTO,
} from '../../../shared/types/profile.types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

/**
 * Profile service for business logic
 */
export class ProfileService {
  /**
   * Create new profile
   */
  static async createProfile(
    userId: string,
    data: CreateProfileDTO
  ): Promise<Profile> {
    try {
      const profile = await ProfileModel.create(userId, data);

      logger.info('Profile created', {
        profileId: profile.id,
        userId,
      });

      return profile;
    } catch (error) {
      logger.error('Failed to create profile', { error, userId });
      throw new AppError('Failed to create profile', 500);
    }
  }

  /**
   * Get profile by ID with authorization check
   */
  static async getProfile(
    profileId: string,
    userId: string
  ): Promise<Profile> {
    const profile = await ProfileModel.findById(profileId);

    if (!profile) {
      throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Check ownership
    if (profile.user_id !== userId) {
      throw new AppError('Unauthorized access to profile', 403, 'FORBIDDEN');
    }

    return profile;
  }

  /**
   * Get all profiles for a user
   */
  static async getUserProfiles(userId: string): Promise<Profile[]> {
    try {
      const profiles = await ProfileModel.findByUserId(userId);
      return profiles;
    } catch (error) {
      logger.error('Failed to get user profiles', { error, userId });
      throw new AppError('Failed to get profiles', 500);
    }
  }

  /**
   * Get profile with vitals summary
   */
  static async getProfileWithVitals(
    profileId: string,
    userId: string
  ): Promise<{
    profile: Profile;
    vitals: any[];
  }> {
    const profile = await this.getProfile(profileId, userId);
    const vitals = await VitalModel.getSummary(profileId);

    return {
      profile,
      vitals,
    };
  }

  /**
   * Update profile
   */
  static async updateProfile(
    profileId: string,
    userId: string,
    data: UpdateProfileDTO
  ): Promise<Profile> {
    // Verify ownership first
    await this.getProfile(profileId, userId);

    const updatedProfile = await ProfileModel.update(profileId, userId, data);

    if (!updatedProfile) {
      throw new AppError('Failed to update profile', 500);
    }

    logger.info('Profile updated', { profileId, userId });

    return updatedProfile;
  }

  /**
   * Delete profile
   */
  static async deleteProfile(
    profileId: string,
    userId: string
  ): Promise<void> {
    // Verify ownership first
    await this.getProfile(profileId, userId);

    const deleted = await ProfileModel.delete(profileId, userId);

    if (!deleted) {
      throw new AppError('Failed to delete profile', 500);
    }

    logger.info('Profile deleted', { profileId, userId });
  }

  /**
   * Verify profile ownership (helper)
   */
  static async verifyOwnership(
    profileId: string,
    userId: string
  ): Promise<boolean> {
    return await ProfileModel.belongsToUser(profileId, userId);
  }
}

