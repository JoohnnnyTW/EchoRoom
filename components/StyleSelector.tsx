
import React, { useState } from 'react';
import { DesignStyle, StyleSelectorProps as Props } from '../types'; // Updated import
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, TrashIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner'; 
import { IconButton } from './IconButton';

// Use Props interface directly for component props
export const StyleSelector: React.FC<Props> = ({
  styles,
  selectedStyle,
  onSelect,
  onShowAddStyleModal,
  title,
  onGenerateNewStyleSet,
  isLoadingAISuggestedStyles,
  aiSuggestedStylesError,
  geminiApiKeySet,
  thinkingMessages,
  currentThinkingIndex,
  onDeleteTermFromDetail,
  onDeleteStyle, // New prop for deleting the style itself
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const showThinkingProcess = isLoadingAISuggestedStyles && thinkingMessages.length > 0 && !aiSuggestedStylesError;

  const handleDeleteDetailTerm = (
    styleId: string,
    detailSetIndex: 0 | 1,
    termIndex: number,
    styleName: string,
    detailLabel: string,
    termEn: string,
    termZh: string
  ) => {
    const confirmMessage = `您確定要從風格「${styleName}」的「${detailLabel}」中刪除詞語「${termEn} / ${termZh}」嗎？\n此操作會將其從目前設定中移除（若要復原，需透過 AI 重新生成此風格的詳細資料或重設整體應用程式設定至預設值）。`;
    if (window.confirm(confirmMessage)) {
      onDeleteTermFromDetail(styleId, detailSetIndex, termIndex);
    }
  };

  const handleDeleteFullStyle = (event: React.MouseEvent, style: DesignStyle) => {
    event.stopPropagation(); // Prevent selecting the style when clicking delete
    const confirmMessage = `您確定要刪除設計風格「${style.nameZh} (${style.nameEn})」嗎？\n此操作會將其從目前設定中移除。\n若要復原預設風格，需重設核心內容或整體應用程式設定。`;
    if (window.confirm(confirmMessage)) {
      onDeleteStyle(style.id);
    }
  };


  return (
    <div className="border border-gray-200 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-3 text-left text-lg font-semibold text-gray-900/90 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 rounded-t-lg">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full active:scale-95 transform transition-transform duration-100"
            aria-expanded={isOpen}
            aria-controls="style-selector-content"
        >
            <span>{title}</span>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
        </button>
      </div>
      
      {isOpen && (
        <div id="style-selector-content" className="p-3 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-2">
            {styles.map((style) => (
              <div key={style.id} className="relative group">
                <button
                  onClick={() => onSelect(style)}
                  className={`w-full h-full p-3 rounded-lg border text-center transition-all duration-150 ease-in-out active:scale-95 transform
                              ${selectedStyle?.id === style.id 
                                ? 'bg-black text-white border-black shadow-lg scale-105 font-semibold' 
                                : `bg-white text-gray-800 border-gray-300 hover:border-gray-500 hover:shadow-md focus:ring-2 focus:ring-gray-500 focus:outline-none ${style.isCustom ? 'border-dashed border-gray-400' : ''}`
                              }`}
                  aria-pressed={selectedStyle?.id === style.id}
                >
                  <span className={`text-xs sm:text-sm ${selectedStyle?.id === style.id ? 'text-white' : 'text-gray-900/90'}`}>
                      {style.nameEn}
                  </span>
                  <span className={`block text-[10px] sm:text-xs ${selectedStyle?.id === style.id ? 'text-gray-300' : 'text-gray-600'}`}>
                      {style.nameZh}
                  </span>
                  {style.isCustom && !style.id.startsWith('core_style_') && <span className="block text-[9px] sm:text-[10px] text-gray-600 mt-0.5">(自訂)</span>}
                  {style.id.startsWith('core_style_') && style.isCustom === false && <span className="block text-[9px] sm:text-[10px] text-gray-600 mt-0.5">(AI)</span>}
                </button>
                <IconButton
                  onClick={(e) => handleDeleteFullStyle(e, style)}
                  aria-label={`刪除風格 ${style.nameZh}`}
                  title={`刪除風格 "${style.nameZh}"`}
                  className="absolute top-1 right-1 p-0.5 bg-white bg-opacity-50 hover:bg-opacity-100 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 active:scale-95 transform"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-3 border-t border-gray-200 rounded-b-lg bg-white space-y-2">
        <button
            onClick={onShowAddStyleModal}
            className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-800 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors active:scale-95 transform duration-100"
        >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            新增自訂風格
        </button>
        <button
            onClick={onGenerateNewStyleSet}
            disabled={isLoadingAISuggestedStyles || !geminiApiKeySet}
            className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform duration-100"
            title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : "使用 AI 建議新的風格"}
        >
            {isLoadingAISuggestedStyles ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
            {isLoadingAISuggestedStyles ? "AI 建議中..." : "AI 新增風格建議"}
        </button>
        {showThinkingProcess && (
           <div className="my-1 p-2 border border-gray-100 rounded-md bg-white text-xs">
              {thinkingMessages.map((message, index) => (
                <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                  {index < currentThinkingIndex ? <CheckCircleIcon className="w-3 h-3 mr-1.5 text-green-500 shrink-0" />
                   : index === currentThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1.5 text-blue-500 shrink-0" />
                   : <div className="w-3 h-3 mr-1.5 shrink-0 border border-gray-300 rounded-full" />}
                  <span className={`${index === currentThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                </div>
              ))}
          </div>
        )}
        {aiSuggestedStylesError && !isLoadingAISuggestedStyles && (
            <div className="mt-1 p-1.5 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-px"/>
                <span>{aiSuggestedStylesError}</span>
            </div>
        )}
      </div>
    </div>
  );
};
