/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase initialization for Firestore, Auth, and Storage
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const FIREBASE_PROJECT_ID = 'personnel-management-sys-b9278';
const FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@personnel-management-sys-b9278.iam.gserviceaccount.com';
const FIREBASE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCwTLBzwR4d1XVa
3AWy2n1P/kWAhkKxxchTkiIynVOrAyOpEeITBeTxHJWUn9iY0pJVr6QiMM7fp31k
4f6Kw8JF3NiOPavUtgYSF+o2LNJr9ZQb8ruE1uOpdaZAmIO3inSQ1g6l0VpMboHX
EdrVuLOu5iZmDraqX76GivEVQEnSRsey/zDy6Qlr63xevQNBb1JzpTLjsAJRR93c
4vQ4Xr7Y7ZrIM+vl6ggZ6/F7HM+v/yqY4T4ebcRpDvqG9W6yxqP4gbmMyje8kVLn
qwQvLJFRw8FD7fcWfpy8tnENZwbpddhKUijzErAis8zOaO8rNlIgAiwzLykBx2Yp
tRJPkGf7AgMBAAECgf92mRZ1GJLotiilnGy7ezrRizv+5JkmZ31v8fyrAOTeo51e
sK4UjGoSkevcAIjdBFI/oo4sNcJolD7GlMi2aJXy7AKaG/GzP5Lp+G3Ns66tD7md
CXYXN0DgpZ7IOgNcsXwxcFse6wc4MVETHA3jhhvIlpxratnbaN2QbZc0IwFJ9QMe
XN2l2hs7FcdIXPntE+IHJopbjO9V9T569JA1YTsbr4WXKlGFcRLfAUx1TvaKne0v
e8z85SYb98flfo90GaGVYt6PmT6+dJV2Amkc2NRgesQjWTwUt2/gJzDbLjAQ+z3q
CaS51DAxd84LvCZSWdqYbFdR9dbg0v+zNym3DoECgYEA3wQAKH9A2ADqtUGukBH3
eKTG9n9X+nW0TS4rlpUKZ97E9mrTau6IxNVjfSwpuRpnBsHHjsGx0pZn+sXnsRX8
rB295WqO1IgwQjTJpHo7mEIkoMm4GfF3bzbm8EXBiFc7G/bQwdAiI/Ae3jp3Gb/E
ROP8cl7YYWvT1CdP72BmN0ECgYEAyl/jGp+1u6CrgiiIr/buCQPssXqQhTbKowF9
TEj4XkvlIiHxytMvlf0mpW6prm5nUoHY4dCUglt/9ZvF+LaI/V4EpjBX1QK/3DZb
I0crPI3HDMnYTQso1K0ZJZCAeG7p8qMKcLLOxuzvd00wWvJD01cgHG/jCDZEBkkF
VERirDsCgYAmLjUoucCMOnv0VC5ik/DeQredc+fIBWa83+6udQ23AriNx3Qylmvr
5uyFfY4XFqIU0hAsLJUZDI74q/EirDT58o2UPU3+rOI2M3tiIVsakhhbPq26I1Dj
RW78K7UadnS0MOlEhTGTHYTrXu8NBXvAn5eUrRA2fZNieuiAfuyBAQKBgEFy71St
8C1FEhKfH02hU2xQ+5yOYezjQnejRK2GL+T3MJxwU+1fjVU5sOTxvCiwhfPWEJk/
Rrg99U0uWsFL71PZszE4Ez/NitUiMylem+oShBxrruuDv2nArZBLgnDwlfKlrfuy
qFMHT47KxOe00CCqXbU0rjz6p9dMiE+vaiX/AoGBALhh+V6aNoIno5bowr2826zI
rhXGul6UhayJr2a06GhZBVho3hjuRsZAYY8F1QjVbt4x3BxZ9J03q663JolCEc+H
Al6bV79U7T0tnU+A0ZcIEDaqDsvIJTkCCL/uGIXh2aTmpjhRk1D6wWTTNqA/Jas0
zl5MYVvZdClR8GnoWkS7
-----END PRIVATE KEY-----`;

// Initialize Firebase Admin SDK
try {
  // Check if already initialized
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || FIREBASE_PRIVATE_KEY;
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
