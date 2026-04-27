/**
 * Authentication Controller
 * Handle login, logout, token refresh, and user management
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { auth, db } from '../config/firebase-admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pcg-personnel-system-super-secret-jwt-key-2026-change-in-production';
import type { User, JWTPayload, LoginResponse } from '../../../shared/types/auth.types.js';
import { getRolePermissions } from '../../../shared/constants/permissions.js';
import { createActivityLog } from '../services/activityLog.service.js';
import { sendMessage, sendUnlinkPromptMessage } from '../services/chat.service.js';
import { sendReEnlistmentEligibleEmail, sendReEnlistmentUrgentEmail } from '../services/email.service.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * Check ETE thresholds and send emails if not yet sent
 */
const checkEteNotifications = async (user: User, personnelId: string): Promise<void> => {
  const snap = await db.collection('personnel').doc(personnelId).get();
  if (!snap.exists) return;
  const p = snap.data()!;
  if (!p.ete || !user.email) return;

  const eteMs = new Date(p.ete).getTime();
  const daysToETE = Math.floor((eteMs - Date.now()) / 86400000);
  if (daysToETE < 0) return; // already expired

  const updates: Record<string, boolean> = {};

  if (daysToETE <= 365 && !p.reenlistEligibleEmailSent) {
    await sendReEnlistmentEligibleEmail(user.email, user.displayName, p.ete).catch(() => {});
    updates.reenlistEligibleEmailSent = true;
  }
  if (daysToETE <= 180 && !p.reenlistUrgentEmailSent) {
    await sendReEnlistmentUrgentEmail(user.email, user.displayName, p.ete).catch(() => {});
    updates.reenlistUrgentEmailSent = true;
  }

  if (Object.keys(updates).length > 0) {
    await db.collection('personnel').doc(personnelId).update(updates);
  }
};

/**
 * Login with Google - Verify Firebase ID token and return JWT
 */
