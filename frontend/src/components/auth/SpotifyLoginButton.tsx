'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Music2, LogOut, Crown, Loader2 } from 'lucide-react';

interface SpotifyLoginButtonProps {
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

export default function SpotifyLoginButton({ variant = 'default', className = '' }: SpotifyLoginButtonProps) {
  const { isAuthenticated, isLoading, user, isPremium, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
        {variant !== 'icon' && <span className="text-sm text-surface-400">Connecting...</span>}
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (variant === 'icon') {
      return (
        <button
          onClick={logout}
          className={`relative group ${className}`}
          title={`${user.displayName} - Click to logout`}
        >
          {user.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.displayName}
              className="w-8 h-8 rounded-full ring-2 ring-neon-pink/50 hover:ring-neon-pink transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user.displayName[0]}</span>
            </div>
          )}
          {isPremium && (
            <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-neon-yellow drop-shadow-lg" />
          )}
        </button>
      );
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {user.images?.[0]?.url ? (
          <img
            src={user.images[0].url}
              alt={user.displayName}
            className="w-8 h-8 rounded-full ring-2 ring-neon-pink/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
            <span className="text-xs font-bold text-white">{user.displayName[0]}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
            {isPremium && (
              <span className="text-[10px] bg-neon-yellow/20 text-neon-yellow px-1.5 py-0.5 rounded-full font-semibold">
                PREMIUM
              </span>
            )}
          </div>
          {variant === 'default' && (
            <p className="text-xs text-surface-400 truncate">{user.email}</p>
          )}
        </div>
        <button
          onClick={logout}
          className="ml-auto text-surface-400 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Not authenticated
  if (variant === 'icon') {
    return (
      <button
        onClick={login}
        className={`w-8 h-8 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-colors ${className}`}
        title="Connect with Spotify"
      >
        <Music2 className="w-4 h-4 text-white" />
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] transition-all hover:scale-105 shadow-lg shadow-[#1DB954]/25 ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      <span className="text-sm font-semibold text-white">
        {variant === 'compact' ? 'Connect' : 'Connect with Spotify'}
      </span>
    </button>
  );
}
