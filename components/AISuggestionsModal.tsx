
import React from 'react';
import { AISuggestedTerm, PromptTerm, SelectedPromptTerm } from '../types'; // Changed InitialPromptTerm to PromptTerm
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon, ArrowPathIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestedTerm[];
  onAddTerm: (term: PromptTerm) => void; // Changed InitialPromptTerm to PromptTerm
  activeTerms: Map<string, SelectedPromptTerm>;
  onRegenerate: () => void;
  isLoadingSuggestions: boolean;
}

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({ 
  isOpen, 
  onClose, 
  suggestions, 
  onAddTerm, 
  activeTerms,
  onRegenerate,
  isLoadingSuggestions
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-suggestions-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="ai-suggestions-title" className="text-xl font-semibold text-gray-800">AI 提示詞建議</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉建議"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        {isLoadingSuggestions && suggestions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-8 text-gray-600">
             <LoadingSpinner className="w-10 h-10 mb-3" />
             <p>正在努力為您獲取建議...</p>
           </div>
        ) : suggestions.length === 0 && !isLoadingSuggestions ? (
          <p className="text-gray-600 text-center py-8">目前沒有新的建議，或 AI 未能提供合適的詞語。您可以嘗試調整風格/空間，或點擊下方按鈕重新獲取。</p>
        ) : (
          <div className="space-y-3 overflow-y-auto apple-scroll pr-2 mb-4">
            <p className="text-sm text-gray-600 mb-2">以下是 AI 建議的一些詞語。點擊即可將其添加到您的提示詞中，再次點擊可移除：</p>
            {suggestions.map((term) => {
              const isAdded = activeTerms.has(term.id);
              return (
                <div 
                  key={term.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                              ${isAdded ? 'bg-gray-200 border-gray-400' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                  onClick={() => onAddTerm(term)}
                  role="button"
                  aria-pressed={isAdded}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAddTerm(term);}}
                >
                  <div>
                    <p className={`font-medium ${isAdded ? 'text-gray-800' : 'text-gray-700'}`}>{term.termEn}</p>
                    <p className={`text-xs ${isAdded ? 'text-gray-600' : 'text-gray-500'}`}>{term.termZh}</p>
                  </div>
                  <div
                    className={`p-1.5 rounded-full transition-colors
                                ${isAdded 
                                  ? 'text-black' 
                                  : 'text-black hover:bg-gray-200'
                                }`}
                    aria-label={isAdded ? `移除詞語 ${term.termEn}` : `新增詞語 ${term.termEn}`}
                  >
                    {isAdded ? <MinusCircleIcon className="w-6 h-6" /> : <PlusCircleIcon className="w-6 h-6" />}
                  </div>
                </div>
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
            {isLoadingSuggestions ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" /> 重新獲取中...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2" /> 重新獲取建議
              </>
            )}
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
