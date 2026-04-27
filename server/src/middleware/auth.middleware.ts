/**
 * Authentication Middleware
 * Verify JWT tokens and attach user to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../../../shared/types/auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pcg-personnel-system-super-secret-jwt-key-2026-change-in-production';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};

/**
 * Permission middleware - Check if user has required permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission: ${permission}`
      });
      return;
    }

    next();
  };
};

/**
 * Role middleware - Check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`
      });
      return;
    }

    next();
  };
};
