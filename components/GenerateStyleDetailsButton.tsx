import React from 'react';
import { SparklesIcon, ExclamationTriangleIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface GenerateStyleDetailsButtonProps {
  onClick: () => void;
  isLoading: boolean;
  error: string | null;
  disabled?: boolean;
  geminiApiKeySet: boolean;
}

export const GenerateStyleDetailsButton: React.FC<GenerateStyleDetailsButtonProps> = ({
  onClick,
  isLoading,
  error,
  disabled,
  geminiApiKeySet
}) => {
  const isDisabled = disabled || isLoading || !geminiApiKeySet;
  let title = "使用 AI 生成風格詳細資訊";
  if (!geminiApiKeySet) {
    title = "Gemini API 金鑰未設定，無法使用此功能";
  } else if (disabled && geminiApiKeySet) {
    title = "請先選擇一個風格";
  }


  return (
    <div className="mt-3">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        title={title}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" /> 正在生成...
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4 mr-2" /> 使用 AI 生成詳細資訊
          </>
        )}
      </button>
      {error && (
        <div className="mt-2 p-1.5 bg-red-50 border border-red-300 rounded-md text-[10px] text-red-700 flex items-start">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1 flex-shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};