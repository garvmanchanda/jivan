import { query } from '../config/database';
import { Profile, CreateProfileDTO, UpdateProfileDTO, Sex, Relation } from '../../../shared/types/profile.types';

export class ProfileModel {
  /**
   * Create a new profile
   */
  static async create(
    userId: string,
    data: CreateProfileDTO
  ): Promise<Profile> {
    const queryText = `
      INSERT INTO profiles (user_id, name, relation, dob, sex, notes, avatar_url, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      userId,
      data.name,
      data.relation,
      data.dob || null,
      data.sex || Sex.UNKNOWN,
      data.notes || null,
      data.avatar_url || null,
      JSON.stringify(data.metadata || {}),
    ];

    const result = await query<Profile>(queryText, values);
    return result.rows[0];
  }

  /**
   * Find profile by ID
   */
  static async findById(id: string): Promise<Profile | null> {
    const result = await query<Profile>(
      'SELECT * FROM profiles WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all profiles for a user
   */
  static async findByUserId(userId: string): Promise<Profile[]> {
    const result = await query<Profile>(
      `SELECT * FROM profiles 
       WHERE user_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Update profile
   */
  static async update(
    id: string,
    userId: string,
    data: UpdateProfileDTO
  ): Promise<Profile | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.relation !== undefined) {
      updates.push(`relation = $${paramCount++}`);
      values.push(data.relation);
    }

    if (data.dob !== undefined) {
      updates.push(`dob = $${paramCount++}`);
      values.push(data.dob);
    }

    if (data.sex !== undefined) {
      updates.push(`sex = $${paramCount++}`);
      values.push(data.sex);
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatar_url);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id, userId);
    const queryText = `
      UPDATE profiles
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<Profile>(queryText, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete profile
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      `UPDATE profiles 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Check if profile belongs to user
   */
  static async belongsToUser(
    profileId: string,
    userId: string
  ): Promise<boolean> {
    const result = await query(
      'SELECT id FROM profiles WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [profileId, userId]
    );
    return result.rows.length > 0;
  }
}

