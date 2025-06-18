import React, { useState, useEffect, useContext } from 'react';
import { XCircleIcon, LanguageIcon, SparklesIcon } from './Icons'; // Added SparklesIcon
import { LoadingSpinner } from './LoadingSpinner';
import { AddCustomTermModalInitialData, PromptCategoryDisplay, AddCustomTermModalOnSaveData, UITexts, AddCustomTermModalProps as ModalProps } from '../types'; // Renamed to ModalProps
import { SettingsContext } from '../contexts/SettingsContext';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts';
import { IconButton } from './IconButton';

// Define constants for special category IDs (these should match those used in App.tsx)
export const DESIGN_STYLE_QUICK_ADD_CATEGORY_ID = "__QUICK_ADD_TARGET_DESIGN_STYLE__";
export const ROOM_TYPE_QUICK_ADD_CATEGORY_ID = "__QUICK_ADD_TARGET_ROOM_TYPE__";

interface AddCustomTermModalProps extends ModalProps {}


export const AddCustomTermModal: React.FC<AddCustomTermModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onTranslate,
  initialData,
  showCategorySelector,
  allCategories = [],
  geminiApiKeySet,
  modalTitleKey,
  onShowAISuggestions, // New prop
}) => {
  const settingsContext = useContext(SettingsContext);
  const uiTexts = settingsContext?.settings.uiTexts || DEFAULT_UI_TEXTS;

  const [termEn, setTermEn] = useState('');
  const [termZh, setTermZh] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [error, setError] = useState('');
  
  const [isTranslatingEn, setIsTranslatingEn] = useState(false);
  const [translateEnError, setTranslateEnError] = useState<string | null>(null);
  const [isTranslatingZh, setIsTranslatingZh] = useState(false);
  const [translateZhError, setTranslateZhError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTermEn(initialData?.termEn || '');
      setTermZh(initialData?.termZh || '');
      // For quick add, default to Design Style if available, else first regular category
      if (modalTitleKey === 'addCustomTermModalQuickAddTitle' && showCategorySelector) {
        setSelectedCategoryId(DESIGN_STYLE_QUICK_ADD_CATEGORY_ID); 
      } else {
        setSelectedCategoryId(initialData?.preselectCategoryId || (allCategories.length > 0 ? allCategories[0].id : ''));
      }
      setError('');
      setTranslateEnError(null);
      setTranslateZhError(null);
    }
  }, [isOpen, initialData, allCategories, modalTitleKey, showCategorySelector]);

  if (!isOpen) return null;

  const handleTranslateToEnglish = async () => {
    if (!termZh.trim()) {
      setTranslateEnError('請先輸入中文詞語以翻譯成英文。');
      return;
    }
    if (!geminiApiKeySet) {
      setTranslateEnError('Gemini API 金鑰未設定，無法翻譯。');
      return;
    }
    setIsTranslatingEn(true);
    setTranslateEnError(null);
    try {
      const translation = await onTranslate(termZh, 'en');
      if (translation) setTermEn(translation);
      else setTranslateEnError('翻譯失敗或未返回結果。');
    } catch (e: any) {
      setTranslateEnError(`翻譯時發生錯誤: ${e.message || '未知錯誤'}`);
    } finally {
      setIsTranslatingEn(false);
    }
  };

  const handleTranslateToChinese = async () => {
    if (!termEn.trim()) {
      setTranslateZhError('請先輸入英文詞語以翻譯成中文。');
      return;
    }
     if (!geminiApiKeySet) {
      setTranslateZhError('Gemini API 金鑰未設定，無法翻譯。');
      return;
    }
    setIsTranslatingZh(true);
    setTranslateZhError(null);
    try {
      const translation = await onTranslate(termEn, 'zh');
      if (translation) setTermZh(translation);
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
      setError('英文和中文詞語皆不可為空。');
      return;
    }
    if (showCategorySelector && !selectedCategoryId) {
      setError('請選擇一個分類。');
      return;
    }
    setError('');
    
    const finalCategoryId = showCategorySelector ? selectedCategoryId : initialData?.preselectCategoryId || '';
    if (!finalCategoryId) {
        setError('未能確定目標分類。');
        return;
    }

    onSave({
      termEn: termEn.trim(),
      termZh: termZh.trim(),
      selectedCategoryId: finalCategoryId,
      termIdToUpdate: initialData?.termId,
    });
    onClose(); 
  };
  
  const currentModalTitleText = uiTexts[modalTitleKey]?.textZh || "新增/儲存詞語";
  
  let categoryNameToDisplay = initialData?.categoryNameForDisplay || "";
  let resolvedCategoryIdForAISuggestions = initialData?.preselectCategoryId || "";
  let resolvedCategoryNameEnForAISuggestions = "";
  let resolvedCategoryNameZhForAISuggestions = "";


  if (showCategorySelector && selectedCategoryId) {
      resolvedCategoryIdForAISuggestions = selectedCategoryId;
      if (selectedCategoryId === DESIGN_STYLE_QUICK_ADD_CATEGORY_ID) {
          categoryNameToDisplay = "設計風格";
          resolvedCategoryNameEnForAISuggestions = "Design Style"; // Placeholder, AI suggest for these meta cats might be disabled
          resolvedCategoryNameZhForAISuggestions = "設計風格";
      } else if (selectedCategoryId === ROOM_TYPE_QUICK_ADD_CATEGORY_ID) {
          categoryNameToDisplay = "空間類型";
          resolvedCategoryNameEnForAISuggestions = "Room Type"; // Placeholder
          resolvedCategoryNameZhForAISuggestions = "空間類型";
      } else {
          const cat = allCategories.find(c => c.id === selectedCategoryId);
          categoryNameToDisplay = cat?.nameZh || "選擇的分類";
          resolvedCategoryNameEnForAISuggestions = cat?.nameEn || "";
          resolvedCategoryNameZhForAISuggestions = cat?.nameZh || "";
      }
  } else if (initialData?.preselectCategoryId && initialData?.categoryNameForDisplay) {
      const names = initialData.categoryNameForDisplay.split(' / ');
      resolvedCategoryNameEnForAISuggestions = names[0] || "";
      resolvedCategoryNameZhForAISuggestions = names[1] || names[0] || "";
  }


  const filledTitle = currentModalTitleText.replace('{categoryName}', categoryNameToDisplay || "目標分類");
  
  const canShowAISuggestionsButton = geminiApiKeySet && 
                                  resolvedCategoryIdForAISuggestions &&
                                  resolvedCategoryIdForAISuggestions !== DESIGN_STYLE_QUICK_ADD_CATEGORY_ID &&
                                  resolvedCategoryIdForAISuggestions !== ROOM_TYPE_QUICK_ADD_CATEGORY_ID;

  const handleAISuggestionsClick = () => {
    if (canShowAISuggestionsButton && resolvedCategoryNameEnForAISuggestions && resolvedCategoryNameZhForAISuggestions) {
        onShowAISuggestions({
            id: resolvedCategoryIdForAISuggestions,
            nameEn: resolvedCategoryNameEnForAISuggestions,
            nameZh: resolvedCategoryNameZhForAISuggestions,
        }, termEn, termZh); // Pass current terms as potential seed
    }
  };


  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[80] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-term-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-term-modal-title" className="text-xl font-semibold text-gray-800">
            {filledTitle}
          </h2>
          <div className="flex items-center space-x-2">
            {canShowAISuggestionsButton && (
                <IconButton
                    onClick={handleAISuggestionsClick}
                    title="AI 建議此分類相關詞語"
                    aria-label="使用 AI 建議此分類的相關提示詞"
                    className="text-gray-600 hover:text-black"
                >
                    <SparklesIcon className="w-5 h-5" />
                </IconButton>
            )}
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="關閉視窗"
            >
                <XCircleIcon className="w-7 h-7" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showCategorySelector && (
            <div>
              <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-1">
                選擇分類 <span className="text-red-500">*</span>
              </label>
              <select
                id="categorySelect"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
                required
              >
                <option value="" disabled>-- 請選擇一個分類 --</option>
                {modalTitleKey === 'addCustomTermModalQuickAddTitle' && (
                  <>
                    <option value={DESIGN_STYLE_QUICK_ADD_CATEGORY_ID}>新增為：設計風格</option>
                    <option value={ROOM_TYPE_QUICK_ADD_CATEGORY_ID}>新增為：空間類型</option>
                    <option value="" disabled>──────────────────</option>
                  </>
                )}
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nameZh} / {cat.nameEn}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between items-end mb-1">
              <label htmlFor="termZh" className="block text-sm font-medium text-gray-700">
                {selectedCategoryId === DESIGN_STYLE_QUICK_ADD_CATEGORY_ID ? '風格中文名稱' : selectedCategoryId === ROOM_TYPE_QUICK_ADD_CATEGORY_ID ? '空間類型中文名稱' : '中文詞語'}
                <span className="text-red-500">*</span>
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
              id="termZh"
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
              <label htmlFor="termEn" className="block text-sm font-medium text-gray-700">
                 {selectedCategoryId === DESIGN_STYLE_QUICK_ADD_CATEGORY_ID ? '風格英文名稱' : selectedCategoryId === ROOM_TYPE_QUICK_ADD_CATEGORY_ID ? '空間類型英文名稱' : '英文詞語'}
                 <span className="text-red-500">*</span>
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
              id="termEn"
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
              {initialData?.termId ? '儲存變更' : 
               (selectedCategoryId === DESIGN_STYLE_QUICK_ADD_CATEGORY_ID ? '新增風格' : 
                selectedCategoryId === ROOM_TYPE_QUICK_ADD_CATEGORY_ID ? '新增空間類型' : '新增詞語')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
