
import React from 'react';
import { ImageHistoryEntry, ImageEngine } from '../types';
import { EyeIcon, ArrowPathIcon } from './Icons';
import { IconButton } from './IconButton';

interface ImageHistoryDisplayProps {
  history: ImageHistoryEntry[];
  onViewImage: (image: ImageHistoryEntry) => void;
  onRestoreState: (historyEntry: ImageHistoryEntry) => void;
}

const getEngineDisplayName = (engine: ImageEngine): string => {
  switch (engine) {
    case 'gemini':
      return 'Gemini';
    case 'openai':
      return 'OpenAI';
    case 'bfl_ai':
      return 'BFL.ai';
    default:
      return engine;
  }
};

export const ImageHistoryDisplay: React.FC<ImageHistoryDisplayProps> = ({ history, onViewImage, onRestoreState }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-lg mt-6">
        <h3 className="text-md font-semibold text-gray-800 mb-2">圖像生成歷史</h3>
        <p className="text-sm text-gray-500 text-center py-4">尚無生成歷史記錄。</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg mt-6">
      <h3 className="text-md font-semibold text-gray-800 mb-3">圖像生成歷史</h3>
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
              </p>
              <p className="text-xs text-gray-400">
                引擎: <span className="font-medium text-gray-600">{getEngineDisplayName(entry.engine)}</span>
              </p>
              <p className="text-xs text-gray-700 truncate" title={entry.prompt}>
                <strong>提示詞:</strong> {entry.promptState.selectedStyleId ? entry.promptState.selectedStyleId.split('_')[1] : 'N/A'} - {entry.prompt.substring(0, 50)}...
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 flex-shrink-0">
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
