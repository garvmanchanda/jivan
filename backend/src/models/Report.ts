import { query } from '../config/database';
import { Report, CreateReportDTO } from '../../../shared/types/api.types';

export class ReportModel {
  /**
   * Create a new report
   */
  static async create(
    userId: string,
    profileId: string,
    data: CreateReportDTO
  ): Promise<Report> {
    const queryText = `
      INSERT INTO reports (user_id, profile_id, file_path, file_name, file_type, ocr_status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;
    
    const values = [userId, profileId, data.file_key, data.file_name, data.file_type];

    const result = await query<Report>(queryText, values);
    return result.rows[0];
  }

  /**
   * Find report by ID
   */
  static async findById(id: string): Promise<Report | null> {
    const result = await query<Report>('SELECT * FROM reports WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find reports by profile ID
   */
  static async findByProfileId(
    profileId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Report[]> {
    const result = await query<Report>(
      `SELECT * FROM reports 
       WHERE profile_id = $1 
       ORDER BY uploaded_at DESC 
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Update OCR status
   */
  static async updateOCRStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<Report | null> {
    const result = await query<Report>(
      'UPDATE reports SET ocr_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update with OCR results
   */
  static async updateWithOCR(
    id: string,
    extractedText: string,
    metadata: Record<string, any>
  ): Promise<Report | null> {
    const queryText = `
      UPDATE reports
      SET 
        ocr_extracted_text = $1,
        ocr_metadata = $2,
        ocr_status = 'completed'
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await query<Report>(queryText, [
      extractedText,
      JSON.stringify(metadata),
      id,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Search reports by OCR text
   */
  static async searchByText(
    profileId: string,
    searchText: string,
    limit: number = 20
  ): Promise<Report[]> {
    const queryText = `
      SELECT * FROM reports
      WHERE profile_id = $1
        AND ocr_extracted_text IS NOT NULL
        AND to_tsvector('english', ocr_extracted_text) @@ plainto_tsquery('english', $2)
      ORDER BY uploaded_at DESC
      LIMIT $3
    `;
    
    const result = await query<Report>(queryText, [
      profileId,
      searchText,
      limit,
    ]);
    return result.rows;
  }

  /**
   * Delete report
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM reports WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Count reports by profile
   */
  static async countByProfile(profileId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reports WHERE profile_id = $1',
      [profileId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

