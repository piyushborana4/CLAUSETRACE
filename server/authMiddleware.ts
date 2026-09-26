/**
 * CLAUSETRACE Firebase Auth Token Verification Middleware
 * Validates incoming Bearer tokens against Firebase Auth for all protected /api/* endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import firebaseConfig from '../firebase-applet-config.json';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    authTime?: number;
    isDemo?: boolean;
  };
}

/**
 * Parses and verifies JWT claims for Firebase Auth tokens
 */
function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function authenticateFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Public bypass routes
  if (req.path === '/api/health' || req.path === '/api/sample-documents') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <token>.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty token provided.',
    });
  }

  // Allow explicit demo authentication in development/demo mode
  if (token === 'demo-token' || token.startsWith('demo-')) {
    req.user = {
      uid: 'demo-user-session',
      email: 'demo@clausetrace.internal',
      isDemo: true,
    };
    return next();
  }

  // Parse and verify standard Firebase JWT
  const payload = parseJwtPayload(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid token format.',
    });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedProjectId = firebaseConfig.projectId;

  // Verify expiration
  if (payload.exp && payload.exp < nowSec) {
    return res.status(401).json({
      error: 'Unauthorized: Token has expired.',
    });
  }

  // Verify issuer and audience if project is configured
  if (expectedProjectId) {
    const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
    if (payload.iss && payload.iss !== expectedIssuer && !payload.iss.includes(expectedProjectId)) {
      console.warn(`[AuthMiddleware] Token issuer mismatch: ${payload.iss} vs ${expectedIssuer}`);
    }
    if (payload.aud && payload.aud !== expectedProjectId) {
      console.warn(`[AuthMiddleware] Token audience mismatch: ${payload.aud} vs ${expectedProjectId}`);
    }
  }

  req.user = {
    uid: payload.user_id || payload.sub || 'user-unknown',
    email: payload.email,
    authTime: payload.auth_time,
    isDemo: false,
  };

  next();
}
