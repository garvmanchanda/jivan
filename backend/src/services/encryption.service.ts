import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Encryption service for sensitive data using AES-256-CBC
 */
class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;
  private iv: Buffer;

  constructor() {
    // Get encryption key and IV from environment
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const encryptionIV = process.env.ENCRYPTION_IV;

    if (!encryptionKey || !encryptionIV) {
      throw new Error(
        'ENCRYPTION_KEY and ENCRYPTION_IV must be set in environment variables'
      );
    }

    // Convert hex strings to buffers
    this.key = Buffer.from(encryptionKey, 'hex');
    this.iv = Buffer.from(encryptionIV, 'hex');

    // Validate key and IV lengths
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }

    if (this.iv.length !== 16) {
      throw new Error('ENCRYPTION_IV must be 16 bytes (32 hex characters)');
    }

    logger.info('Encryption service initialized');
  }

  /**
   * Encrypt text data
   */
  encrypt(text: string): string {
    try {
      if (!text) {
        return '';
      }

      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt encrypted data
   */
  decrypt(encryptedText: string): string {
    try {
      if (!encryptedText) {
        return '';
      }

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        this.iv
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password using bcrypt-style hashing
   */
  async hashPassword(password: string): Promise<string> {
    // Using PBKDF2 for password hashing
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data for non-reversible storage (e.g., for anonymization)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

