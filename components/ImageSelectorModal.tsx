
import React, { useState, useMemo } from 'react';
import { ImageHistoryEntry, ImageSelectorModalProps as Props } from '../types';
import { XCircleIcon, StarIcon, StarSolidIcon } from './Icons';
import { IconButton } from './IconButton';

export const ImageSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  allImageHistory,
  onImageSelect,
  uiTexts,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  const imagesToDisplay = useMemo(() => {
    if (activeTab === 'favorites') {
      return allImageHistory.filter(img => img.isFavorite);
    }
    return allImageHistory;
  }, [allImageHistory, activeTab]);

  if (!isOpen) return null;

  const handleSelectAndClose = (image: ImageHistoryEntry) => {
    onImageSelect(image);
    onClose();
  };
  
  const renderEmptyState = () => {
    const message = activeTab === 'all' ? uiTexts.imageSelectorModalNoImages.textZh : uiTexts.imageSelectorModalNoFavorites.textZh;
    const Icon = activeTab === 'all' ? StarIcon : StarSolidIcon; // Example, choose appropriate icons
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
            <Icon className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-lg">{message}</p>
        </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-selector-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="image-selector-title" className="text-lg font-semibold text-gray-800">
            {uiTexts.imageSelectorModalTitle.textZh}
          </h2>
          <IconButton onClick={onClose} aria-label="關閉選擇器" className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-7 h-7" />
          </IconButton>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Image Grid */}
          <div className="flex-grow p-4 overflow-y-auto apple-scroll">
            {imagesToDisplay.length === 0 ? (
                renderEmptyState()
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {imagesToDisplay.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleSelectAndClose(image)}
                    className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all group relative"
                    title={`選擇圖像: ${image.prompt.substring(0,30)}...`}
                  >
                    <img
                      src={image.src}
                      alt={image.prompt.substring(0, 50)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
                    {image.isFavorite && (
                        <StarSolidIcon className="absolute top-1.5 right-1.5 w-4 h-4 text-yellow-400 drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs on the right */}
          <div className="w-40 border-l border-gray-200 p-4 space-y-3 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                activeTab === 'all' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {uiTexts.imageSelectorModalAllTab.textZh}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                activeTab === 'favorites' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {uiTexts.imageSelectorModalFavoritesTab.textZh}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
