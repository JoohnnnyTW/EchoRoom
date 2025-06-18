
import React from 'react';
import { SparklesIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface FloatingAISuggestionsButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  title?: string;
}

export const FloatingAISuggestionsButton: React.FC<FloatingAISuggestionsButtonProps> = ({ 
    onClick, 
    isLoading, 
    disabled, 
    title = "AI 關鍵詞建議" 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className="fixed bottom-24 right-6 bg-black text-white rounded-full p-4 shadow-xl hover:bg-gray-800 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150 ease-in-out z-50 disabled:opacity-60 active:scale-95 transform"
      aria-label={title}
      title={title}
    >
      {isLoading ? <LoadingSpinner className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
    </button>
  );
};
