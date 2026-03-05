import { Router, Request, Response } from 'express';
import { AUTH_CONFIG, AuthErrorCode, createLogger } from '@auralux/shared';
import { config } from '../config';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserProfile,
  createSession,
  invalidateSession,
  storeOAuthState,
  validateOAuthState,
  getAuthSession,
} from '../services/spotify-auth.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const logger = createLogger('auth-routes');

/**
 * GET /api/auth/login
 * Initiates Spotify OAuth2 flow
 */
router.get('/login', async (_req: Request, res: Response) => {
  try {
    const { url, state } = getAuthorizationUrl();
    await storeOAuthState(state);

    logger.info('OAuth flow initiated', { state });
    res.json({
      success: true,
      data: { authUrl: url, state },
    });
  } catch (error) {
    logger.error('Login initiation failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_INIT_FAILED',
        message: 'Failed to initiate login',
        retryable: true,
      },
    });
  }
});

/**
 * GET /api/auth/callback
 * Handles Spotify OAuth2 callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    logger.warn('OAuth error from Spotify', { error: oauthError });
    const errorUrl = new URL('/auth/error', config.frontend.url);
    errorUrl.searchParams.set('error', oauthError as string);
    res.redirect(errorUrl.toString());
    return;
  }

  if (!code || !state) {
    const errorUrl = new URL('/auth/error', config.frontend.url);
    errorUrl.searchParams.set('error', 'missing_params');
    res.redirect(errorUrl.toString());
    return;
  }

  try {
    const isValidState = await validateOAuthState(state as string);
    if (!isValidState) {
      logger.warn('Invalid OAuth state', { state });
      const errorUrl = new URL('/auth/error', config.frontend.url);
      errorUrl.searchParams.set('error', 'invalid_state');
      res.redirect(errorUrl.toString());
      return;
    }

    const tokens = await exchangeCodeForTokens(code as string);
    const profile = await getUserProfile(tokens.accessToken);
    const session = await createSession(tokens, profile);

    res.cookie(AUTH_CONFIG.COOKIE_NAME, session.sessionId, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: config.isDev ? 'lax' : 'none',
      maxAge: AUTH_CONFIG.COOKIE_MAX_AGE * 1000,
      path: '/',
    });

    logger.info('OAuth callback successful', {
      userId: profile.id,
      product: profile.product,
    });

    const successUrl = new URL('/auth/success', config.frontend.url);
    successUrl.searchParams.set('session', session.sessionId);
    successUrl.searchParams.set('premium', String(profile.product === 'premium'));
    res.redirect(successUrl.toString());
  } catch (error: any) {
    logger.error('OAuth callback failed', { error });
    const errorUrl = new URL('/auth/error', config.frontend.url);
    errorUrl.searchParams.set('error', error.code || 'callback_failed');
    errorUrl.searchParams.set('message', error.message || 'Authentication failed');
    res.redirect(errorUrl.toString());
  }
});

/**
 * GET /api/auth/session
 * Get current session info
 */
router.get('/session', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = req.session!;
    res.json({
      success: true,
      data: {
        user: session.profile,
        isPremium: session.profile.product === 'premium',
        expiresAt: session.tokens.expiresAt,
        sessionId: session.sessionId,
      },
    });
  } catch (error) {
    logger.error('Get session failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SESSION_FETCH_FAILED', message: 'Failed to fetch session', retryable: true },
    });
  }
});

/**
 * GET /api/auth/token
 * Get current access token (for Spotify Web Playback SDK)
 */
router.get('/token', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = req.session!;
    res.json({
      success: true,
      data: {
        accessToken: session.tokens.accessToken,
        expiresAt: session.tokens.expiresAt,
        tokenType: session.tokens.tokenType,
      },
    });
  } catch (error) {
    logger.error('Get token failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'TOKEN_FETCH_FAILED', message: 'Failed to fetch token', retryable: true },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Force token refresh
 */
router.post('/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = await getAuthSession(req.sessionId!);
    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.SESSION_EXPIRED,
          message: 'Session expired during refresh',
          retryable: false,
        },
      });
      return;
    }
    res.json({
      success: true,
      data: { accessToken: session.tokens.accessToken, expiresAt: session.tokens.expiresAt },
    });
  } catch (error) {
    logger.error('Token refresh failed', { error });
    res.status(500).json({
      success: false,
      error: { code: AuthErrorCode.TOKEN_REFRESH_FAILED, message: 'Token refresh failed', retryable: true },
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    await invalidateSession(req.sessionId!);
    res.clearCookie(AUTH_CONFIG.COOKIE_NAME);
    logger.info('User logged out', { userId: req.session?.userId });
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_FAILED', message: 'Logout failed', retryable: true },
    });
  }
});

export { router as authRouter };
