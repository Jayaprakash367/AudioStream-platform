import axios, { AxiosError } from 'axios';
import {
  SPOTIFY_ENDPOINTS,
  SPOTIFY_SCOPES,
  AUTH_CONFIG,
  AuthErrorCode,
  createLogger,
} from '@auralux/shared';
import type { SpotifyTokens, SpotifyUserProfile, AuthSession } from '@auralux/shared';
import { config } from '../config';
import { encrypt, decrypt, generateState, generateSessionId } from './encryption.service';
import { setSession, getSession, deleteSession } from './redis.service';

const logger = createLogger('spotify-auth');

/**
 * Generate Spotify OAuth2 authorization URL with PKCE-like state
 */
export function getAuthorizationUrl(): { url: string; state: string } {
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.spotify.clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: config.spotify.redirectUri,
    state,
    show_dialog: 'false',
  });

  const url = `${SPOTIFY_ENDPOINTS.AUTHORIZE}?${params.toString()}`;

  logger.debug('Generated authorization URL', { state });
  return { url, state };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  try {
    const credentials = Buffer.from(
      `${config.spotify.clientId}:${config.spotify.clientSecret}`
    ).toString('base64');

    const response = await axios.post(
      SPOTIFY_ENDPOINTS.TOKEN,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.spotify.redirectUri,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in, token_type, scope } = response.data;

    const tokens: SpotifyTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
      tokenType: token_type,
      scope,
    };

    logger.info('Token exchange successful', { expiresIn: expires_in });
    return tokens;
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string; error_description: string }>;
    logger.error('Token exchange failed', {
      status: axiosError.response?.status,
      error: axiosError.response?.data?.error_description,
    });
    throw {
      code: AuthErrorCode.TOKEN_EXCHANGE_FAILED,
      message: axiosError.response?.data?.error_description || 'Token exchange failed',
      statusCode: 401,
    };
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  try {
    const credentials = Buffer.from(
      `${config.spotify.clientId}:${config.spotify.clientSecret}`
    ).toString('base64');

    const response = await axios.post(
      SPOTIFY_ENDPOINTS.TOKEN,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in, token_type, scope, refresh_token } = response.data;

    const tokens: SpotifyTokens = {
      accessToken: access_token,
      refreshToken: refresh_token || refreshToken,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
      tokenType: token_type,
      scope: scope || '',
    };

    logger.info('Token refresh successful', { expiresIn: expires_in });
    return tokens;
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string; error_description: string }>;
    logger.error('Token refresh failed', {
      status: axiosError.response?.status,
      error: axiosError.response?.data?.error_description,
    });
    throw {
      code: AuthErrorCode.TOKEN_REFRESH_FAILED,
      message: 'Token refresh failed. Please re-authenticate.',
      statusCode: 401,
    };
  }
}

/**
 * Fetch user profile from Spotify
 */
export async function getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  try {
    const response = await axios.get(SPOTIFY_ENDPOINTS.ME, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = response.data;
    const profile: SpotifyUserProfile = {
      id: data.id,
      displayName: data.display_name || data.id,
      email: data.email || '',
      images: data.images || [],
      product: data.product || 'free',
      country: data.country || '',
      uri: data.uri,
      externalUrls: data.external_urls || {},
    };

    logger.info('User profile fetched', {
      userId: profile.id,
      product: profile.product,
    });

    return profile;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Failed to fetch user profile', {
      status: axiosError.response?.status,
    });
    throw {
      code: AuthErrorCode.SPOTIFY_API_ERROR,
      message: 'Failed to fetch user profile',
      statusCode: axiosError.response?.status || 500,
    };
  }
}

/**
 * Create a new auth session
 */
export async function createSession(
  tokens: SpotifyTokens,
  profile: SpotifyUserProfile
): Promise<AuthSession> {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: AuthSession = {
    sessionId,
    userId: profile.id,
    spotifyId: profile.id,
    tokens: {
      ...tokens,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
    },
    profile,
    createdAt: now,
    lastRefreshed: now,
    isActive: true,
  };

  await setSession(`session:${sessionId}`, JSON.stringify(session), AUTH_CONFIG.SESSION_TTL);
  await setSession(`user:${profile.id}:session`, sessionId, AUTH_CONFIG.SESSION_TTL);

  logger.info('Session created', { sessionId, userId: profile.id });
  return { ...session, tokens }; // Return with unencrypted tokens for immediate use
}

/**
 * Retrieve and validate a session
 */
export async function getAuthSession(sessionId: string): Promise<AuthSession | null> {
  const sessionData = await getSession(`session:${sessionId}`);
  if (!sessionData) {
    logger.debug('Session not found', { sessionId });
    return null;
  }

  try {
    const session: AuthSession = JSON.parse(sessionData);

    if (!session.isActive) {
      logger.debug('Session is inactive', { sessionId });
      return null;
    }

    // Decrypt tokens
    session.tokens.accessToken = decrypt(session.tokens.accessToken);
    session.tokens.refreshToken = decrypt(session.tokens.refreshToken);

    // Check if token needs refresh
    const now = Date.now();
    const bufferMs = AUTH_CONFIG.TOKEN_REFRESH_BUFFER * 1000;

    if (session.tokens.expiresAt - bufferMs < now) {
      logger.info('Token expired, refreshing', { sessionId });
      try {
        const newTokens = await refreshAccessToken(session.tokens.refreshToken);
        session.tokens = newTokens;
        session.lastRefreshed = now;

        // Re-encrypt and save
        const sessionToStore: AuthSession = {
          ...session,
          tokens: {
            ...newTokens,
            accessToken: encrypt(newTokens.accessToken),
            refreshToken: encrypt(newTokens.refreshToken),
          },
        };

        await setSession(
          `session:${sessionId}`,
          JSON.stringify(sessionToStore),
          AUTH_CONFIG.SESSION_TTL
        );

        logger.info('Token refreshed successfully', { sessionId });
      } catch (refreshError) {
        logger.error('Token refresh failed during session retrieval', { sessionId });
        await invalidateSession(sessionId);
        return null;
      }
    }

    return session;
  } catch (error) {
    logger.error('Failed to parse session', { sessionId, error });
    return null;
  }
}

/**
 * Invalidate/destroy a session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const sessionData = await getSession(`session:${sessionId}`);

  if (sessionData) {
    try {
      const session: AuthSession = JSON.parse(sessionData);
      await deleteSession(`user:${session.userId}:session`);
    } catch {
      // Ignore parse errors during cleanup
    }
  }

  await deleteSession(`session:${sessionId}`);
  logger.info('Session invalidated', { sessionId });
}

/**
 * Store OAuth state for validation
 */
export async function storeOAuthState(state: string): Promise<void> {
  await setSession(`oauth:state:${state}`, 'valid', AUTH_CONFIG.STATE_TTL);
}

/**
 * Validate OAuth state
 */
export async function validateOAuthState(state: string): Promise<boolean> {
  const stored = await getSession(`oauth:state:${state}`);
  if (stored) {
    await deleteSession(`oauth:state:${state}`);
    return true;
  }
  return false;
}
