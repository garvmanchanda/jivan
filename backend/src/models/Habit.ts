import { query } from '../config/database';
import {
  Habit,
  HabitLog,
  CreateHabitDTO,
  CreateHabitLogDTO,
  HabitFrequency,
} from '../../../shared/types/api.types';

export class HabitModel {
  /**
   * Create a new habit
   */
  static async create(
    profileId: string,
    data: CreateHabitDTO
  ): Promise<Habit> {
    const queryText = `
      INSERT INTO habits (profile_id, title, description, frequency, start_date, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      profileId,
      data.title,
      data.description || null,
      data.frequency,
      data.start_date || new Date().toISOString().split('T')[0],
      JSON.stringify(data.metadata || {}),
    ];

    const result = await query<Habit>(queryText, values);
    return result.rows[0];
  }

  /**
   * Find habit by ID
   */
  static async findById(id: string): Promise<Habit | null> {
    const result = await query<Habit>('SELECT * FROM habits WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find active habits for a profile
   */
  static async findByProfileId(
    profileId: string,
    activeOnly: boolean = true
  ): Promise<Habit[]> {
    let queryText = 'SELECT * FROM habits WHERE profile_id = $1';
    
    if (activeOnly) {
      queryText += ' AND active = true';
    }
    
    queryText += ' ORDER BY created_at DESC';

    const result = await query<Habit>(queryText, [profileId]);
    return result.rows;
  }

  /**
   * Update habit
   */
  static async update(
    id: string,
    updates: Partial<Habit>
  ): Promise<Habit | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.active !== undefined) {
      updateFields.push(`active = $${paramCount++}`);
      values.push(updates.active);
    }

    if (updates.metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const queryText = `
      UPDATE habits
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query<Habit>(queryText, values);
    return result.rows[0] || null;
  }

  /**
   * Delete habit (deactivate)
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query('UPDATE habits SET active = false WHERE id = $1', [
      id,
    ]);
    return (result.rowCount || 0) > 0;
  }
}

export class HabitLogModel {
  /**
   * Create or update habit log
   */
  static async upsert(
    habitId: string,
    profileId: string,
    data: CreateHabitLogDTO
  ): Promise<HabitLog> {
    const queryText = `
      INSERT INTO habit_logs (habit_id, profile_id, date, completed, note)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (habit_id, date)
      DO UPDATE SET completed = $4, note = $5
      RETURNING *
    `;
    
    const values = [
      habitId,
      profileId,
      data.date,
      data.completed,
      data.note || null,
    ];

    const result = await query<HabitLog>(queryText, values);
    return result.rows[0];
  }

  /**
   * Get habit logs for date range
   */
  static async findByHabitAndDateRange(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    const queryText = `
      SELECT * FROM habit_logs
      WHERE habit_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date DESC
    `;
    
    const result = await query<HabitLog>(queryText, [
      habitId,
      startDate,
      endDate,
    ]);
    return result.rows;
  }

  /**
   * Get all logs for a habit
   */
  static async findByHabitId(
    habitId: string,
    limit: number = 30
  ): Promise<HabitLog[]> {
    const result = await query<HabitLog>(
      `SELECT * FROM habit_logs 
       WHERE habit_id = $1 
       ORDER BY date DESC 
       LIMIT $2`,
      [habitId, limit]
    );
    return result.rows;
  }

  /**
   * Calculate streak for a habit
   */
  static async calculateStreak(habitId: string): Promise<number> {
    const queryText = `
      WITH consecutive_days AS (
        SELECT 
          date,
          completed,
          date - ROW_NUMBER() OVER (ORDER BY date)::int AS grp
        FROM habit_logs
        WHERE habit_id = $1 AND completed = true
        ORDER BY date DESC
      ),
      streak_groups AS (
        SELECT 
          grp,
          COUNT(*) as streak_length,
          MAX(date) as latest_date
        FROM consecutive_days
        GROUP BY grp
        ORDER BY latest_date DESC
        LIMIT 1
      )
      SELECT COALESCE(MAX(streak_length), 0) as streak
      FROM streak_groups
      WHERE latest_date = CURRENT_DATE OR latest_date = CURRENT_DATE - 1
    `;
    
    const result = await query<{ streak: number }>(queryText, [habitId]);
    return result.rows[0]?.streak || 0;
  }

  /**
   * Get completion rate for a habit
   */
  static async getCompletionRate(
    habitId: string,
    days: number = 30
  ): Promise<number> {
    const queryText = `
      SELECT 
        COUNT(*) FILTER (WHERE completed = true) as completed_count,
        COUNT(*) as total_count
      FROM habit_logs
      WHERE habit_id = $1
        AND date >= CURRENT_DATE - $2
    `;
    
    const result = await query<{
      completed_count: string;
      total_count: string;
    }>(queryText, [habitId, days]);
    
    const completed = parseInt(result.rows[0]?.completed_count || '0', 10);
    const total = parseInt(result.rows[0]?.total_count || '0', 10);
    
    return total > 0 ? (completed / total) * 100 : 0;
  }
}

