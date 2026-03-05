'use client';

import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import { apiClient } from '@/lib/api-client';

// Types
interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email: string;
  images: Array<{ url: string; height: number | null; width: number | null }>;
  product: 'free' | 'open' | 'premium';
  country: string;
  uri: string;
  externalUrls: { spotify: string };
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUserProfile | null;
  sessionId: string | null;
  error: string | null;
  isPremium: boolean;
  accessToken: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SpotifyUserProfile; sessionId: string; isPremium: boolean } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_UPDATED'; payload: { accessToken: string; expiresAt: number } }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  clearError: () => void;
}

// Reducer
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  sessionId: null,
  error: null,
  isPremium: false,
  accessToken: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        sessionId: action.payload.sessionId,
        isPremium: action.payload.isPremium,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionId: null,
        isPremium: false,
        error: action.payload,
        accessToken: null,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'TOKEN_UPDATED':
      return { ...state, accessToken: action.payload.accessToken };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: {
            user: SpotifyUserProfile;
            isPremium: boolean;
            sessionId: string;
          };
        }>('/api/auth/session');

        if (response.success && response.data) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              sessionId: response.data.sessionId,
              isPremium: response.data.isPremium,
            },
          });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
        }
      } catch {
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
      }
    }
    checkSession();
  }, []);

  const login = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await apiClient.get<{
        success: boolean;
        data: { authUrl: string };
      }>('/api/auth/login');

      if (response.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Login failed',
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Continue with local logout
    }
    dispatch({ type: 'LOGOUT' });
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.isAuthenticated) return null;
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { accessToken: string; expiresAt: number };
      }>('/api/auth/token');

      if (response.success && response.data) {
        dispatch({ type: 'TOKEN_UPDATED', payload: response.data });
        return response.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }, [state.isAuthenticated]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    getAccessToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
