import { query, getClient } from '../config/database';
import { PoolClient } from 'pg';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  firebase_uid: string | null;
  settings: Record<string, any>;
  created_at: Date;
  last_active_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  phone?: string;
  password_hash?: string;
  firebase_uid?: string;
  settings?: Record<string, any>;
}

export interface UpdateUserDTO {
  phone?: string;
  settings?: Record<string, any>;
  last_active_at?: Date;
}

export class UserModel {
  /**
   * Create a new user
   */
  static async create(data: CreateUserDTO, client?: PoolClient): Promise<User> {
    const queryText = `
      INSERT INTO users (email, phone, password_hash, firebase_uid, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.email,
      data.phone || null,
      data.password_hash || null,
      data.firebase_uid || null,
      JSON.stringify(data.settings || {}),
    ];

    const result = client
      ? await client.query<User>(queryText, values)
      : await query<User>(queryText, values);
    
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by Firebase UID
   */
  static async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    return result.rows[0] || null;
  }

  /**
   * Update user
   */
  static async update(
    id: string,
    data: UpdateUserDTO
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }

    if (data.settings !== undefined) {
      updates.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(data.settings));
    }

    if (data.last_active_at !== undefined) {
      updates.push(`last_active_at = $${paramCount++}`);
      values.push(data.last_active_at);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const queryText = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query<User>(queryText, values);
    return result.rows[0] || null;
  }

  /**
   * Delete user (hard delete)
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Update last active timestamp
   */
  static async updateLastActive(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
}

