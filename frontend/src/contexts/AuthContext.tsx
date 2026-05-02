'use client';

/**
 * AuthContext — Frontend JWT Auth with Auto-Login
 *
 * Flow:
 *  1. On mount → reads token from localStorage (rememberMe) or sessionStorage (temp)
 *  2. If token exists → calls /auth/me to validate and hydrate user profile
 *  3. On login     → stores accessToken + refreshToken based on rememberMe flag
 *  4. On refresh   → silently exchanges refreshToken for new pair before expiry
 *  5. On logout    → clears both storages and calls /auth/logout
 *
 * Storage strategy:
 *  rememberMe = true  → localStorage  (survives browser restart)
 *  rememberMe = false → sessionStorage (cleared when browser tab closes)
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuraluxUser {
  userId: string;
  email: string;
  username: string;
  displayName?: string;
  role: string;
  subscription: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuraluxUser | null;
  accessToken: string | null;
  error: string | null;
  rememberMe: boolean;
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuraluxUser; accessToken: string; rememberMe: boolean } }
  | { type: 'AUTH_FAILURE'; payload?: string }
  | { type: 'TOKEN_REFRESHED'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  clearError: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Storage keys
const KEYS = {
  ACCESS_TOKEN: 'auralux_access_token',
  REFRESH_TOKEN: 'auralux_refresh_token',
  REMEMBER_ME: 'auralux_remember_me',
  USER: 'auralux_user',
};

// ─── Storage helpers (localStorage vs sessionStorage based on rememberMe) ───

function getStorage(rememberMe: boolean): Storage {
  if (typeof window === 'undefined') return { getItem: () => null } as unknown as Storage;
  return rememberMe ? localStorage : sessionStorage;
}

function readFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  // Check localStorage first (rememberMe=true), then sessionStorage
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

// ─── Reducer ────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  error: null,
  rememberMe: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        rememberMe: action.payload.rememberMe,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...initialState,
        isLoading: false,
        error: action.payload || null,
      };

    case 'TOKEN_REFRESHED':
      return { ...state, accessToken: action.payload };

    case 'LOGOUT':
      return { ...initialState, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Schedule silent token refresh 1 minute before access token expires */
  const scheduleRefresh = useCallback((expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshInMs = Math.max((expiresInSeconds - 60) * 1000, 5000);
    refreshTimerRef.current = setTimeout(async () => {
      await silentRefresh();
    }, refreshInMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Read from JWT exp claim to get remaining seconds */
  function getTokenExpiry(token: string): number {
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      return decoded.exp - Math.floor(Date.now() / 1000);
    } catch {
      return 0;
    }
  }

  /** Exchange refresh token for new access token silently */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const refreshToken = readFromStorage(KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh token expired — log user out
        dispatch({ type: 'AUTH_FAILURE' });
        clearAllStorage();
        return null;
      }

      const { data } = await res.json();
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = data;

      // Update storage (preserve the same storage type)
      const rememberMe = localStorage.getItem(KEYS.REMEMBER_ME) === 'true';
      const storage = getStorage(rememberMe);
      storage.setItem(KEYS.ACCESS_TOKEN, accessToken);
      storage.setItem(KEYS.REFRESH_TOKEN, newRefreshToken);

      dispatch({ type: 'TOKEN_REFRESHED', payload: accessToken });
      scheduleRefresh(expiresIn);
      return accessToken;
    } catch {
      return null;
    }
  }, [scheduleRefresh]);

  // ── Mount: Auto-login check ────────────────────────────────────────────────

  useEffect(() => {
    async function autoLogin() {
      const storedToken = readFromStorage(KEYS.ACCESS_TOKEN);
      const storedUser = readFromStorage(KEYS.USER);
      const storedRememberMe = localStorage.getItem(KEYS.REMEMBER_ME) === 'true';

      if (!storedToken) {
        // No token stored — user needs to log in
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      const expiresIn = getTokenExpiry(storedToken);

      if (expiresIn > 60) {
        // Token still valid — restore session from storage (no network call)
        const user = storedUser ? (JSON.parse(storedUser) as AuraluxUser) : null;

        if (user) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, accessToken: storedToken, rememberMe: storedRememberMe },
          });
          scheduleRefresh(expiresIn);
          return;
        }
      }

      // Token expired or no cached user — try silent refresh
      try {
        const newToken = await silentRefresh();
        if (!newToken) {
          dispatch({ type: 'AUTH_FAILURE' });
          return;
        }

        // Validate and get user profile from backend
        const profileRes = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${newToken}`,
            'x-user-id': JSON.parse(readFromStorage(KEYS.USER) || '{}')?.userId || '',
          },
        });

        if (profileRes.ok) {
          const { data } = await profileRes.json();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: data as AuraluxUser, accessToken: newToken, rememberMe: storedRememberMe },
          });
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
          clearAllStorage();
        }
      } catch {
        dispatch({ type: 'AUTH_FAILURE' });
      }
    }

    autoLogin();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || json?.message || 'Login failed');
        }

        const { userId, accessToken, refreshToken, expiresIn } = json.data;

        // Build a minimal user object from token payload
        const [, payloadB64] = accessToken.split('.');
        const tokenPayload = JSON.parse(atob(payloadB64));
        const user: AuraluxUser = {
          userId,
          email: tokenPayload.email || email,
          username: email.split('@')[0], // Temporary — hydrated by /auth/me
          role: tokenPayload.role || 'LISTENER',
          subscription: tokenPayload.subscription || 'FREE',
          isEmailVerified: false,
          displayName: undefined,
        };

        // Persist tokens — localStorage for rememberMe, sessionStorage for temp
        const storage = getStorage(rememberMe);
        storage.setItem(KEYS.ACCESS_TOKEN, accessToken);
        storage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
        storage.setItem(KEYS.USER, JSON.stringify(user));
        if (rememberMe) {
          localStorage.setItem(KEYS.REMEMBER_ME, 'true');
        } else {
          localStorage.removeItem(KEYS.REMEMBER_ME);
        }

        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken, rememberMe } });
        scheduleRefresh(expiresIn);

        // Hydrate full user profile from backend asynchronously
        fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-user-id': userId,
          },
        })
          .then((r) => r.json())
          .then(({ data }) => {
            if (data) {
              const fullUser = { ...user, ...data };
              storage.setItem(KEYS.USER, JSON.stringify(fullUser));
              dispatch({ type: 'AUTH_SUCCESS', payload: { user: fullUser, accessToken, rememberMe } });
            }
          })
          .catch(() => {}); // Non-critical
      } catch (err: any) {
        dispatch({ type: 'AUTH_FAILURE', payload: err.message });
      }
    },
    [scheduleRefresh]
  );

  // ── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (data: {
      email: string;
      username: string;
      password: string;
      displayName: string;
    }) => {
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || json?.message || 'Registration failed');
        }

        const { userId, accessToken, refreshToken, expiresIn } = json.data;

        const user: AuraluxUser = {
          userId,
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          role: 'LISTENER',
          subscription: 'FREE',
          isEmailVerified: false,
        };

        // New registrations default to sessionStorage (not remembered)
        sessionStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
        sessionStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
        sessionStorage.setItem(KEYS.USER, JSON.stringify(user));

        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken, rememberMe: false } });
        scheduleRefresh(expiresIn);
      } catch (err: any) {
        dispatch({ type: 'AUTH_FAILURE', payload: err.message });
        throw err; // Re-throw so the form can show the error
      }
    },
    [scheduleRefresh]
  );

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    const refreshToken = readFromStorage(KEYS.REFRESH_TOKEN);
    const accessToken = state.accessToken;

    // Tell backend to revoke the token
    try {
      if (accessToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-user-id': state.user?.userId || '',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Network error — continue local logout anyway
    }

    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearAllStorage();
    dispatch({ type: 'LOGOUT' });
  }, [state.accessToken, state.user?.userId]);

  // ── getAccessToken (returns valid token, refreshes if needed) ─────────────

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.isAuthenticated) return null;

    const token = state.accessToken;
    if (!token) return null;

    const expiresIn = getTokenExpiry(token);
    if (expiresIn > 30) return token; // Still valid

    // Silently refresh
    return silentRefresh();
  }, [state.isAuthenticated, state.accessToken, silentRefresh]);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    getAccessToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
