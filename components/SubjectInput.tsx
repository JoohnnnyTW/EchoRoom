
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai"; 
import { AISystemPrompts, DesignStyle, PromptTerm, AnalyzedImageKeyword, AISuggestionItem, SubjectInputProps as Props } from "../types"; 
import { LanguageIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton';

const parseGeminiJsonResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e: any) {
    console.error("未能解析JSON回應:", e, "原始文本:", responseText);
    return null;
  }
};

export const SubjectInput: React.FC<Props> = ({
  subjectEn,
  subjectZh,
  onSubjectEnChange,
  onSubjectZhChange,
  aiSuggestionSeedText, 
  onAiSuggestionSeedTextChange, 
  isEnabled,
  onToggleEnable,
  ai,
  geminiApiKeySet,
  uiTexts,
  fillPromptTemplate,
  aiSystemPrompts,
  appContextThemeEn, // Changed
  appContextThemeZh, // Added
  analyzedImageKeywords,
  selectedStyle,
  selectedRoomType,
  isRoomTypeSelectorEnabled, 
  analyzedImageSrc, 
  onFetchSubjectPhraseSuggestions, 
}) => {
  const [isTranslatingEn, setIsTranslatingEn] = useState(false);
  const [translationEnError, setTranslationEnError] = useState<string | null>(null);
  const [isTranslatingZh, setIsTranslatingZh] = useState(false);
  const [translationZhError, setTranslationZhError] = useState<string | null>(null);

  const handleTranslate = useCallback(async (textToTranslate: string, targetLanguage: 'en' | 'zh') => {
    if (!ai || !geminiApiKeySet) {
      const errorMsg = "Gemini AI client not available or API key not set for translation.";
      if (targetLanguage === 'en') setTranslationEnError(errorMsg);
      else setTranslationZhError(errorMsg);
      return;
    }
    if (!textToTranslate.trim()) {
      const errorMsg = targetLanguage === 'en' ? '請先輸入中文內容以翻譯成英文。' : '請先輸入英文內容以翻譯成中文。';
      if (targetLanguage === 'en') setTranslationEnError(errorMsg);
      else setTranslationZhError(errorMsg);
      return;
    }

    if (targetLanguage === 'en') {
      setIsTranslatingEn(true);
      setTranslationEnError(null);
    } else {
      setIsTranslatingZh(true);
      setTranslationZhError(null);
    }

    const promptTemplateDetails = targetLanguage === 'en' ? aiSystemPrompts.translateToEnglish : aiSystemPrompts.translateToChinese;
    if (!promptTemplateDetails || !promptTemplateDetails.template) {
        const errorMsg = `Translation prompt template for ${targetLanguage} not found.`;
        if (targetLanguage === 'en') setTranslationEnError(errorMsg); else setTranslationZhError(errorMsg);
        if (targetLanguage === 'en') setIsTranslatingEn(false); else setIsTranslatingZh(false);
        return;
    }
    const prompt = fillPromptTemplate(promptTemplateDetails.template, { textToTranslate });

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      const translatedText = response.text.trim();
      if (targetLanguage === 'en') {
        onSubjectEnChange(translatedText);
      } else {
        onSubjectZhChange(translatedText);
      }
    } catch (e: any) {
      console.error(`Error translating subject to ${targetLanguage}:`, e);
      const errorMsg = `翻譯失敗: ${e.message || '未知錯誤'}`;
      if (targetLanguage === 'en') setTranslationEnError(errorMsg);
      else setTranslationZhError(errorMsg);
    } finally {
      if (targetLanguage === 'en') setIsTranslatingEn(false);
      else setIsTranslatingZh(false);
    }
  }, [ai, geminiApiKeySet, onSubjectEnChange, onSubjectZhChange, aiSystemPrompts, fillPromptTemplate]);
  
  return (
    <div className={`p-4 bg-white rounded-xl shadow-lg border border-gray-200 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-70'}`}>
      <div className={`flex justify-between items-center ${isEnabled ? 'mb-3' : ''} transition-all duration-300`}>
        <div className="flex items-center space-x-2">
            <h2 className="text-md font-semibold text-gray-900/90">{uiTexts.title}</h2>
            <IconButton
                onClick={() => { onSubjectZhChange(''); onSubjectEnChange(''); onAiSuggestionSeedTextChange(''); }}
                aria-label="一鍵清空所有描述欄位"
                title="一鍵清空所有描述欄位"
                className="text-gray-500 hover:text-gray-700 active:scale-95 transform transition-transform duration-100"
                disabled={!isEnabled || (!subjectZh.trim() && !subjectEn.trim() && !aiSuggestionSeedText.trim())}
            >
                <XCircleIcon className="w-4 h-4" />
            </IconButton>
        </div>
        <label htmlFor="toggleSubjectInput" className="flex items-center cursor-pointer">
            <div className="relative">
                <input 
                    type="checkbox" 
                    id="toggleSubjectInput" 
                    className="sr-only" 
                    checked={isEnabled} 
                    onChange={(e) => onToggleEnable(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-black' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-full' : ''}`}></div>
            </div>
            <span className="ml-2 text-xs text-gray-600">{isEnabled ? '啟用中' : '已停用'}</span>
        </label>
      </div>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isEnabled ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`} // Increased max-h
        aria-hidden={!isEnabled}
      >
        <div className="space-y-3">
          {/* Main Subject Description Fields */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="subjectZh" className="block text-sm font-medium text-gray-900/90">
                主要中文描述
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleTranslate(subjectZh, 'en')}
                  disabled={!isEnabled || isTranslatingEn || !subjectZh.trim() || !geminiApiKeySet}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center active:scale-95 transform transition-transform duration-100"
                  title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingEn ? "翻譯中..." : (uiTexts.translateToEnglishButton || "使用 AI 翻譯成英文"))}
                  aria-label={uiTexts.translateToEnglishButton || "Translate to English"}
                >
                  {isTranslatingEn ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                  譯成英文
                </button>
              </div>
            </div>
            <textarea
              id="subjectZh"
              rows={2} // Reduced rows for main desc
              value={subjectZh}
              onChange={(e) => {
                onSubjectZhChange(e.target.value);
                if (translationEnError) setTranslationEnError(null);
              }}
              className={`w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-gray-900 focus:ring-black focus:border-black ${!isEnabled ? 'cursor-not-allowed' : ''}`}
              placeholder={uiTexts.zhPlaceholder || "例如：一個女人站在夜晚的城市街道上，背景是霓虹燈"}
              aria-label="主要中文主體內容描述"
              disabled={!isEnabled}
            />
            {translationEnError && isEnabled && <p className="text-xs text-red-500 mt-1">{translationEnError}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="subjectEn" className="block text-sm font-medium text-gray-900/90">
                主要英文描述
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleTranslate(subjectEn, 'zh')}
                  disabled={!isEnabled || isTranslatingZh || !subjectEn.trim() || !geminiApiKeySet}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center active:scale-95 transform transition-transform duration-100"
                  title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (isTranslatingZh ? "翻譯中..." : (uiTexts.translateToChineseButton || "使用 AI 翻譯成中文"))}
                  aria-label={uiTexts.translateToChineseButton || "Translate to Chinese"}
                >
                  {isTranslatingZh ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <LanguageIcon className="w-3.5 h-3.5 mr-1" />}
                  譯成中文
                </button>
              </div>
            </div>
            <textarea
              id="subjectEn"
              rows={2} // Reduced rows for main desc
              value={subjectEn}
              onChange={(e) => {
                onSubjectEnChange(e.target.value);
                if (translationZhError) setTranslationZhError(null);
              }}
              className={`w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-gray-900 focus:ring-black focus:border-black ${!isEnabled ? 'cursor-not-allowed' : ''}`}
              placeholder={uiTexts.enPlaceholder || "e.g., A woman standing on a city street at night, neon lights in the background"}
              aria-label="主要英文主體內容描述"
              disabled={!isEnabled}
            />
            {translationZhError && isEnabled && <p className="text-xs text-red-500 mt-1">{translationZhError}</p>}
          </div>

          {/* New AI Suggestion Seed Input Field */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <label htmlFor="aiSuggestionSeedText" className="block text-sm font-medium text-gray-900/90 mb-1">
              AI 主體建議參考文字
            </label>
            <textarea
              id="aiSuggestionSeedText"
              rows={2}
              value={aiSuggestionSeedText}
              onChange={(e) => onAiSuggestionSeedTextChange(e.target.value)}
              className={`w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white text-gray-900 focus:ring-black focus:border-black ${!isEnabled ? 'cursor-not-allowed' : ''}`}
              placeholder="例如：一隻貓在書架上打盹，陽光灑下 (可留空以獲取通用建議)"
              aria-label="AI 主體建議參考文字輸入框"
              disabled={!isEnabled}
            />
            <p className="text-xs text-gray-600 mt-1">
              此處輸入的文字將作為下方「AI 建議主體內容」按鈕的主要參考。若留空，AI 將根據風格、空間等其他脈絡提供通用建議。
            </p>
            <button
                onClick={onFetchSubjectPhraseSuggestions}
                disabled={!isEnabled || !geminiApiKeySet /* Add loading state from App.tsx if needed */}
                className="mt-2 w-full flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transform duration-100"
                title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : uiTexts.aiSuggestionButtonLabel}
            >
                 <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
                {uiTexts.aiSuggestionButtonLabel}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
