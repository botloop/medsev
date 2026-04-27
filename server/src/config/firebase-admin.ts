/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase initialization for Firestore, Auth, and Storage
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
try {
  // Check if already initialized
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required');
    }

    // Initialize with environment variables or service account file
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket
      });
      console.log('✅ Firebase Admin initialized with environment variables');
    } else {
      // Fallback to service account key file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './firebase-admin-key.json';
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket
      });
      console.log('✅ Firebase Admin initialized with service account file');
    }
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
  throw error;
}

// Export Firebase Admin services
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Export admin for direct access if needed
export default admin;
