/**
 * Language Filter Component
 * Allows users to filter songs by language
 */

'use client';

import { useState } from 'react';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { useRealtimeStore } from '@/lib/realtime';

interface LanguageFilterProps {
  onChange?: (language: string) => void;
  variant?: 'dropdown' | 'pills' | 'tabs';
  showCounts?: boolean;
}

// Language metadata with flags/emojis
const LANGUAGE_INFO: Record<string, { flag: string; native: string }> = {
  All: { flag: '🌍', native: 'All Languages' },
  English: { flag: '🇬🇧', native: 'English' },
  Hindi: { flag: '🇮🇳', native: 'हिंदी' },
  Tamil: { flag: '🇮🇳', native: 'தமிழ்' },
  Telugu: { flag: '🇮🇳', native: 'తెలుగు' },
  Punjabi: { flag: '🇮🇳', native: 'ਪੰਜਾਬੀ' },
  Malayalam: { flag: '🇮🇳', native: 'മലയാളം' },
  Kannada: { flag: '🇮🇳', native: 'ಕನ್ನಡ' },
  Bengali: { flag: '🇮🇳', native: 'বাংলা' },
  Marathi: { flag: '🇮🇳', native: 'मराठी' },
  Korean: { flag: '🇰🇷', native: '한국어' },
  Japanese: { flag: '🇯🇵', native: '日本語' },
  Spanish: { flag: '🇪🇸', native: 'Español' },
  Arabic: { flag: '🇸🇦', native: 'العربية' },
  French: { flag: '🇫🇷', native: 'Français' },
  Chinese: { flag: '🇨🇳', native: '中文' },
  Portuguese: { flag: '🇧🇷', native: 'Português' },
  Turkish: { flag: '🇹🇷', native: 'Türkçe' },
  German: { flag: '🇩🇪', native: 'Deutsch' },
  Italian: { flag: '🇮🇹', native: 'Italiano' },
};

export function LanguageFilter({ onChange, variant = 'dropdown', showCounts = false }: LanguageFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredLanguage, setPreferredLanguage, availableLanguages } = useRealtimeStore();

  const handleSelect = (language: string) => {
    setPreferredLanguage(language);
    onChange?.(language);
    setIsOpen(false);
  };

  const currentLang = LANGUAGE_INFO[preferredLanguage] || LANGUAGE_INFO['All'];

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700 transition-all"
        >
          <Globe className="w-4 h-4 text-surface-400" />
          <span className="text-lg">{currentLang.flag}</span>
          <span className="text-sm font-medium">{preferredLanguage}</span>
          <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-surface-900 border border-surface-700 rounded-xl shadow-xl z-50">
              <div className="p-2 border-b border-surface-700">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-2">Select Language</p>
              </div>
              <div className="p-1">
                {availableLanguages.map((language) => {
                  const info = LANGUAGE_INFO[language] || { flag: '🌐', native: language };
                  const isSelected = language === preferredLanguage;

                  return (
                    <button
                      key={language}
                      onClick={() => handleSelect(language)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isSelected ? 'bg-neon-pink/10 text-neon-pink' : 'hover:bg-surface-800'
                      }`}
                    >
                      <span className="text-xl">{info.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{language}</p>
                        {language !== 'All' && (
                          <p className="text-xs text-surface-500">{info.native}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Pills variant
  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap gap-2">
        {availableLanguages.slice(0, 8).map((language) => {
          const info = LANGUAGE_INFO[language] || { flag: '🌐', native: language };
          const isSelected = language === preferredLanguage;

          return (
            <button
              key={language}
              onClick={() => handleSelect(language)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/20'
                  : 'bg-surface-800/50 text-surface-300 hover:bg-surface-700/50'
              }`}
            >
              <span>{info.flag}</span>
              <span>{language}</span>
            </button>
          );
        })}
        
        {availableLanguages.length > 8 && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-surface-800/50 text-surface-300 hover:bg-surface-700/50"
          >
            <span>+{availableLanguages.length - 8} more</span>
          </button>
        )}

        {/* Modal for all languages */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <h3 className="text-lg font-bold">Select Language</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-surface-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {availableLanguages.map((language) => {
                    const info = LANGUAGE_INFO[language] || { flag: '🌐', native: language };
                    const isSelected = language === preferredLanguage;

                    return (
                      <button
                        key={language}
                        onClick={() => handleSelect(language)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30'
                            : 'bg-surface-800/50 hover:bg-surface-700/50 border border-transparent'
                        }`}
                      >
                        <span className="text-xl">{info.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-neon-pink' : ''}`}>
                            {language}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-neon-pink flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tabs variant
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 p-1 bg-surface-800/50 rounded-xl">
        {availableLanguages.slice(0, 6).map((language) => {
          const info = LANGUAGE_INFO[language] || { flag: '🌐', native: language };
          const isSelected = language === preferredLanguage;

          return (
            <button
              key={language}
              onClick={() => handleSelect(language)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-white text-black shadow-sm'
                  : 'text-surface-400 hover:text-white hover:bg-surface-700/50'
              }`}
            >
              <span>{info.flag}</span>
              <span>{language}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageFilter;
