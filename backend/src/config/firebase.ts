import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY'
      );
    }

    // Decode private key (it might be base64 encoded)
    const decodedPrivateKey = privateKey.includes('\\n')
      ? privateKey.replace(/\\n/g, '\n')
      : Buffer.from(privateKey, 'base64').toString('utf-8');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: decodedPrivateKey,
      }),
    });

    logger.info('Firebase Admin SDK initialized successfully');

    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', { error });
    throw error;
  }
};

/**
 * Get Firebase app instance
 */
export const getFirebaseApp = (): admin.app.App => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  const app = getFirebaseApp();
  return app.auth();
};

/**
 * Verify Firebase ID token
 */
export const verifyIdToken = async (
  idToken: string
): Promise<admin.auth.DecodedIdToken> => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Failed to verify Firebase ID token', { error });
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get user by UID
 */
export const getUserByUid = async (
  uid: string
): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getAuth();
    return await auth.getUser(uid);
  } catch (error) {
    logger.error('Failed to get user by UID', { error, uid });
    throw new Error('User not found');
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (
  email: string
): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getAuth();
    return await auth.getUserByEmail(email);
  } catch (error) {
    logger.error('Failed to get user by email', { error, email });
    throw new Error('User not found');
  }
};

/**
 * Create custom token
 */
export const createCustomToken = async (
  uid: string,
  claims?: object
): Promise<string> => {
  try {
    const auth = getAuth();
    return await auth.createCustomToken(uid, claims);
  } catch (error) {
    logger.error('Failed to create custom token', { error, uid });
    throw new Error('Failed to create token');
  }
};

/**
 * Set custom user claims (for admin roles, etc.)
 */
export const setCustomUserClaims = async (
  uid: string,
  claims: object
): Promise<void> => {
  try {
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);
    logger.info('Custom claims set successfully', { uid });
  } catch (error) {
    logger.error('Failed to set custom claims', { error, uid });
    throw new Error('Failed to set custom claims');
  }
};

/**
 * Delete user from Firebase
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    logger.info('User deleted from Firebase', { uid });
  } catch (error) {
    logger.error('Failed to delete user from Firebase', { error, uid });
    throw new Error('Failed to delete user');
  }
};

