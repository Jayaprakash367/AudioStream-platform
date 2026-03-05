import { AuthErrorCode } from './types/auth';

export class AuraluxError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    retryable: boolean = false,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuraluxError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
    Object.setPrototypeOf(this, AuraluxError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

export class AuthError extends AuraluxError {
  constructor(
    message: string,
    code: AuthErrorCode,
    statusCode: number = 401,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, code === AuthErrorCode.RATE_LIMITED, details);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class SpotifyApiError extends AuraluxError {
  public readonly spotifyStatus: number;

  constructor(message: string, spotifyStatus: number, details?: Record<string, unknown>) {
    const retryable = spotifyStatus === 429 || spotifyStatus >= 500;
    super(message, AuthErrorCode.SPOTIFY_API_ERROR, spotifyStatus, retryable, details);
    this.name = 'SpotifyApiError';
    this.spotifyStatus = spotifyStatus;
    Object.setPrototypeOf(this, SpotifyApiError.prototype);
  }
}

export class PremiumRequiredError extends AuthError {
  constructor() {
    super(
      'Spotify Premium is required for full playback. Free accounts can only play 30s previews.',
      AuthErrorCode.PREMIUM_REQUIRED,
      403
    );
    this.name = 'PremiumRequiredError';
    Object.setPrototypeOf(this, PremiumRequiredError.prototype);
  }
}
