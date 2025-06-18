
import React, { useState, useEffect, useCallback } from 'react';
import { XCircleIcon, PlusCircleIcon, ExclamationTriangleIcon, LanguageIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import { AddCategoryModalProps as ModalProps, AISystemPrompts } from '../types'; // Renamed to ModalProps
import { LoadingSpinner } from './LoadingSpinner';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";

interface AddCategoryModalProps extends ModalProps {
  onTranslateNameForModal: (text: string, targetLanguage: 'en' | 'zh') => Promise<string | null>;
}


export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
  existingCategoryIds,
  uiTexts,
  geminiApiKeySet,
  ai,
  fillPromptTemplate,
  aiSystemPrompts,
  onTranslateNameForModal,
}) => {
  const [nameEn, setNameEn] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [isOpenDefault, setIsOpenDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [aiIdError, setAiIdError] = useState<string | null>(null);
  const [idGenerationAttempted, setIdGenerationAttempted] = useState(false);

  const [isTranslatingNameToEn, setIsTranslatingNameToEn] = useState(false);
  const [translateNameToEnError, setTranslateNameToEnError] = useState<string | null>(null);
  const [isTranslatingNameToZh, setIsTranslatingNameToZh] = useState(false);
  const [translateNameToZhError, setTranslateNameToZhError] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) {
      setNameEn('');
      setNameZh('');
      setIsOpenDefault(false);
      setError(null);
      setGeneratedId(null);
      setIsGeneratingId(false);
      setAiIdError(null);
      setIdGenerationAttempted(false);
      setIsTranslatingNameToEn(false);
      setTranslateNameToEnError(null);
      setIsTranslatingNameToZh(false);
      setTranslateNameToZhError(null);
    }
  }, [isOpen]);

  const handleGenerateId = useCallback(async () => {
    if (!nameEn.trim() && !nameZh.trim()) {
      setAiIdError("請至少輸入英文或中文名稱以產生ID。");
      return;
    }
    if (!ai || !geminiApiKeySet) {
      setAiIdError("Gemini API 金鑰未設定，無法產生ID。");
      return;
    }

    setIsGeneratingId(true);
    setAiIdError(null);
    setIdGenerationAttempted(true);
    setGeneratedId(null);

    try {
      const promptTemplate = aiSystemPrompts.aiGenerateCategoryID.template;
      const prompt = fillPromptTemplate(promptTemplate, {
        existingCategoryIdsJSON: JSON.stringify(existingCategoryIds),
        categoryNameEn: nameEn.trim(),
        categoryNameZh: nameZh.trim(),
      });
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      const suggestedId = response.text.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      if (suggestedId && !existingCategoryIds.includes(suggestedId)) {
        setGeneratedId(suggestedId);
      } else if (suggestedId) {
        setAiIdError(`AI 建議的ID "${suggestedId}" 已存在或無效。請嘗試修改名稱或手動調整。`);
        setGeneratedId(null); // Ensure ID is not set if there's an issue
      } else {
        setAiIdError("AI 未能產生有效的ID。");
        setGeneratedId(null);
      }
    } catch (e: any) {
      console.error("Error generating category ID with AI:", e);
      setAiIdError(`AI 產生ID時發生錯誤: ${e.message || '未知錯誤'}`);
      setGeneratedId(null);
    } finally {
      setIsGeneratingId(false);
    }
  }, [ai, geminiApiKeySet, nameEn, nameZh, existingCategoryIds, aiSystemPrompts.aiGenerateCategoryID, fillPromptTemplate]);
  

  const handleTranslateName = async (textToTranslate: string, targetLanguage: 'en' | 'zh') => {
    const currentSetterLoading = targetLanguage === 'en' ? setIsTranslatingNameToEn : setIsTranslatingNameToZh;
    const currentSetterError = targetLanguage === 'en' ? setTranslateNameToEnError : setTranslateNameToZhError;
    const finalSetterName = targetLanguage === 'en' ? setNameEn : setNameZh;
    
    if (!textToTranslate.trim()) {
        currentSetterError(`請先輸入${targetLanguage === 'en' ? '中文' : '英文'}名稱以進行翻譯。`);
        return;
    }
    if (!geminiApiKeySet) {
        currentSetterError('Gemini API 金鑰未設定，無法翻譯。');
        return;
    }

    currentSetterLoading(true);
    currentSetterError(null);
    try {
        const translatedName = await onTranslateNameForModal(textToTranslate, targetLanguage);
        if (translatedName) {
            finalSetterName(translatedName);
        } else {
            currentSetterError('翻譯失敗或未返回結果。');
        }
    } catch (e:any) {
        currentSetterError(`翻譯時發生錯誤: ${e.message || '未知錯誤'}`);
    } finally {
        currentSetterLoading(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameEn.trim() && !nameZh.trim()) {
      setError('英文和中文名稱至少需填寫一项。');
      return;
    }
    
    // If AI ID generation was attempted and failed, generatedId will be null.
    // Pass generatedId (which can be null/empty) to onAddCategory.
    // The context's addPromptCategory function will handle generating a default ID if it's falsy.
    const idToUse = generatedId || ''; 

    const success = onAddCategory({
      id: idToUse, // Pass AI-generated ID or empty string
      nameEn: nameEn.trim(),
      nameZh: nameZh.trim(),
      isOpenDefault,
    });

    // Parent (App.tsx) might close the modal on success, or we can do it here
    // For now, assume parent handles closing if success is true.
    // If !success, it implies an ID collision occurred in the context, so show an error.
    if (!success && idToUse) { // Only show collision error if an ID was attempted
        setError(`分類 ID "${idToUse}" 已存在或發生錯誤。`);
    } else if (!success && !idToUse) {
        setError("新增分類時發生未知錯誤 (可能是預設ID衝突)。");
    }
  };
  
  const modalTitle = uiTexts?.addCategoryModalTitle?.textZh || "新增提示詞分類";

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[80] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-category-modal-title" className="text-xl font-semibold text-gray-800">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉視窗"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="categoryNameZh" className="block text-sm font-medium text-gray-700">
                分類中文名稱 <span className="text-red-500">*</span>
                </label>
                 <button
                    type="button"
                    onClick={() => handleTranslateName(nameZh, 'en')}
                    disabled={isTranslatingNameToEn || !nameZh.trim() || !geminiApiKeySet}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingNameToEn ? "翻譯中..." : "使用 AI 翻譯成英文")}
                >
                    {isTranslatingNameToEn ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                    譯成英文
                </button>
            </div>
            <input
              type="text"
              id="categoryNameZh"
              value={nameZh}
              onChange={(e) => {
                setNameZh(e.target.value);
                setGeneratedId(null); setIdGenerationAttempted(false); setAiIdError(null);
                if(translateNameToEnError) setTranslateNameToEnError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm bg-white text-black"
            />
            {translateNameToEnError && <p className="text-xs text-red-500 mt-1">{translateNameToEnError}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="categoryNameEn" className="block text-sm font-medium text-gray-700">
                分類英文名稱 <span className="text-red-500">*</span>
                </label>
                <button
                    type="button"
                    onClick={() => handleTranslateName(nameEn, 'zh')}
                    disabled={isTranslatingNameToZh || !nameEn.trim() || !geminiApiKeySet}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingNameToZh ? "翻譯中..." : "使用 AI 翻譯成中文")}
                >
                    {isTranslatingNameToZh ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                    譯成中文
                </button>
            </div>
            <input
              type="text"
              id="categoryNameEn"
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value);
                setGeneratedId(null); setIdGenerationAttempted(false); setAiIdError(null);
                 if(translateNameToZhError) setTranslateNameToZhError(null);
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm bg-white text-black"
            />
            {translateNameToZhError && <p className="text-xs text-red-500 mt-1">{translateNameToZhError}</p>}
          </div>
          
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">分類 ID (AI 輔助生成)</h4>
                 <button
                    type="button"
                    onClick={handleGenerateId}
                    disabled={isGeneratingId || (!nameEn.trim() && !nameZh.trim()) || !geminiApiKeySet}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isGeneratingId ? "AI 產生中..." : "讓 AI 根據名稱產生ID")}
                >
                    {isGeneratingId ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <SparklesIcon className="w-4 h-4 mr-1" />}
                    AI 產生 ID
                </button>
            </div>
            {isGeneratingId && (
                 <div className="text-xs text-blue-600 flex items-center"><LoadingSpinner className="w-3 h-3 mr-1.5"/>AI 正在努力產生ID...</div>
            )}
            {aiIdError && !isGeneratingId && (
                 <div className="text-xs text-red-600 p-1.5 bg-red-50 border border-red-200 rounded flex items-center">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1 shrink-0"/> {aiIdError}
                 </div>
            )}
            {generatedId && !isGeneratingId && !aiIdError && (
                <div className="text-xs text-green-700 p-1.5 bg-green-50 border border-green-200 rounded flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-1.5 shrink-0"/> AI 建議ID: <strong className="ml-1">{generatedId}</strong>
                </div>
            )}
            {idGenerationAttempted && !generatedId && !isGeneratingId && !aiIdError && (
                 <p className="text-xs text-gray-500">AI 未能產生ID，將使用系統預設ID。</p>
            )}
             <p className="text-[10px] text-gray-500 mt-1">
                若 AI 產生ID失敗或不合意，系統將在儲存時自動產生一個預設ID。
             </p>
          </div>


          <div className="flex items-center">
            <input
              type="checkbox"
              id="categoryIsOpenDefault"
              checked={isOpenDefault}
              onChange={(e) => setIsOpenDefault(e.target.checked)}
              className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black mr-2"
            />
            <label htmlFor="categoryIsOpenDefault" className="text-sm font-medium text-gray-700">
              預設展開此分類
            </label>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-px"/>
                <span>{error}</span>
            </div>
          )}

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
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center"
              disabled={isGeneratingId || isTranslatingNameToEn || isTranslatingNameToZh}
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              新增分類
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
