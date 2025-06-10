import React from 'react';
import { SparklesIcon, SlidersIcon } from './Icons'; // Changed CogIcon to SlidersIcon
import { IconButton } from './IconButton';

interface HeaderProps {
  onToggleSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSettings }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-8 h-8 text-black" />
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800">
            EchoRoom
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <IconButton 
            onClick={onToggleSettings}
            aria-label="開啟設定"
            title="設定"
            className="text-gray-600 hover:text-black"
          >
            <SlidersIcon className="w-6 h-6" /> {/* Changed CogIcon to SlidersIcon */}
          </IconButton>
          <div className="text-xs text-gray-500 hidden sm:block">
            由 Gemini 強力驅動
          </div>
        </div>
      </div>
    </header>
  );
};