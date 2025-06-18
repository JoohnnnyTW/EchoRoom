
import React from 'react';
import { ChevronDoubleDownIcon } from './Icons';

interface FloatingScrollToGeneratorButtonProps {
  onClick: () => void;
  title?: string;
}

export const FloatingScrollToGeneratorButton: React.FC<FloatingScrollToGeneratorButtonProps> = ({ 
    onClick, 
    title = "前往圖像生成區" 
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 bg-black text-white rounded-full p-4 shadow-xl hover:bg-gray-800 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150 ease-in-out z-50 active:scale-95 transform"
      aria-label={title}
      title={title}
    >
      <ChevronDoubleDownIcon className="w-6 h-6" />
    </button>
  );
};
