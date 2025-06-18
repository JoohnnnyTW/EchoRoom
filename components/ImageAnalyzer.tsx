
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { PhotoIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, UploadIcon, PencilSquareIcon, PlusCircleIcon, LayersIcon } from './Icons'; // Added LayersIcon
import { LoadingSpinner } from './LoadingSpinner';
import { FileUploadComponent } from './FileUploadComponent';
import { ImageSelectorModal } from './ImageSelectorModal';
import { AnalyzedImageKeyword, ImageAnalyzerProps as Props, ImageHistoryEntry, UITexts, AISystemPrompts } from '../types';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts'; // For fallback

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

export const ImageAnalyzer: React.FC<Props> = ({
  isEnabled,
  onToggleEnable,
  uiTexts, 
  geminiApiKeySet,
  onOpenMultimodalEditFromAnalyzer, 
  onOpenImageFusionStudioFromAnalyzer, 
  ai,
  aiSystemPrompts, 
  fillPromptTemplate,
  appContextThemeEn, // Changed
  appContextThemeZh, // Added
  onKeywordsExtracted,
  onAddAnalyzedKeywordToPrompt,
  imageHistory,
  onImageReadyForContext,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analyzedKeywords, setAnalyzedKeywords] = useState<AnalyzedImageKeyword[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState<boolean>(false);
  
  const [thinkingMessages, setThinkingMessages] = useState<string[]>([]);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState<number>(0);
  const thinkingIntervalRef = useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!isEnabled) {
      // Reset local state when disabled
      setImageFile(null);
      setImagePreviewUrl(null);
      setAnalyzedKeywords(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setShowImageSelector(false);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThinkingMessages([]);
      setCurrentThinkingIndex(0);
      if (onImageReadyForContext) onImageReadyForContext(null); // Notify parent when disabled/cleared
    }
  }, [isEnabled, onImageReadyForContext]);


  const handleFileUploaded = useCallback((file: File | null, src: string | null) => {
    setImageFile(file);
    setImagePreviewUrl(src);
    setAnalyzedKeywords(null); 
    setAnalysisError(null);
    if (onImageReadyForContext) onImageReadyForContext(src); // Notify parent of new image src
    if (!src) { 
        onKeywordsExtracted([]); 
    }
  }, [onKeywordsExtracted, onImageReadyForContext]);

  const handleImageSelectedFromGallery = useCallback((selectedImage: ImageHistoryEntry) => {
    setImageFile(null); 
    setImagePreviewUrl(selectedImage.src);
    setAnalyzedKeywords(null);
    setAnalysisError(null);
    setShowImageSelector(false);
    if (onImageReadyForContext) onImageReadyForContext(selectedImage.src); // Notify parent
    onKeywordsExtracted([]); 
  }, [onKeywordsExtracted, onImageReadyForContext]);

  const extractAndDisplayKeywords = useCallback(async () => {
    if (!imagePreviewUrl || !ai || !geminiApiKeySet) {
      setAnalysisError(geminiApiKeySet ? "請先上傳或選擇圖像。" : "Gemini API 金鑰未設定。");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzedKeywords(null);
    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);

    const analysisContextForDisplay = appContextThemeZh || appContextThemeEn || "通用";
    const analysisSteps = [
        "準備圖像進行分析...",
        "連接至 AI 視覺模型...",
        "分析視覺元素...",
        "提取風格線索...",
        `根據「${analysisContextForDisplay}」主題解析...`,
        "即將完成關鍵字提取！"
    ];
    setThinkingMessages(analysisSteps);
    setCurrentThinkingIndex(0);
    thinkingIntervalRef.current = window.setInterval(() => {
        setCurrentThinkingIndex(prev => Math.min(prev + 1, analysisSteps.length - 1));
    }, 1200);

    try {
      const base64ImageData = imagePreviewUrl.split(',')[1];
      const mimeType = imagePreviewUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const imagePart = { inlineData: { mimeType, data: base64ImageData } };
      
      const promptTemplate = aiSystemPrompts.imageAnalysisForPrompts.template;
      const textPrompt = fillPromptTemplate(promptTemplate, { 
        analysisContextThemeEn: appContextThemeEn || "General Analysis",
        analysisContextThemeZh: appContextThemeZh || "通用分析"
      });
      const textPart = { text: textPrompt };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: "application/json" }
      });

      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      const parsedKeywordsResult = parseGeminiJsonResponse<AnalyzedImageKeyword[]>(response.text);

      if (parsedKeywordsResult && Array.isArray(parsedKeywordsResult)) {
        setAnalyzedKeywords(parsedKeywordsResult);
        onKeywordsExtracted(parsedKeywordsResult); 
      } else {
        setAnalysisError("AI 未能提取關鍵字或返回格式不正確。");
        console.error("Keyword extraction parsing failed:", response.text, parsedKeywordsResult);
        onKeywordsExtracted([]); 
      }
    } catch (e: any) {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      console.error("AI keyword extraction error:", e);
      setAnalysisError(`關鍵字提取失敗：${e.message || '未知錯誤'}`);
      onKeywordsExtracted([]); 
    } finally {
      setIsAnalyzing(false);
      setCurrentThinkingIndex(analysisSteps.length > 0 ? analysisSteps.length -1 : 0);
    }
  }, [imagePreviewUrl, ai, geminiApiKeySet, aiSystemPrompts.imageAnalysisForPrompts, appContextThemeEn, appContextThemeZh, fillPromptTemplate, onKeywordsExtracted]);

  const showThinkingProcess = isAnalyzing && thinkingMessages.length > 0 && !analysisError;

  const imageAnalyzerTitleText = uiTexts.imageAnalyzerTitle?.textZh || DEFAULT_UI_TEXTS.imageAnalyzerTitle.textZh;
  const analyzeButtonText = uiTexts.analyzeImageButton?.textZh || DEFAULT_UI_TEXTS.analyzeImageButton.textZh;
  const uploadLabelText = uiTexts.uploadImageLabel?.textZh || DEFAULT_UI_TEXTS.uploadImageLabel.textZh;
  const advancedEditButtonText = uiTexts.imageAnalyzerAdvancedEditButtonLabel?.textZh || DEFAULT_UI_TEXTS.imageAnalyzerAdvancedEditButtonLabel.textZh;
  const openFusionStudioButtonText = uiTexts.imageAnalyzerOpenFusionStudioButtonLabel?.textZh || DEFAULT_UI_TEXTS.imageAnalyzerOpenFusionStudioButtonLabel.textZh;


  return (
    <>
      <div className={`p-4 bg-white rounded-xl shadow-lg border border-gray-200 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-70'}`}>
        <div className={`flex justify-between items-center ${isEnabled ? 'mb-3' : ''} transition-all duration-300`}>
          <h2 className="text-md font-semibold text-gray-900/90">{imageAnalyzerTitleText}</h2>
          <label htmlFor="toggleImageAnalyzer" className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" id="toggleImageAnalyzer" className="sr-only" checked={isEnabled} onChange={(e) => onToggleEnable(e.target.checked)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-black' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-full' : ''}`}></div>
            </div>
            <span className="ml-2 text-xs text-gray-600">{isEnabled ? '啟用中' : '已停用'}</span>
          </label>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isEnabled ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!isEnabled}>
          <div className="space-y-3">
            <FileUploadComponent
              file={imageFile}
              fileSrc={imagePreviewUrl}
              onFileChange={handleFileUploaded}
              title={imageAnalyzerTitleText} 
              dropzoneText={uploadLabelText}
              isLoading={isAnalyzing}
            />
            
            <button
              onClick={() => setShowImageSelector(true)}
              disabled={!isEnabled || isAnalyzing}
              className="w-full flex items-center justify-center px-3 py-1.5 border-2 border-dashed border-gray-300 text-xs font-medium rounded-md text-gray-800 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors disabled:opacity-50 active:scale-95 transform duration-100"
            >
              <PhotoIcon className="w-4 h-4 mr-1.5" />
              {uiTexts.imageFusionStudioImportFromGalleryButtonLabel?.textZh || DEFAULT_UI_TEXTS.imageFusionStudioImportFromGalleryButtonLabel.textZh}
            </button>

            <button
              onClick={extractAndDisplayKeywords}
              disabled={!isEnabled || !imagePreviewUrl || isAnalyzing || !geminiApiKeySet}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transform duration-100"
              title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (!imagePreviewUrl ? "請先上傳或選擇圖片" : analyzeButtonText)}
            >
              {isAnalyzing && thinkingMessages.length === 0 ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
              {isAnalyzing && thinkingMessages.length === 0 ? "分析中..." : (isAnalyzing ? "正在提取關鍵字..." : analyzeButtonText)}
            </button>
            
            {imagePreviewUrl && isEnabled && !isAnalyzing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => onOpenMultimodalEditFromAnalyzer(imagePreviewUrl!, imageFile, analyzedKeywords)}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 active:scale-95 transform duration-100"
                  title={advancedEditButtonText}
                >
                  <PencilSquareIcon className="w-4 h-4 mr-1.5" />
                  {advancedEditButtonText}
                </button>
                <button
                  onClick={() => onOpenImageFusionStudioFromAnalyzer(imagePreviewUrl!, imageFile)}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 active:scale-95 transform duration-100"
                  title={openFusionStudioButtonText}
                >
                  <LayersIcon className="w-4 h-4 mr-1.5" />
                  {openFusionStudioButtonText}
                </button>
              </div>
            )}
            
            {showThinkingProcess && (
              <div className="my-2 p-2 border border-gray-200 rounded-md bg-white">
                {thinkingMessages.map((message, index) => (
                  <div key={index} className={`flex items-center text-xs transition-opacity duration-500 ${index <= currentThinkingIndex ? 'opacity-100' : 'opacity-50'}`}>
                    {index < currentThinkingIndex ? <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5 text-green-500 shrink-0" />
                     : index === currentThinkingIndex ? <LoadingSpinner className="w-3 h-3 mr-1.5 text-blue-500 shrink-0" />
                     : <div className="w-3 h-3 mr-1.5 shrink-0 border border-gray-300 rounded-full" />}
                    <span className={`${index === currentThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-600'}`}>{message}</span>
                  </div>
                ))}
              </div>
            )}

            {analysisError && !isAnalyzing && isEnabled && (
              <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            {analyzedKeywords && analyzedKeywords.length > 0 && !isAnalyzing && isEnabled && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900/90 mb-1.5">AI 分析的關鍵字 (點擊以新增至提示詞):</p>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedKeywords.map((kw, index) => (
                    <button
                      key={`analyzed-kw-${index}`}
                      onClick={() => onAddAnalyzedKeywordToPrompt(kw)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-800 border border-gray-300 rounded-md hover:bg-gray-200 hover:border-gray-400 transition-colors flex items-center space-x-1 active:scale-95 transform duration-100"
                      title={`新增 "${kw.termEn} / ${kw.termZh}"`}
                    >
                      <PlusCircleIcon className="w-3 h-3" />
                      <span>{kw.termEn} / {kw.termZh}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
             {analyzedKeywords && analyzedKeywords.length === 0 && !isAnalyzing && isEnabled && imagePreviewUrl &&
                <p className="text-xs text-gray-500 mt-1">AI 未能從此圖像提取任何特定關鍵字。</p>
             }
          </div>
        </div>
      </div>
      {showImageSelector && (
        <ImageSelectorModal
          isOpen={showImageSelector}
          onClose={() => setShowImageSelector(false)}
          allImageHistory={imageHistory}
          onImageSelect={handleImageSelectedFromGallery}
          uiTexts={{
            imageSelectorModalTitle: uiTexts.imageSelectorModalTitle,
            imageSelectorModalAllTab: uiTexts.imageSelectorModalAllTab,
            imageSelectorModalFavoritesTab: uiTexts.imageSelectorModalFavoritesTab,
            imageSelectorModalNoImages: uiTexts.imageSelectorModalNoImages,
            imageSelectorModalNoFavorites: uiTexts.imageSelectorModalNoFavorites,
            favoriteImageButtonTooltip: uiTexts.favoriteImageButtonTooltip,
            unfavoriteImageButtonTooltip: uiTexts.unfavoriteImageButtonTooltip,
          }}
        />
      )}
    </>
  );
};
