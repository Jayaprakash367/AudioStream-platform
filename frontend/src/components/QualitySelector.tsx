/**
 * Quality Selector Component
 * Allows users to select audio quality for streaming
 */

'use client';

import { useState } from 'react';
import { Settings, Check, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { useRealtimeStore } from '@/lib/realtime';

interface QualitySelectorProps {
  onChange?: (quality: string) => void;
  compact?: boolean;
}

const QUALITY_INFO: Record<string, { label: string; bitrate: string; description: string; icon: React.ReactNode }> = {
  '128kbps': {
    label: 'Low',
    bitrate: '128 kbps',
    description: 'Data saver mode',
    icon: <WifiOff className="w-4 h-4" />,
  },
  '192kbps': {
    label: 'Normal',
    bitrate: '192 kbps',
    description: 'Balanced quality',
    icon: <Wifi className="w-4 h-4" />,
  },
  '256kbps': {
    label: 'High',
    bitrate: '256 kbps',
    description: 'Better clarity',
    icon: <Wifi className="w-4 h-4" />,
  },
  '320kbps': {
    label: 'Very High',
    bitrate: '320 kbps',
    description: 'Best quality (recommended)',
    icon: <Sparkles className="w-4 h-4" />,
  },
  'lossless': {
    label: 'Lossless',
    bitrate: 'FLAC',
    description: 'Studio quality (Premium)',
    icon: <Sparkles className="w-4 h-4 text-neon-pink" />,
  },
};

export function QualitySelector({ onChange, compact = false }: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredQuality, setPreferredQuality, availableQualities } = useRealtimeStore();

  const handleSelect = (quality: string) => {
    setPreferredQuality(quality);
    onChange?.(quality);
    setIsOpen(false);
  };

  const currentQuality = QUALITY_INFO[preferredQuality] || QUALITY_INFO['320kbps'];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 transition-colors text-xs font-medium"
        >
          {currentQuality.icon}
          <span>{currentQuality.bitrate}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface-900 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {availableQualities.map((quality) => {
                const info = QUALITY_INFO[quality];
                if (!info) return null;
                return (
                  <button
                    key={quality}
                    onClick={() => handleSelect(quality)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-800 transition-colors ${
                      quality === preferredQuality ? 'bg-surface-800' : ''
                    }`}
                  >
                    {info.icon}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{info.label}</p>
                      <p className="text-xs text-surface-500">{info.bitrate}</p>
                    </div>
                    {quality === preferredQuality && <Check className="w-4 h-4 text-neon-pink" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-300 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Audio Quality
        </h3>
        <span className="text-xs text-surface-500">{currentQuality.label}</span>
      </div>

      <div className="space-y-1">
        {availableQualities.map((quality) => {
          const info = QUALITY_INFO[quality];
          if (!info) return null;
          const isSelected = quality === preferredQuality;

          return (
            <button
              key={quality}
              onClick={() => handleSelect(quality)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30'
                  : 'bg-surface-800/50 hover:bg-surface-700/50 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-neon-pink/20' : 'bg-surface-700'}`}>
                {info.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${isSelected ? 'text-neon-pink' : 'text-white'}`}>
                  {info.label}
                </p>
                <p className="text-xs text-surface-500">{info.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono ${isSelected ? 'text-neon-pink' : 'text-surface-400'}`}>
                  {info.bitrate}
                </p>
              </div>
              {isSelected && <Check className="w-5 h-5 text-neon-pink" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QualitySelector;
