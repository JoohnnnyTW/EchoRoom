
import React from 'react';
import { AISuggestedTerm, PromptTerm, SelectedPromptTerm } from '../types';
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestedTerm[];
  onAddTerm: (term: PromptTerm) => void;
  activeTerms: Map<string, SelectedPromptTerm>;
  onRegenerate: () => void;
  isLoadingSuggestions: boolean;
  title: string;
  thinkingProcessMessages: string[];
  currentThinkingMessageIndex: number;
  error: string | null;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onAddTerm,
  activeTerms,
  onRegenerate,
  isLoadingSuggestions,
  title,
  thinkingProcessMessages,
  currentThinkingMessageIndex,
  error,
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
      aria-labelledby="ai-suggestions-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="ai-suggestions-title" className="text-xl font-semibold text-gray-800 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-black" />
            {title}
          </h2>
          <IconButton onClick={onClose} aria-label="關閉建議" className="text-gray-400 hover:text-gray-600">
            <XCircleIcon className="w-7 h-7" />
          </IconButton>
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
            <p>AI 正在思考關鍵詞建議...</p>
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
          <p className="text-gray-600 text-center py-8 min-h-[150px]">AI 未能提供建議。請調整風格或稍後重試。</p>
        )}

        {!isLoadingSuggestions && !error && suggestions.length > 0 && (
          <div className="space-y-2 overflow-y-auto apple-scroll pr-2 mb-4 max-h-[calc(85vh-220px)] min-h-[150px]">
            <p className="text-sm text-gray-600 mb-1.5">點擊下方任一建議，以新增或移除該詞語：</p>
            {suggestions.map((term) => {
              const isSelected = activeTerms.has(term.id);
              return (
                <button
                  key={term.id}
                  onClick={() => onAddTerm(term)}
                  className={`w-full text-left p-2.5 rounded-lg border cursor-pointer transition-colors flex items-center justify-between
                              ${isSelected ? 'bg-gray-200 border-gray-400 ring-1 ring-gray-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                  aria-pressed={isSelected}
                >
                  <div>
                    <p className={`font-medium text-sm ${isSelected ? 'text-gray-800' : 'text-gray-700'}`}>{term.termEn}</p>
                    <p className={`text-xs ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>{term.termZh}</p>
                  </div>
                  <div className={`p-1 rounded-full transition-colors ${isSelected ? 'text-black' : 'text-gray-500'}`}>
                    {isSelected ? <MinusCircleIcon className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5 opacity-70" />}
                  </div>
                </button>
              );
            })}
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
