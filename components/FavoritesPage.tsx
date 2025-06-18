
import React, { useContext } from 'react'; // Added useContext
import { ImageHistoryEntry, ImageEngine } from '../types';
import { IconButton } from './IconButton';
import { ArrowLeftIcon, EyeIcon, StarSolidIcon, ArrowPathIcon, StarIcon, PencilSquareIcon, LayersIcon } from './Icons';
import { SettingsContext } from '../contexts/SettingsContext'; // Added
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts'; // Added

interface FavoritesPageProps {
  images: ImageHistoryEntry[];
  onBack: () => void;
  onToggleFavorite: (imageId: string) => void;
  onViewImageDetail: (image: ImageHistoryEntry, sourceList: ImageHistoryEntry[]) => void;
  onRestoreState: (entry: ImageHistoryEntry) => void;
  onOpenMultimodalEditModal: (image: ImageHistoryEntry) => void;
  onOpenImageFusionStudio: (image: ImageHistoryEntry) => void;
  uiTexts: { // This is passed from App.tsx
    pageTitle: string;
    backButtonLabel: string;
    favoriteImageButtonTooltip: string;
    unfavoriteImageButtonTooltip: string;
    // imageFusionStudioOpenButtonTooltip: string; // REMOVED from here
  };
}

const getEngineDisplayName = (engine: ImageEngine): string => {
  switch (engine) {
    case 'gemini':
      return 'Gemini (Imagen 3)';
    case 'bfl_ai':
      return 'BFL.ai (FLUX 1.1 Pro)';
    case 'fluxKontextMax':
      return 'BFL.ai (Flux Kontext Max)';
    default:
      const exhaustiveCheck: never = engine;
      console.warn(`Unhandled image engine in getEngineDisplayName: ${engine}`);
      return String(exhaustiveCheck); 
  }
};

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  images,
  onBack,
  onToggleFavorite,
  onViewImageDetail,
  onRestoreState,
  onOpenMultimodalEditModal,
  onOpenImageFusionStudio,
  uiTexts, // This prop now lacks imageFusionStudioOpenButtonTooltip
}) => {
  const settingsContext = useContext(SettingsContext); // Get full context
  const fullUITexts = settingsContext?.settings.uiTexts || DEFAULT_UI_TEXTS; // Use full uiTexts from context

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <IconButton onClick={onBack} aria-label={uiTexts.backButtonLabel} title={uiTexts.backButtonLabel} className="text-gray-600 hover:text-black">
            <ArrowLeftIcon className="w-6 h-6" />
          </IconButton>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 font-heading-custom">{uiTexts.pageTitle}</h1>
          <div className="w-10"> {/* Spacer */}</div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {images.length === 0 ? (
          <div className="text-center py-10">
            <StarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 font-body">您尚未收藏任何圖像。</p>
            <p className="text-sm text-gray-500 mt-2 font-body">返回主應用程式並在圖像歷史記錄中點擊星號即可收藏。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {images.map((entry) => (
              <div key={entry.id} className="flex flex-col overflow-hidden rounded-lg border border-solid border-gray-200 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <button
                  onClick={() => onViewImageDetail(entry, images)}
                  className="block focus:outline-none relative group w-full"
                  aria-label={`檢視圖像 ${entry.id} 的詳細資訊`}
                >
                  <img src={entry.src} alt={`Favorite image ${entry.id}`} className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity">
                      <EyeIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                <div className="flex w-full flex-col items-start gap-2 p-3 flex-grow">
                  <span className="text-base font-semibold text-gray-800 font-heading-custom truncate w-full" title={entry.prompt}>
                    {entry.prompt.substring(0, 40)}{entry.prompt.length > 40 ? '...' : ''}
                  </span>

                  <div className="flex w-full justify-between items-start text-xs mt-1">
                    <div className="flex flex-col items-start">
                      <span className="text-gray-500 font-body">引擎</span>
                      <span className="font-medium text-gray-600 font-body">{getEngineDisplayName(entry.engine)}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-gray-500 font-body">日期</span>
                      <span className="font-medium text-gray-600 font-body">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {entry.editBaseImageId && (
                    <p className="text-[10px] text-blue-600 mt-0.5 w-full truncate">
                      (編輯自 {entry.editBaseImageId.substring(0,8)}...)
                    </p>
                  )}

                  {entry.editInstruction && (
                    <p className="text-[10px] text-purple-700 mt-0.5 w-full truncate font-body" title={`編輯指令: ${entry.editInstruction}`}>
                      <strong>編輯指令:</strong> {entry.editInstruction}
                    </p>
                  )}

                  <div className="flex items-center justify-end space-x-1.5 mt-auto pt-2 border-t border-gray-100 w-full">
                    <IconButton
                      onClick={() => onOpenImageFusionStudio(entry)} 
                      aria-label={fullUITexts.imageFusionStudioOpenButtonTooltip.textZh} 
                      title={fullUITexts.imageFusionStudioOpenButtonTooltip.textZh} 
                      className="text-gray-500 hover:text-black"
                    >
                      <LayersIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      onClick={() => onOpenMultimodalEditModal(entry)}
                      aria-label="用 AI 編輯此圖像"
                      title="用 AI 編輯此圖像"
                      className="text-gray-500 hover:text-black"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      onClick={() => onToggleFavorite(entry.id)}
                      aria-label={entry.isFavorite ? uiTexts.unfavoriteImageButtonTooltip : uiTexts.favoriteImageButtonTooltip }
                      title={entry.isFavorite ? uiTexts.unfavoriteImageButtonTooltip : uiTexts.favoriteImageButtonTooltip }
                      className={entry.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-yellow-500"}
                    >
                      {entry.isFavorite ? <StarSolidIcon className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                    </IconButton>
                    <IconButton
                      onClick={() => onRestoreState(entry)}
                      aria-label="還原此提示詞狀態"
                      title="還原提示詞狀態至主應用"
                      className="text-gray-500 hover:text-black"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
