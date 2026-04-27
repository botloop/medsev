/**
 * Authentication Routes
 * Define API endpoints for authentication
 */

import { Router } from 'express';
import multer from 'multer';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

/**
 * POST /api/auth/login/google
 * Login with Google OAuth - Verify Firebase ID token
 */
router.post('/login/google', authController.loginWithGoogle);

/**
 * POST /api/auth/login/serial
 * Login with Serial Number - Medical personnel authentication
 */
router.post('/login/serial',   authController.loginWithSerial);
router.post('/login/password', authController.loginWithPassword);

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * POST /api/auth/refresh
 * Refresh JWT token (protected)
 */
router.post('/refresh', authMiddleware, authController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout current user (protected)
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * PATCH /api/auth/profile
 * Update user profile (display name) - protected
 */
router.patch('/profile', authMiddleware, authController.updateProfile);

/**
 * PATCH /api/auth/complete-profile
 * Complete new user profile setup - protected
 */
router.patch('/complete-profile', authMiddleware, authController.completeProfile);

/**
 * POST /api/auth/unlink-personnel
 * Unlink personnel record from user account - protected
 */
router.post('/unlink-personnel', authMiddleware, authController.unlinkPersonnel);

/**
 * POST /api/auth/profile-photo
 * Upload user profile photo - protected
 */
router.post('/profile-photo', authMiddleware, upload.single('photo'), authController.uploadProfilePhoto);

export default router;
