
import React from 'react';
import { AISuggestionItem, SubjectPhraseSuggestionsModalProps as Props } from '../types';
import { XCircleIcon, CheckCircleIcon, SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

export const SubjectPhraseSuggestionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  suggestions,
  onApplySuggestion,
  isLoadingSuggestions,
  title,
  thinkingProcessMessages,
  currentThinkingMessageIndex,
  error,
  onRegenerate,
}) => {
  if (!isOpen) return null;

  const showThinkingProcess = isLoadingSuggestions && thinkingProcessMessages.length > 0;
  const showGenericLoader = isLoadingSuggestions && !showThinkingProcess && suggestions.length === 0;
  const showNoSuggestionsMessage = !isLoadingSuggestions && suggestions.length === 0 && !error;
  const showError = !isLoadingSuggestions && error;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[75] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-phrase-suggestions-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="subject-phrase-suggestions-title" className="text-xl font-semibold text-gray-800 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-black" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉建議"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        {showThinkingProcess && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600 min-h-[200px]">
            <div className="w-full text-left space-y-2 mb-4">
              {thinkingProcessMessages.map((message, index) => (
                <div key={index} className={`flex items-center text-sm transition-opacity duration-500 ${index <= currentThinkingMessageIndex ? 'opacity-100' : 'opacity-50'}`}>
                  {index < currentThinkingMessageIndex ? (
                    <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                  ) : index === currentThinkingMessageIndex ? (
                    <LoadingSpinner className="w-4 h-4 mr-2.5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 mr-2 flex-shrink-0 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={`${index === currentThinkingMessageIndex ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                    {message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showGenericLoader && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600 min-h-[200px]">
            <LoadingSpinner className="w-10 h-10 mb-3" />
            <p>AI 正在思考主體內容建議...</p>
          </div>
        )}
        
        {showError && (
          <div className="my-4 p-3 bg-red-50 border border-red-300 rounded-md text-sm text-red-700 flex items-start min-h-[100px] justify-center flex-col">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2 flex-shrink-0"/>
              <span className="font-semibold">建議獲取錯誤</span>
            </div>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {showNoSuggestionsMessage && (
          <p className="text-gray-600 text-center py-8 min-h-[150px]">AI 未能提供主體內容建議。請調整參考文字或稍後重試。</p>
        )}

        {!isLoadingSuggestions && !error && suggestions.length > 0 && (
          <div className="space-y-3 overflow-y-auto apple-scroll pr-2 mb-4 max-h-[calc(85vh-220px)] min-h-[150px]">
            <p className="text-sm text-gray-600 mb-2">點擊下方任一建議，以將其套用至主要描述欄位：</p>
            {suggestions.map((item, index) => (
              <button
                key={index}
                onClick={() => onApplySuggestion(item)}
                className="w-full text-left p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 border-gray-200 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                aria-label={`套用建議: ${item.suggestionEn}`}
              >
                <p className="font-medium text-gray-700 text-sm"><strong>En:</strong> {item.suggestionEn}</p>
                <p className="text-xs text-gray-500 mt-0.5"><strong>Zh:</strong> {item.suggestionZh}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onRegenerate}
            disabled={isLoadingSuggestions}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isLoadingSuggestions ? "思考中..." : "重新生成建議"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
