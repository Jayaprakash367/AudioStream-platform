import { Request, Response, NextFunction } from 'express';
import { AuthErrorCode, createLogger } from '@auralux/shared';
import type { AuthSession } from '@auralux/shared';
import { AUTH_CONFIG } from '@auralux/shared';
import { getAuthSession } from '../services/spotify-auth.service';

const logger = createLogger('auth-middleware');

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      session?: AuthSession;
      sessionId?: string;
    }
  }
}

/**
 * Middleware to validate auth session from cookie or Authorization header
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let sessionId = req.cookies?.[AUTH_CONFIG.COOKIE_NAME];

    if (!sessionId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        sessionId = authHeader.slice(7);
      }
    }

    if (!sessionId) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.SESSION_NOT_FOUND,
          message: 'Authentication required',
          retryable: false,
        },
      });
      return;
    }

    const session = await getAuthSession(sessionId);

    if (!session) {
      res.clearCookie(AUTH_CONFIG.COOKIE_NAME);
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.SESSION_EXPIRED,
          message: 'Session expired. Please log in again.',
          retryable: false,
        },
      });
      return;
    }

    req.session = session;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication check failed',
        retryable: true,
      },
    });
  }
}

/**
 * Optional auth - attaches session if present but doesn't fail
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let sessionId = req.cookies?.[AUTH_CONFIG.COOKIE_NAME];

    if (!sessionId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        sessionId = authHeader.slice(7);
      }
    }

    if (sessionId) {
      const session = await getAuthSession(sessionId);
      if (session) {
        req.session = session;
        req.sessionId = sessionId;
      }
    }

    next();
  } catch (error) {
    logger.debug('Optional auth failed, continuing without session');
    next();
  }
}

/**
 * Require Spotify Premium subscription
 */
export function requirePremium(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    res.status(401).json({
      success: false,
      error: {
        code: AuthErrorCode.SESSION_NOT_FOUND,
        message: 'Authentication required',
        retryable: false,
      },
    });
    return;
  }

  if (req.session.profile.product !== 'premium') {
    res.status(403).json({
      success: false,
      error: {
        code: AuthErrorCode.PREMIUM_REQUIRED,
        message: 'Spotify Premium is required for full playback',
        retryable: false,
      },
      data: {
        currentPlan: req.session.profile.product,
        upgradeUrl: 'https://www.spotify.com/premium/',
      },
    });
    return;
  }

  next();
}
