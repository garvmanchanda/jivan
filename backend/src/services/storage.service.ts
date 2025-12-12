import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage service for S3 file operations
 */
class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET_NAME || '';

    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME must be set in environment variables');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    logger.info('Storage service initialized', {
      bucket: this.bucketName,
      region: this.region,
    });
  }

  /**
   * Generate signed URL for upload
   */
  async getUploadUrl(
    fileType: string,
    prefix: string = 'uploads'
  ): Promise<{ uploadUrl: string; fileKey: string; expiresAt: Date }> {
    try {
      const fileKey = `${prefix}/${uuidv4()}-${Date.now()}`;
      const expiresIn = 3600; // 1 hour

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      logger.debug('Generated upload URL', { fileKey, expiresAt });

      return {
        uploadUrl,
        fileKey,
        expiresAt,
      };
    } catch (error) {
      logger.error('Failed to generate upload URL', { error });
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate signed URL for download
   */
  async getDownloadUrl(
    fileKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      logger.debug('Generated download URL', { fileKey });

      return downloadUrl;
    } catch (error) {
      logger.error('Failed to generate download URL', { error, fileKey });
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Upload file directly
   */
  async uploadFile(
    fileKey: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      logger.info('File uploaded successfully', { fileKey });
    } catch (error) {
      logger.error('Failed to upload file', { error, fileKey });
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file body returned');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      logger.debug('File downloaded successfully', { fileKey });

      return buffer;
    } catch (error) {
      logger.error('Failed to download file', { error, fileKey });
      throw new Error('Failed to download file');
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      logger.info('File deleted successfully', { fileKey });
    } catch (error) {
      logger.error('Failed to delete file', { error, fileKey });
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileKey: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileKey: string): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
  }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { error, fileKey });
      throw new Error('Failed to get file metadata');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

