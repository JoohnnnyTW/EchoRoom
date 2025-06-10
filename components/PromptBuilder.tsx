
import React from 'react';
import { SelectedPromptTerm } from '../types';
import { PromptTermChip } from './PromptTermChip';
import { ClipboardDocumentIcon, SparklesIcon, ExclamationTriangleIcon, TrashIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton';

interface PromptBuilderProps {
  activeTerms: SelectedPromptTerm[];
  onUpdateWeight: (termId: string, delta: number) => void;
  onToggleLock: (termId: string) => void;
  onRemoveTerm: (termId: string) => void;
  onClearAllTerms: () => void;
  generatedPromptEn: string;
  generatedPromptZh: string;
  onPolishPrompt: (language: 'en' | 'zh') => void;
  isPolishingEn: boolean;
  isPolishingZh: boolean;
  polishError: string | null;
  clearPolishError: () => void;
  geminiApiKeySet: boolean; // Added to control AI features
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({ 
  activeTerms, 
  onUpdateWeight, 
  onToggleLock, 
  onRemoveTerm,
  onClearAllTerms,
  generatedPromptEn,
  generatedPromptZh,
  onPolishPrompt,
  isPolishingEn,
  isPolishingZh,
  polishError,
  clearPolishError,
  geminiApiKeySet
}) => {

  const copyToClipboard = (text: string, lang: '英文' | '中文') => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${lang}提示詞已複製到剪貼簿！`);
    }).catch(err => {
      console.error('複製提示詞失敗: ', err);
      alert(`複製${lang}提示詞失敗。`);
    });
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800">已選提示詞</h3>
            {activeTerms.length > 0 && (
                <IconButton
                    onClick={onClearAllTerms}
                    aria-label="全部清除已選提示詞"
                    title="全部清除"
                    className="text-gray-600 hover:text-black"
                >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">全部清除</span>
                </IconButton>
            )}
        </div>
        {activeTerms.length === 0 ? (
          <p className="text-sm text-gray-500">從分類中選擇詞語以建立您的提示詞。</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto apple-scroll p-1">
            {activeTerms.map((term) => (
              <PromptTermChip
                key={term.id}
                term={term}
                onUpdateWeight={onUpdateWeight}
                onToggleLock={onToggleLock}
                onRemove={onRemoveTerm}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-gray-200">
        {polishError && (
            <div className="my-2 p-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-700 flex items-start justify-between">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5"/>
                    <span><strong>潤飾錯誤:</strong> {polishError}</span>
                </div>
                <button onClick={clearPolishError} className="text-gray-600 hover:text-black text-xs font-semibold">&times;</button>
            </div>
        )}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="promptEn" className="block text-sm font-medium text-gray-700">英文提示詞</label>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPolishPrompt('en')}
                    disabled={isPolishingEn || !generatedPromptEn || !geminiApiKeySet}
                    className="text-xs text-gray-600 hover:text-black flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isPolishingEn ? "潤飾中..." : "使用AI潤飾英文提示詞")}
                >
                    {isPolishingEn ? <LoadingSpinner className="w-3.5 h-3.5"/> : <SparklesIcon className="w-3.5 h-3.5" />}
                    <span>潤飾</span>
                </button>
                <button
                    onClick={() => copyToClipboard(generatedPromptEn, '英文')}
                    className="text-xs text-gray-600 hover:text-black flex items-center space-x-1"
                    title="複製英文提示詞"
                >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    <span>複製</span>
                </button>
            </div>
          </div>
          <textarea
            id="promptEn"
            rows={4}
            readOnly
            value={generatedPromptEn}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm text-gray-700 focus:ring-gray-500 focus:border-gray-500"
            placeholder="英文提示詞將顯示於此..."
            aria-label="英文提示詞輸出區域"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="promptZh" className="block text-sm font-medium text-gray-700">中文提示詞</label>
            <div className="flex items-center space-x-2">
                 <button
                    onClick={() => onPolishPrompt('zh')}
                    disabled={isPolishingZh || !generatedPromptZh || !geminiApiKeySet}
                    className="text-xs text-gray-600 hover:text-black flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isPolishingZh ? "潤飾中..." : "使用AI潤飾中文提示詞")}
                >
                    {isPolishingZh ? <LoadingSpinner className="w-3.5 h-3.5"/> : <SparklesIcon className="w-3.5 h-3.5" />}
                    <span>潤飾</span>
                </button>
                <button
                    onClick={() => copyToClipboard(generatedPromptZh, '中文')}
                    className="text-xs text-gray-600 hover:text-black flex items-center space-x-1"
                    title="複製中文提示詞"
                >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    <span>複製</span>
                </button>
            </div>
          </div>
          <textarea
            id="promptZh"
            rows={4}
            readOnly
            value={generatedPromptZh}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm text-gray-700 focus:ring-gray-500 focus:border-gray-500"
            placeholder="中文提示詞將顯示於此..."
            aria-label="中文提示詞輸出區域"
          />
        </div>
      </div>
    </div>
  );
};