export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get or create user in Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let user: User;

    if (!userDoc.exists) {
      // Create new user with role based on email
      const firebaseUser = await auth.getUser(uid);
      const userEmail = firebaseUser.email || '';

      // Assign admin role to specific email, viewer to all others
      const role = userEmail === 'longlite8867@gmail.com' ? 'admin' : 'viewer';

      user = {
        uid,
        email: userEmail,
        displayName: firebaseUser.displayName || userEmail || 'Unknown User',
        photoURL: firebaseUser.photoURL,
        role,
        permissions: getRolePermissions(role),
        profileCompleted: role === 'admin' ? true : false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await userRef.set(user);

      // Send automated welcome message from admin to new non-admin users
      if (user.role !== 'admin') {
        try {
          // Find admin user
          const adminSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .limit(1)
            .get();

          if (!adminSnapshot.empty) {
            const adminDoc = adminSnapshot.docs[0];
            const adminData = adminDoc.data() as User;

            // Send welcome message from admin
            await sendMessage(
              adminData.uid,
              adminData.displayName,
              adminData.role,
              user.uid,
              'Welcome to the Philippine Coast Guard Medical Service Eastern Visayas (MEDS-EV) System. How may we assist you today? Please state your inquiry or concern below. Thank you.'
            );
          }
        } catch (error) {
          console.error('Failed to send welcome message:', error);
          // Don't fail login if welcome message fails
        }
      }
    } else {
      // Update existing user
      user = userDoc.data() as User;

      // Check if role needs to be updated for admin email
      const shouldBeAdmin = user.email === 'longlite8867@gmail.com';
      const currentRole = user.role;
      const correctRole = shouldBeAdmin ? 'admin' : 'viewer';

      if (currentRole !== correctRole) {
        // Update role and permissions
        user.role = correctRole;
        user.permissions = getRolePermissions(correctRole);

        await userRef.update({
          role: correctRole,
          permissions: getRolePermissions(correctRole),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Always refresh permissions so new permissions added to role definitions take effect on next login
        user.permissions = getRolePermissions(user.role);
        await userRef.update({
          permissions: getRolePermissions(user.role),
          lastLogin: new Date().toISOString()
        });
      }
    }

    // Generate JWT token
    const jwtPayload: JWTPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    });

    const response: LoginResponse = {
      token,
      user,
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    };

    // Log login activity
    await createActivityLog({
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      action: 'login',
      resource: 'auth',
      description: `User logged in with Google (${user.role})`,
      metadata: { loginMethod: 'google', role: user.role }
    });

    res.json(response);

    // ETE notification check (fire-and-forget, non-blocking)
    if (user.role === 'viewer' && (user as any).linkedPersonnelId) {
      checkEteNotifications(user, (user as any).linkedPersonnelId).catch(() => {});
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

/**
 * Login with Serial Number - Custom authentication for medical personnel
 */
export const loginWithSerial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serialNumber } = req.body;

    if (!serialNumber) {
      res.status(400).json({ error: 'Serial number is required' });
      return;
    }

    // Query users collection for matching serial number
    const usersSnapshot = await db.collection('users')
      .where('serialNumber', '==', serialNumber.toUpperCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(401).json({ error: 'Invalid serial number' });
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;

    // Refresh permissions so new role permissions take effect on next login
    user.permissions = getRolePermissions(user.role);
    await db.collection('users').doc(user.uid).update({
      permissions: getRolePermissions(user.role),
      lastLogin: new Date().toISOString()
    });

    // Generate JWT token
    const jwtPayload: JWTPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    });

    const response: LoginResponse = {
      token,
      user,
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    };

    // Log login activity
    await createActivityLog({
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      action: 'login',
      resource: 'auth',
      description: `User logged in with serial number (${user.role})`,
      metadata: { loginMethod: 'serial', serialNumber: serialNumber.toUpperCase(), role: user.role }
    });

    res.json(response);
  } catch (error) {
    console.error('Serial login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Login with username + password (for mobile app)
 */
export const loginWithPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const snapshot = await db.collection('users')
      .where('loginUsername', '==', username.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as User;

    if (user.loginPassword !== password) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    user.permissions = getRolePermissions(user.role);
    await db.collection('users').doc(user.uid).update({
      permissions: getRolePermissions(user.role),
      lastLogin: new Date().toISOString()
    });

    const token = jwt.sign(
      { uid: user.uid, email: user.email, displayName: user.displayName, role: user.role, permissions: user.permissions } as JWTPayload,
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRE || '24h') as any }
    );

    await createActivityLog({
      userId: user.uid, userName: user.displayName, userEmail: user.email,
      action: 'login', resource: 'auth',
      description: `User logged in with username/password (${user.role})`,
      metadata: { loginMethod: 'password', username, role: user.role }
    });

    res.json({ token, user, expiresIn: process.env.JWT_EXPIRE || '24h' } as LoginResponse);
  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userDoc.data() as User;
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get fresh user data
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userDoc.data() as User;

    // Generate new JWT token
    const jwtPayload: JWTPayload = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    });

    res.json({
      token,
      expiresIn: (process.env.JWT_EXPIRE || '24h') as any
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

/**
 * Logout - Client-side operation, but log the activity
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a JWT-based system, logout is mainly client-side (removing the token)
    // But we can log the activity here
    if (req.user) {
      // Get user info from Firestore for displayName
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      const user = userDoc.exists ? userDoc.data() as User : null;

      await createActivityLog({
        userId: req.user.uid,
        userName: user?.displayName || req.user.email,
        userEmail: req.user.email,
        action: 'logout',
        resource: 'auth',
        description: `User logged out`,
        metadata: { role: req.user.role }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Update user profile (display name)
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { displayName } = req.body;

    if (!displayName || displayName.trim().length === 0) {
      res.status(400).json({ error: 'Display name is required' });
      return;
    }

    if (displayName.trim().length > 50) {
      res.status(400).json({ error: 'Display name must be less than 50 characters' });
      return;
    }

    // Update user displayName in Firestore
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      displayName: displayName.trim()
    });

    // Get updated user
    const userDoc = await userRef.get();
    const user = userDoc.data() as User;

    // Log the activity
    await createActivityLog({
      userId: req.user.uid,
      userName: user.displayName,
      userEmail: user.email,
      action: 'update',
      resource: 'profile',
      description: `Updated display name to "${displayName.trim()}"`,
      metadata: { previousName: req.user.email, newName: displayName.trim() }
    });

    res.json({
      message: 'Display name updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Complete new user profile setup
 */
export const completeProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { displayName } = req.body;

    if (!displayName || displayName.trim().length === 0) {
      res.status(400).json({ error: 'Display name is required' });
      return;
    }

    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      displayName: displayName.trim(),
      profileCompleted: true
    });

    const userDoc = await userRef.get();
    const user = userDoc.data() as User;

    res.json({ message: 'Profile completed', user });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
};

/**
 * Unlink personnel record from user account
 */
export const unlinkPersonnel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Update user - remove linkedPersonnelId and serialNumber
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const wasLinked = userData?.linkedPersonnelId || false;

    await userRef.update({
      linkedPersonnelId: null,
      serialNumber: null,
      pendingPersonnelConfirmation: null
    });

    // Get updated user
    const updatedUserDoc = await userRef.get();
    const user = updatedUserDoc.data() as User;

    // Log the activity and send re-link prompt
    if (wasLinked) {
      await createActivityLog({
        userId: req.user.uid,
        userName: user.displayName,
        userEmail: user.email,
        action: 'update',
        resource: 'profile',
        description: `Unlinked personnel record`,
        metadata: { previousLinkedId: wasLinked }
      });

      // Send automated message prompting the viewer to re-link
      try {
        await sendUnlinkPromptMessage(req.user.uid);
      } catch (error) {
        console.error('Failed to send unlink prompt message:', error);
      }
    }

    res.json({
      message: 'Personnel record unlinked successfully',
      user
    });
  } catch (error) {
    console.error('Unlink personnel error:', error);
    res.status(500).json({ error: 'Failed to unlink personnel record' });
  }
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const file = req.file as Express.Multer.File | undefined;
    if (!file) { res.status(400).json({ error: 'No file provided' }); return; }

    const result = await uploadToCloudinary(file.buffer, {
      folder: `pcg-profiles/${req.user.uid}`,
      public_id: 'photo',
      overwrite: true,
      resource_type: 'image',
    });

    await db.collection('users').doc(req.user.uid).update({ photoURL: result.secure_url });

    res.json({ photoURL: result.secure_url });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};
