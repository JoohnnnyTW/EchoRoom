
import React, { useState } from 'react';
import { XCircleIcon, LanguageIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface AddStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStyle: (nameEn: string, nameZh: string) => void;
  onTranslateName: (nameZh: string) => Promise<string | null>; 
  geminiApiKeySet: boolean; 
  title: string; // Added title prop
}

export const AddStyleModal: React.FC<AddStyleModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddStyle,
  onTranslateName,
  geminiApiKeySet,
  title
}) => {
  const [nameEn, setNameEn] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [error, setError] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!nameZh.trim()) {
      setTranslateError('請先輸入中文名稱以進行翻譯。');
      return;
    }
    if (!geminiApiKeySet) {
      setTranslateError('Gemini API 金鑰未設定，無法翻譯。');
      return;
    }

    setIsTranslating(true);
    setTranslateError(null);
    try {
      const translatedName = await onTranslateName(nameZh);
      if (translatedName) {
        setNameEn(translatedName);
      } else {
        setTranslateError('翻譯失敗或未返回結果。');
      }
    } catch (e: any) {
      setTranslateError(`翻譯時發生錯誤: ${e.message || '未知錯誤'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameZh.trim()) {
      setError('英文和中文名稱皆不可為空。');
      return;
    }
    setError('');
    onAddStyle(nameEn, nameZh);
    setNameEn('');
    setNameZh('');
    setTranslateError(null);
    onClose();
  };

  const handleModalClose = () => {
    setNameEn('');
    setNameZh('');
    setError('');
    setTranslateError(null);
    setIsTranslating(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[70] transition-opacity duration-300 ease-in-out"
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-style-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-style-modal-title" className="text-xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={handleModalClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉新增風格視窗"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="styleNameZh" className="block text-sm font-medium text-gray-700 mb-1">
              風格中文名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="styleNameZh"
              value={nameZh}
              onChange={(e) => {
                setNameZh(e.target.value);
                if (translateError) setTranslateError(null); 
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
                <label htmlFor="styleNameEn" className="block text-sm font-medium text-gray-700">
                風格英文名稱 <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating || !nameZh.trim() || !geminiApiKeySet}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslating ? "翻譯中..." : "使用 AI 翻譯中文名稱")}
                >
                    {isTranslating ? (
                        <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                    ) : (
                        <LanguageIcon className="w-3.5 h-3.5 mr-1" />
                    )}
                    AI 翻譯
                </button>
            </div>
            <input
              type="text"
              id="styleNameEn"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              required
            />
            {translateError && <p className="text-xs text-red-500 mt-1">{translateError}</p>}
          </div>


          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              新增風格
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
