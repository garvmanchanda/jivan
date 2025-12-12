import { query } from '../config/database';
import {
  Vital,
  CreateVitalDTO,
  VitalType,
  VitalSource,
} from '../../../shared/types/profile.types';

export class VitalModel {
  /**
   * Create a new vital reading
   */
  static async create(
    profileId: string,
    data: CreateVitalDTO
  ): Promise<Vital> {
    const queryText = `
      INSERT INTO vitals (profile_id, type, value, recorded_at, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      profileId,
      data.type,
      JSON.stringify(data.value),
      data.recorded_at || new Date().toISOString(),
      data.source || VitalSource.MANUAL,
    ];

    const result = await query<Vital>(queryText, values);
    return result.rows[0];
  }

  /**
   * Find vital by ID
   */
  static async findById(id: string): Promise<Vital | null> {
    const result = await query<Vital>('SELECT * FROM vitals WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find all vitals for a profile
   */
  static async findByProfileId(
    profileId: string,
    type?: VitalType,
    limit: number = 100,
    offset: number = 0
  ): Promise<Vital[]> {
    let queryText = `
      SELECT * FROM vitals 
      WHERE profile_id = $1
    `;
    const values: any[] = [profileId];

    if (type) {
      queryText += ` AND type = $2`;
      values.push(type);
    }

    queryText += ` ORDER BY recorded_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await query<Vital>(queryText, values);
    return result.rows;
  }

  /**
   * Get latest vital reading by type
   */
  static async getLatestByType(
    profileId: string,
    type: VitalType
  ): Promise<Vital | null> {
    const result = await query<Vital>(
      `SELECT * FROM vitals 
       WHERE profile_id = $1 AND type = $2 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [profileId, type]
    );
    return result.rows[0] || null;
  }

  /**
   * Get vitals within date range
   */
  static async findByDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date,
    type?: VitalType
  ): Promise<Vital[]> {
    let queryText = `
      SELECT * FROM vitals 
      WHERE profile_id = $1 
        AND recorded_at >= $2 
        AND recorded_at <= $3
    `;
    const values: any[] = [profileId, startDate, endDate];

    if (type) {
      queryText += ` AND type = $4`;
      values.push(type);
    }

    queryText += ` ORDER BY recorded_at DESC`;

    const result = await query<Vital>(queryText, values);
    return result.rows;
  }

  /**
   * Delete vital reading
   */
  static async delete(id: string, profileId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM vitals WHERE id = $1 AND profile_id = $2',
      [id, profileId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get vital summary for profile (latest of each type)
   */
  static async getSummary(profileId: string): Promise<Vital[]> {
    const queryText = `
      SELECT DISTINCT ON (type) *
      FROM vitals
      WHERE profile_id = $1
      ORDER BY type, recorded_at DESC
    `;
    
    const result = await query<Vital>(queryText, [profileId]);
    return result.rows;
  }
}

