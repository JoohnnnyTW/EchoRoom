import React, { useState, useEffect } from 'react';
import { XCircleIcon, LanguageIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface AddRoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoomType: (termEn: string, termZh: string) => void;
  onTranslateTerm: (text: string, targetLanguage: 'en' | 'zh') => Promise<string | null>;
  geminiApiKeySet: boolean;
  title: string;
}

export const AddRoomTypeModal: React.FC<AddRoomTypeModalProps> = ({
  isOpen,
  onClose,
  onAddRoomType,
  onTranslateTerm,
  geminiApiKeySet,
  title,
}) => {
  const [termEn, setTermEn] = useState('');
  const [termZh, setTermZh] = useState('');
  const [error, setError] = useState('');
  const [isTranslatingEn, setIsTranslatingEn] = useState(false);
  const [translateEnError, setTranslateEnError] = useState<string | null>(null);
  const [isTranslatingZh, setIsTranslatingZh] = useState(false);
  const [translateZhError, setTranslateZhError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTermEn('');
      setTermZh('');
      setError('');
      setTranslateEnError(null);
      setTranslateZhError(null);
      setIsTranslatingEn(false);
      setIsTranslatingZh(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTranslateToEnglish = async () => {
    if (!termZh.trim()) {
      setTranslateEnError('請先輸入中文名稱以進行翻譯。');
      return;
    }
    if (!geminiApiKeySet) {
      setTranslateEnError('Gemini API 金鑰未設定，無法翻譯。');
      return;
    }
    setIsTranslatingEn(true);
    setTranslateEnError(null);
    try {
      const translated = await onTranslateTerm(termZh, 'en');
      if (translated) setTermEn(translated);
      else setTranslateEnError('翻譯失敗或未返回結果。');
    } catch (e: any) {
      setTranslateEnError(`翻譯時發生錯誤: ${e.message || '未知錯誤'}`);
    } finally {
      setIsTranslatingEn(false);
    }
  };

  const handleTranslateToChinese = async () => {
    if (!termEn.trim()) {
      setTranslateZhError('請先輸入英文名稱以進行翻譯。');
      return;
    }
    if (!geminiApiKeySet) {
      setTranslateZhError('Gemini API 金鑰未設定，無法翻譯。');
      return;
    }
    setIsTranslatingZh(true);
    setTranslateZhError(null);
    try {
      const translated = await onTranslateTerm(termEn, 'zh');
      if (translated) setTermZh(translated);
      else setTranslateZhError('翻譯失敗或未返回結果。');
    } catch (e: any) {
      setTranslateZhError(`翻譯時發生錯誤: ${e.message || '未知錯誤'}`);
    } finally {
      setIsTranslatingZh(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termEn.trim() || !termZh.trim()) {
      setError('英文和中文名稱皆不可為空。');
      return;
    }
    setError('');
    onAddRoomType(termEn, termZh);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[70] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-room-type-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-room-type-modal-title" className="text-xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉新增空間類型視窗"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-end mb-1">
                <label htmlFor="roomTypeTermZh" className="block text-sm font-medium text-gray-700">
                空間類型中文名稱 <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={handleTranslateToEnglish}
                    disabled={isTranslatingEn || !termZh.trim() || !geminiApiKeySet}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingEn ? "翻譯中..." : "使用 AI 將中文翻譯成英文")}
                >
                    {isTranslatingEn ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                    譯成英文
                </button>
            </div>
            <input
              type="text"
              id="roomTypeTermZh"
              value={termZh}
              onChange={(e) => {
                setTermZh(e.target.value);
                if (translateEnError) setTranslateEnError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              required
            />
             {translateEnError && <p className="text-xs text-red-500 mt-1">{translateEnError}</p>}
          </div>

          <div>
             <div className="flex justify-between items-end mb-1">
                <label htmlFor="roomTypeTermEn" className="block text-sm font-medium text-gray-700">
                空間類型英文名稱 <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={handleTranslateToChinese}
                    disabled={isTranslatingZh || !termEn.trim() || !geminiApiKeySet}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingZh ? "翻譯中..." : "使用 AI 將英文翻譯成中文")}
                >
                    {isTranslatingZh ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                    譯成中文
                </button>
            </div>
            <input
              type="text"
              id="roomTypeTermEn"
              value={termEn}
              onChange={(e) => {
                setTermEn(e.target.value);
                if (translateZhError) setTranslateZhError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              required
            />
            {translateZhError && <p className="text-xs text-red-500 mt-1">{translateZhError}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              新增空間類型
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
