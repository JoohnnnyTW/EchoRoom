
import React, { useContext } from 'react';
import { SparklesIcon, SlidersIcon, BookmarkIcon } from './Icons'; // Added BookmarkIcon
import { IconButton } from './IconButton';
import { SettingsContext } from '../contexts/SettingsContext';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts';

interface HeaderProps {
  onToggleSettings: () => void;
  onViewFavorites: () => void; // New prop
  currentView: 'main' | 'favorites' | 'multimodalEdit' | 'imageFusion'; // Updated prop type
}

export const Header: React.FC<HeaderProps> = ({ onToggleSettings, onViewFavorites, currentView }) => {
  const settingsContext = useContext(SettingsContext);
  const uiTexts = settingsContext?.settings.uiTexts || DEFAULT_UI_TEXTS;
  const headerTitle = uiTexts.headerTitle.textZh;
  const viewFavoritesLabel = uiTexts.viewFavoritesButtonLabel.textZh;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-8 h-8 text-black" />
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900/90">
            {headerTitle}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {currentView === 'main' && (
            <IconButton
              onClick={onViewFavorites}
              aria-label={viewFavoritesLabel}
              title={viewFavoritesLabel}
              className="text-gray-700 hover:text-gray-900 active:scale-95 transform transition-transform duration-100"
            >
              <BookmarkIcon className="w-6 h-6" />
            </IconButton>
          )}
          <IconButton 
            onClick={onToggleSettings}
            aria-label="開啟設定"
            title="設定"
            className="text-gray-700 hover:text-gray-900 active:scale-95 transform transition-transform duration-100"
          >
            <SlidersIcon className="w-6 h-6" />
          </IconButton>
          <div className="text-xs text-gray-500 hidden sm:block">
            由 Gemini 強力驅動
          </div>
        </div>
      </div>
    </header>
  );
};
