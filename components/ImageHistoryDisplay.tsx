import React from 'react';
import { ImageHistoryEntry, ImageEngine } from '../types';
import { EyeIcon, ArrowPathIcon, TrashIcon, StarIcon, StarSolidIcon, PencilSquareIcon, LayersIcon } from './Icons'; // Added LayersIcon
import { IconButton } from './IconButton';
import { SettingsContext } from '../contexts/SettingsContext'; // For UI Texts
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts'; // For UI Texts

interface ImageHistoryDisplayProps {
  history: ImageHistoryEntry[];
  onViewImage: (image: ImageHistoryEntry) => void;
  onRestoreState: (historyEntry: ImageHistoryEntry) => void;
  onClearAllHistory: () => void;
  onToggleFavorite: (imageId: string) => void;
  onOpenMultimodalEditModal: (image: ImageHistoryEntry) => void;
  onOpenImageFusionStudio: (image: ImageHistoryEntry) => void; // New prop
  title: string;
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
      // This case should ideally not be reached if all ImageEngine types are handled above.
      // If it is, it means ImageEngine type was updated but this function was not.
      const exhaustiveCheck: never = engine;
      console.warn(`Unhandled image engine in getEngineDisplayName: ${engine}`);
      return String(exhaustiveCheck); // Fallback, though TS should prevent this with correct cases.
  }
};

export const ImageHistoryDisplay: React.FC<ImageHistoryDisplayProps> = ({
  history,
  onViewImage,
  onRestoreState,
  onClearAllHistory,
  onToggleFavorite,
  onOpenMultimodalEditModal,
  onOpenImageFusionStudio, // New
  title
}) => {
  const settingsContext = React.useContext(SettingsContext);
  const uiTexts = settingsContext?.settings.uiTexts || DEFAULT_UI_TEXTS;

  if (history.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-lg mt-6">
        <h3 className="text-md font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center py-4">尚無生成歷史記錄。</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-gray-800">{title}</h3>
        {history.length > 0 && (
          <IconButton
            onClick={onClearAllHistory}
            aria-label={uiTexts.clearHistoryButtonTooltip.textZh}
            title={uiTexts.clearHistoryButtonTooltip.textZh}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            <span className="text-xs">{uiTexts.clearHistoryButtonLabel.textZh}</span>
          </IconButton>
        )}
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto apple-scroll pr-2">
        {history.map((entry) => (
          <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <img
              src={entry.src}
              alt={`歷史圖像 ${entry.id}`}
              className="w-20 h-20 object-cover rounded-md cursor-pointer flex-shrink-0"
              onClick={() => onViewImage(entry)}
            />
            <div className="flex-grow min-w-0">
              <p className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleString()}
                {entry.editBaseImageId && <span className="text-blue-500 ml-1">(編輯自 {entry.editBaseImageId.substring(0,8)}...)</span>}
              </p>
              <p className="text-xs text-gray-400">
                引擎: <span className="font-medium text-gray-600">{getEngineDisplayName(entry.engine)}</span>
              </p>
              <p className="text-xs text-gray-700 truncate" title={entry.prompt}>
                <strong>提示詞:</strong> {entry.promptState.selectedStyleId ? entry.promptState.selectedStyleId.split('_')[1] : 'N/A'} - {entry.prompt.substring(0, 50)}...
              </p>
               {entry.editInstruction && (
                <p className="text-xs text-blue-600 truncate" title={`編輯指令: ${entry.editInstruction}`}>
                  <strong>編輯指令:</strong> {entry.editInstruction.substring(0,40)}...
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 flex-shrink-0">
              <IconButton
                onClick={() => onOpenImageFusionStudio(entry)} // New
                aria-label={uiTexts.imageFusionStudioOpenButtonTooltip.textZh}
                title={uiTexts.imageFusionStudioOpenButtonTooltip.textZh}
                className="text-gray-600 hover:text-black"
              >
                <LayersIcon className="w-5 h-5" />
              </IconButton>
              <IconButton
                onClick={() => onOpenMultimodalEditModal(entry)}
                aria-label="用 AI 編輯此圖像"
                title="用 AI 編輯此圖像"
                className="text-gray-600 hover:text-black"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </IconButton>
              <IconButton
                onClick={() => onToggleFavorite(entry.id)}
                aria-label={entry.isFavorite ? uiTexts.unfavoriteImageButtonTooltip.textZh : uiTexts.favoriteImageButtonTooltip.textZh}
                title={entry.isFavorite ? uiTexts.unfavoriteImageButtonTooltip.textZh : uiTexts.favoriteImageButtonTooltip.textZh}
                className={entry.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-gray-400 hover:text-yellow-500"}
              >
                {entry.isFavorite ? <StarSolidIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
              </IconButton>
              <IconButton
                onClick={() => onViewImage(entry)}
                aria-label="放大檢視圖像"
                className="text-gray-600 hover:text-black"
                title="放大檢視"
              >
                <EyeIcon className="w-5 h-5" />
              </IconButton>
              <IconButton
                onClick={() => onRestoreState(entry)}
                aria-label="還原此提示詞狀態"
                className="text-gray-600 hover:text-black"
                title="還原提示詞"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
