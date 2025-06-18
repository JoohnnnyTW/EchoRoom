
import React from 'react';
import { QueueListIcon } from './Icons'; // Or another suitable icon
import { IconButton } from './IconButton';

interface FloatingCategoriesButtonProps {
  onClick: () => void;
  title?: string;
}

export const FloatingCategoriesButton: React.FC<FloatingCategoriesButtonProps> = ({ onClick, title = "開啟提示詞分類" }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-black text-white rounded-full p-4 shadow-xl hover:bg-gray-800 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150 ease-in-out z-50 active:scale-95 transform"
      aria-label={title}
      title={title}
    >
      <QueueListIcon className="w-6 h-6" />
    </button>
  );
};
