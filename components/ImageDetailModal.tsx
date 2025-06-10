
import React from 'react';
import { GeneratedImage, ImageHistoryEntry } from '../types';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'; // Added ChevronLeftIcon and ChevronRightIcon
import { IconButton } from './IconButton';

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage | ImageHistoryEntry | null; // Can be either type now
  currentIndex: number | null;
  totalImages: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    image, 
    currentIndex, 
    totalImages, 
    onNavigate 
}) => {
  if (!isOpen || !image) return null;

  const isHistoryContext = currentIndex !== null && totalImages > 0 && 'timestamp' in image;
  const canNavigatePrev = isHistoryContext && currentIndex > 0;
  const canNavigateNext = isHistoryContext && currentIndex < totalImages - 1;

  const displayPrompt = image.prompt || "無提示詞資訊";
  const displaySrc = image.src;
  const displayId = image.id;


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`image-detail-title-${displayId}`}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out relative" // Increased max-w-3xl to max-w-5xl
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 id={`image-detail-title-${displayId}`} className="text-lg font-semibold text-gray-800 truncate">
            圖像詳情 {isHistoryContext ? `(${currentIndex + 1} / ${totalImages})` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉圖像詳情"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <div className="flex-grow overflow-auto apple-scroll relative flex items-center justify-center">
          <img 
            src={displaySrc} 
            alt={`Generated: ${displayPrompt.substring(0, 100)}...`} 
            className="max-w-full max-h-[calc(85vh-120px)] object-contain rounded-md" // Adjusted max-h for larger image
          />
          
          {isHistoryContext && totalImages > 1 && (
            <>
              <IconButton
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white disabled:bg-opacity-10 disabled:text-gray-400 p-2"
                aria-label="上一張圖像"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </IconButton>
              <IconButton
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white disabled:bg-opacity-10 disabled:text-gray-400 p-2"
                aria-label="下一張圖像"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </IconButton>
            </>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 break-all"><strong>提示詞:</strong> {displayPrompt}</p>
        </div>
      </div>
    </div>
  );
};
