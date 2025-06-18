
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { ImageHistoryEntry, AppGeneratedImage, ImageEngine, ImageGenerationSettings, GeminiAspectRatio, FluxKontextMaxAspectRatio, MultimodalEditModalProps as ComponentProps, AISuggestionItem, AIInteractionPrompt, AnalyzedImageKeyword } from '../types';
import { XCircleIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, CubeTransparentIcon, ArrowPathIcon, LanguageIcon, PlusCircleIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton';
import { GEMINI_ASPECT_RATIOS, FLUX_KONTEXT_MAX_ASPECT_RATIOS } from '../constants/imageGenerationOptions';

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


const findClosestSupportedAspectRatio = (
    originalRatio: number,
    supportedLabels: readonly string[],
    defaultFallback: string
): string => {
    const parseRatio = (label: string): number => {
        const parts = label.split(':');
        if (parts.length === 2) {
          const num = parseInt(parts[0], 10);
          const den = parseInt(parts[1], 10);
          if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
        }
        const fallbackParts = defaultFallback.split(':');
        return parseInt(fallbackParts[0], 10) / parseInt(fallbackParts[1], 10);
    };

    let closestLabel = defaultFallback;
    let minDiff = Infinity;

    for (const label of supportedLabels) {
        const supportedValue = parseRatio(label);
        const diff = Math.abs(supportedValue - originalRatio);
        if (diff < minDiff) {
            minDiff = diff;
            closestLabel = label;
        }
    }

    if (minDiff > 0.25 && supportedLabels.includes(defaultFallback)) return defaultFallback;
    return closestLabel;
};


export const MultimodalEditModal: React.FC<ComponentProps> = ({ 
  isOpen,
  onClose,
  baseImage,
  ai,
  onImageGenerated,
  uiTexts,
  systemPromptTemplate, 
  fillPromptTemplate,
  imageGenerationSettings,
  appContextThemeEn, // Changed
  appContextThemeZh, // Added
  aiSystemPrompts,
  initialAnalyzedKeywords, 
}) => {
  const [editTextEn, setEditTextEn] = useState<string>('');
  const [editTextZh, setEditTextZh] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newGeneratedImage, setNewGeneratedImage] = useState<AppGeneratedImage | null>(null);

  const [thinkingMessages, setThinkingMessages] = useState<string[]>([]);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState<number>(0);
  const thinkingIntervalRef = useRef<number | null>(null);

  const [editSuggestions, setEditSuggestions] = useState<AISuggestionItem[]>([]);
  const [isFetchingEditSuggestions, setIsFetchingEditSuggestions] = useState<boolean>(false);
  const [editSuggestionError, setEditSuggestionError] = useState<string | null>(null);
  const [editSuggestionThinkingMessages, setEditSuggestionThinkingMessages] = useState<string[]>([]);
  const [currentEditSuggestionThinkingIndex, setCurrentEditSuggestionThinkingIndex] = useState<number>(0);
  const editSuggestionThinkingIntervalRef = useRef<number | null>(null);
  const [activeSuggestionItems, setActiveSuggestionItems] = useState<AISuggestionItem[]>([]);

  const [currentDisplayBaseImageSrc, setCurrentDisplayBaseImageSrc] = useState<string | null>(null);
  const [currentBaseImageIdForHistory, setCurrentBaseImageIdForHistory] = useState<string | null>(null);

  const [isTranslatingToEn, setIsTranslatingToEn] = useState(false);
  const [translateToEnError, setTranslateToEnError] = useState<string | null>(null);
  const [isTranslatingToZh, setIsTranslatingToZh] = useState(false);
  const [translateToZhError, setTranslateToZhError] = useState<string | null>(null);


  const geminiApiKey = process.env.API_KEY;
  const bflAIApiKey = process.env.BFL_API_KEY;

  const isGeminiAvailable = !!geminiApiKey;
  const isFluxAvailable = !!bflAIApiKey;

  const [selectedEditMode, setSelectedEditMode] = useState<ImageEngine>(() => {
    if (isFluxAvailable) return 'fluxKontextMax';
    if (isGeminiAvailable) return 'gemini';
    return 'gemini';
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentDisplayBaseImageSrc(baseImage.src);
      setCurrentBaseImageIdForHistory(baseImage.id);
      setEditTextEn('');
      setEditTextZh('');
      setError(null);
      setNewGeneratedImage(null);
      setIsLoading(false);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThinkingMessages([]);
      setCurrentThinkingIndex(0);

      setEditSuggestions([]);
      setEditSuggestionError(null);
      setIsFetchingEditSuggestions(false);
      if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
      setEditSuggestionThinkingMessages([]);
      setCurrentEditSuggestionThinkingIndex(0);
      setActiveSuggestionItems([]);

      setIsTranslatingToEn(false); setTranslateToEnError(null);
      setIsTranslatingToZh(false); setTranslateToZhError(null);

      if (isFluxAvailable) {
        setSelectedEditMode('fluxKontextMax');
      } else if (isGeminiAvailable) {
        setSelectedEditMode('gemini');
      } else {
        setSelectedEditMode('gemini'); 
      }
    }
  }, [isOpen, baseImage.src, baseImage.id, isFluxAvailable, isGeminiAvailable]); 

  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
    };
  }, []);

  const handleFetchEditSuggestions = useCallback(async () => {
    if (!ai || !isGeminiAvailable) {
        setEditSuggestionError("Gemini AI client not available or API key not set.");
        return;
    }
    if (!currentDisplayBaseImageSrc) {
        setEditSuggestionError("基礎圖像資料遺失。");
        return;
    }

    if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
    setIsFetchingEditSuggestions(true);
    setEditSuggestionError(null);
    setEditSuggestions([]);
    setActiveSuggestionItems([]); 

    const displayTheme = appContextThemeZh || appContextThemeEn || "通用";
    const steps = [
        `分析原始圖像內容...`,
        `考量產業主題: ${displayTheme}...`,
        `參考目前編輯指令 (如有): ${editTextEn.substring(0,15)}${editTextEn.length > 15 ? "..." : ""}`,
        "構思圖像修改建議...",
        "準備建議清單..."
    ];
    setEditSuggestionThinkingMessages(steps);
    setCurrentEditSuggestionThinkingIndex(0);
    editSuggestionThinkingIntervalRef.current = window.setInterval(() => {
        setCurrentEditSuggestionThinkingIndex(prev => Math.min(prev + 1, steps.length - 1));
    }, 1200);

    try {
        const baseSrc = currentDisplayBaseImageSrc;
        const originalImageDataBase64 = baseSrc.split(',')[1];
        const originalImageMimeType = baseSrc.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        
        const imagePart = { inlineData: { mimeType: originalImageMimeType, data: originalImageDataBase64 }};
        
        const promptTemplate = aiSystemPrompts.editInstructionSuggestion.template;
        const filledTextPrompt = fillPromptTemplate(promptTemplate, {
            appContextThemeEn: appContextThemeEn || "General",
            appContextThemeZh: appContextThemeZh || "通用",
            currentEditText: editTextEn.trim() || "None", 
        });
        const textPart = { text: filledTextPrompt };

        const response: GeminiGenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: "application/json" }
        });

        if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
        
        const parsed = parseGeminiJsonResponse<AISuggestionItem[]>(response.text);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setEditSuggestions(parsed.filter(s => s.suggestionEn && s.suggestionZh));
        } else {
            setEditSuggestionError("AI 未能提供編輯建議，或返回了意外的格式。");
            console.error("Failed to parse edit suggestions:", response.text, parsed);
        }

    } catch (e: any) {
        if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
        console.error("Error fetching edit suggestions:", e);
        setEditSuggestionError(`獲取編輯建議失敗: ${e.message || '未知錯誤'}`);
    } finally {
        setIsFetchingEditSuggestions(false);
        setCurrentEditSuggestionThinkingIndex(steps.length > 0 ? steps.length -1 : 0);
    }
  }, [ai, isGeminiAvailable, currentDisplayBaseImageSrc, appContextThemeEn, appContextThemeZh, editTextEn, aiSystemPrompts.editInstructionSuggestion, fillPromptTemplate]);

  const handleToggleEditSuggestion = (suggestionItem: AISuggestionItem) => {
    const newActiveItems = activeSuggestionItems.some(item => item.suggestionEn === suggestionItem.suggestionEn)
      ? activeSuggestionItems.filter(item => item.suggestionEn !== suggestionItem.suggestionEn)
      : [...activeSuggestionItems, suggestionItem];
    setActiveSuggestionItems(newActiveItems);
    setEditTextEn(newActiveItems.map(item => item.suggestionEn).join(', '));
    setEditTextZh(newActiveItems.map(item => item.suggestionZh).join(', '));
  };

  const handleEditTextEnChange = (newText: string) => {
    setEditTextEn(newText);
    if (newText !== activeSuggestionItems.map(item => item.suggestionEn).join(', ')) {
        setActiveSuggestionItems([]);
    }
  };
  const handleEditTextZhChange = (newText: string) => {
    setEditTextZh(newText);
    if (newText !== activeSuggestionItems.map(item => item.suggestionZh).join(', ')) {
        setActiveSuggestionItems([]);
    }
  };

  const handleAddKeywordToInstructions = (keyword: AnalyzedImageKeyword) => {
    setEditTextEn(prev => prev ? `${prev}, ${keyword.termEn}` : keyword.termEn);
    setEditTextZh(prev => prev ? `${prev}，${keyword.termZh}` : keyword.termZh);
  };

  const handleTranslate = async (textToTranslate: string, targetLanguage: 'en' | 'zh', promptTemplateDetails: AIInteractionPrompt) => {
    if (!ai || !isGeminiAvailable) {
      const errorMsg = "Gemini AI client not available or API key not set.";
      if (targetLanguage === 'en') setTranslateToEnError(errorMsg); else setTranslateToZhError(errorMsg);
      return;
    }
    if (!textToTranslate.trim()) {
      const errorMsg = targetLanguage === 'en' ? '請先輸入中文內容。' : '請先輸入英文內容。';
      if (targetLanguage === 'en') setTranslateToEnError(errorMsg); else setTranslateToZhError(errorMsg);
      return;
    }

    if (targetLanguage === 'en') { setIsTranslatingToEn(true); setTranslateToEnError(null); }
    else { setIsTranslatingToZh(true); setTranslateToZhError(null); }

    if (!promptTemplateDetails || !promptTemplateDetails.template) {
        const errorMsg = `Translation prompt template for ${targetLanguage} not found.`;
        if (targetLanguage === 'en') setTranslateToEnError(errorMsg); else setTranslateToZhError(errorMsg);
        if (targetLanguage === 'en') setIsTranslatingToEn(false); else setIsTranslatingToZh(false);
        return;
    }
    const prompt = fillPromptTemplate(promptTemplateDetails.template, { textToTranslate });

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      const translatedText = response.text.trim();
      if (targetLanguage === 'en') setEditTextEn(translatedText);
      else setEditTextZh(translatedText);
    } catch (e: any) {
      console.error(`Error translating to ${targetLanguage}:`, e);
      const errorMsg = `翻譯失敗: ${e.message || '未知錯誤'}`;
      if (targetLanguage === 'en') setTranslateToEnError(errorMsg); else setTranslateToZhError(errorMsg);
    } finally {
      if (targetLanguage === 'en') setIsTranslatingToEn(false); else setIsTranslatingToZh(false);
    }
  };


  const handleGenerateEditedImage = useCallback(async () => {
    if (!editTextEn.trim()) { // Use English text for generation
      setError("請輸入英文編輯指令。");
      return;
    }
    if (!currentDisplayBaseImageSrc) {
        setError("基礎圖像資料遺失。");
        return;
    }

    setIsLoading(true);
    setError(null);
    setNewGeneratedImage(null);
    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    
    let steps: string[] = [];
    let finalNewImage: AppGeneratedImage | null = null;
    const currentActiveEngine = selectedEditMode;
    const baseSrcForGen = currentDisplayBaseImageSrc; 

    try {
      const originalImageDataBase64 = baseSrcForGen.split(',')[1];

      let finalAspectRatio: string = '1:1';
      const img = new Image();
      await new Promise<void>((resolve) => {
          img.onload = () => {
              const originalImgRatio = img.naturalWidth / img.naturalHeight;
              if (currentActiveEngine === 'gemini') {
                  finalAspectRatio = findClosestSupportedAspectRatio(originalImgRatio, GEMINI_ASPECT_RATIOS, imageGenerationSettings.gemini.aspectRatio);
              } else { 
                  finalAspectRatio = findClosestSupportedAspectRatio(originalImgRatio, FLUX_KONTEXT_MAX_ASPECT_RATIOS, imageGenerationSettings.fluxKontextMax.aspectRatio);
              }
              resolve();
          };
          img.onerror = () => {
              console.warn("無法載入原始圖像以決定長寬比。將使用設定中的預設值。");
              finalAspectRatio = (currentActiveEngine === 'gemini') ? imageGenerationSettings.gemini.aspectRatio : imageGenerationSettings.fluxKontextMax.aspectRatio;
              resolve();
          };
          img.src = baseSrcForGen;
      });


      if (currentActiveEngine === 'fluxKontextMax') {
        if (!isFluxAvailable) { throw new Error("Flux API 金鑰未設定 (BFL_API_KEY)。"); }
        steps = [
            "準備原始圖像與編輯指令...",
            "指令 (En): \"" + (editTextEn.length > 20 ? editTextEn.substring(0, 17) + "..." : editTextEn) + "\"",
            "傳送至 Flux Kontext Max 模型...",
            "Flux Kontext Max 正在生成編輯圖像...",
            "即將完成！"
        ];
        setThinkingMessages(steps);
        setCurrentThinkingIndex(0);
        thinkingIntervalRef.current = window.setInterval(() => setCurrentThinkingIndex(prev => Math.min(prev + 1, steps.length - 1)), 1500);

        const fluxConfig = imageGenerationSettings.fluxKontextMax;
        const requestBody = {
          prompt: editTextEn, // Use English prompt
          input_image_base64: originalImageDataBase64,
          aspect_ratio: finalAspectRatio as FluxKontextMaxAspectRatio,
          output_format: fluxConfig.output_format,
          seed: fluxConfig.seed,
          prompt_upsampling: fluxConfig.prompt_upsampling,
          safety_tolerance: Math.min(fluxConfig.safety_tolerance, 2),
        };

        const proxyResponse = await fetch('/.netlify/functions/generateFluxKontextImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json().catch(() => ({ error: `Flux Kontext Max 代理錯誤 (${proxyResponse.status})` }));
            throw new Error(errorData.error || `Flux Kontext Max 代理請求失敗 (${proxyResponse.status})`);
        }
        const responseData = await proxyResponse.json();
        if (responseData.image_b64 && responseData.mime_type) {
            finalNewImage = {
                id: `img-edit-${Date.now()}-flux`,
                src: `data:${responseData.mime_type};base64,${responseData.image_b64}`,
                prompt: editTextEn,
            };
        } else {
            console.error("Flux Kontext Max proxy response data missing image or mime_type:", responseData);
            throw new Error("Flux Kontext Max 未能生成編輯後的圖像，或返回的資料格式不符。");
        }

      } else { 
        if (!isGeminiAvailable) { throw new Error("Gemini API 金鑰未設定 (API_KEY)。"); }
        steps = [
            "準備原始圖像...",
            "分析編輯指令 (En): \"" + (editTextEn.length > 20 ? editTextEn.substring(0, 17) + "..." : editTextEn) + "\"",
            "Gemini AI 正在構思新的圖像描述...",
            "將描述傳送至 Imagen 圖像生成模型...",
            "Imagen 正在生成編輯後的圖像中...",
            "即將完成！"
        ];
        setThinkingMessages(steps);
        setCurrentThinkingIndex(0);
        thinkingIntervalRef.current = window.setInterval(() => setCurrentThinkingIndex(prev => Math.min(prev + 1, steps.length - 1)), 1500);

        const originalImageMimeType = baseSrcForGen.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const imagePart = { inlineData: { mimeType: originalImageMimeType, data: originalImageDataBase64 }};
        const filledSystemPrompt = fillPromptTemplate(systemPromptTemplate, { 
            userEditInstruction: editTextEn,
            appContextThemeEn: appContextThemeEn || "General", // Pass En theme
        });
        const textPart = { text: filledSystemPrompt };

        const geminiResponse: GeminiGenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: [imagePart, textPart] },
        });

        const newImagenPrompt = geminiResponse.text.trim();
        if (!newImagenPrompt) throw new Error("AI 未能生成新的圖像描述提示詞。");
        setCurrentThinkingIndex(steps.findIndex(s => s.includes("Imagen 圖像生成模型")) || 3);

        const imagenResponse: GenerateImagesResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: newImagenPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: imageGenerationSettings.gemini.outputMimeType,
                aspectRatio: finalAspectRatio as GeminiAspectRatio,
            },
        });
        setCurrentThinkingIndex(steps.findIndex(s => s.includes("生成編輯後的圖像中")) || 4);

        if (imagenResponse.generatedImages && imagenResponse.generatedImages.length > 0 && imagenResponse.generatedImages[0].image?.imageBytes) {
            const imageBytes = imagenResponse.generatedImages[0].image.imageBytes;
            const mimeType = imagenResponse.generatedImages[0].image.mimeType || imageGenerationSettings.gemini.outputMimeType;
            finalNewImage = {
                id: `img-edit-${Date.now()}-gemini`,
                src: `data:${mimeType};base64,${imageBytes}`,
                prompt: newImagenPrompt, 
            };
        } else {
            let detailMessage = "未從 Imagen 回應中找到有效的圖像數據。";
            console.warn("Imagen image generation did not return valid image data. Response:", imagenResponse);
            throw new Error(`Imagen 未能生成編輯後的圖像。${detailMessage}`);
        }
      }

      if (finalNewImage) {
        setNewGeneratedImage(finalNewImage);
        onImageGenerated(finalNewImage, currentActiveEngine, currentBaseImageIdForHistory, editTextEn); // Log English instruction
      }

    } catch (e: any) {
      console.error("編輯圖像時出錯:", e);
      setError(`編輯失敗: ${e.message || '未知錯誤'}`);
    } finally {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
      setIsLoading(false);
      setCurrentThinkingIndex(steps.length > 0 ? steps.length -1 : 0);
    }
  }, [currentDisplayBaseImageSrc, currentBaseImageIdForHistory, editTextEn, ai, onImageGenerated, systemPromptTemplate, fillPromptTemplate, imageGenerationSettings, selectedEditMode, isFluxAvailable, isGeminiAvailable, appContextThemeEn]);

  const handleUseResultForEditing = () => {
    if (newGeneratedImage) {
      setCurrentDisplayBaseImageSrc(newGeneratedImage.src);
      setCurrentBaseImageIdForHistory(newGeneratedImage.id);
      setNewGeneratedImage(null);
      setEditTextEn('');
      setEditTextZh('');
      
      setEditSuggestions([]);
      setActiveSuggestionItems([]);
      setEditSuggestionError(null);
      setEditSuggestionThinkingMessages([]);
      if (editSuggestionThinkingIntervalRef.current) clearInterval(editSuggestionThinkingIntervalRef.current);
      setCurrentEditSuggestionThinkingIndex(0);
      
      setIsTranslatingToEn(false); setTranslateToEnError(null);
      setIsTranslatingToZh(false); setTranslateToZhError(null);

      setError(null); 
      setThinkingMessages([]);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setCurrentThinkingIndex(0);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCurrentModeFlux = selectedEditMode === 'fluxKontextMax';
  const showEditSuggestionThinking = isFetchingEditSuggestions && editSuggestionThinkingMessages.length > 0 && !editSuggestionError;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[80] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="multimodal-edit-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center mb-4 rounded-t-lg ${isCurrentModeFlux ? 'bg-slate-800 -mx-6 -mt-6 px-6 pt-5 pb-4' : 'pt-1'}`}>
          <div className="flex flex-col">
            <h2
              id="multimodal-edit-title"
              className={`text-xl font-semibold ${isCurrentModeFlux ? 'text-slate-100' : 'text-gray-800'}`}
            >
              {uiTexts.modalTitle}
            </h2>
            <div className="text-xs mt-1.5 mb-1">
              <span className={`${isCurrentModeFlux ? 'text-slate-400' : 'text-gray-500'} mr-2`}>模式:</span>
              <button
                  onClick={() => setSelectedEditMode('fluxKontextMax')}
                  className={`px-2 py-0.5 rounded-l-md text-xs transition-colors
                              ${selectedEditMode === 'fluxKontextMax' ? 'bg-black text-white' :
                                isCurrentModeFlux ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                  Flux
              </button>
              <button
                  onClick={() => setSelectedEditMode('gemini')}
                  disabled={!isGeminiAvailable}
                  className={`px-2 py-0.5 rounded-r-md text-xs transition-colors
                              ${selectedEditMode === 'gemini' ? 'bg-black text-white' :
                                isCurrentModeFlux ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                              ${!isGeminiAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  Gemini
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${isCurrentModeFlux ? 'text-slate-300 hover:text-slate-100' : 'text-gray-400 hover:text-gray-600'} self-start mt-1`}
            aria-label="關閉編輯視窗"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto apple-scroll pr-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
                <p className="text-sm font-medium text-gray-700 mb-1">原始圖像:</p>
                {currentDisplayBaseImageSrc ? (
                    <img src={currentDisplayBaseImageSrc} alt="原始圖像" className="w-full rounded-lg border border-gray-200 shadow-sm object-contain max-h-64" />
                ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">圖像載入中...</div>
                )}
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-semibold text-gray-700">編輯指令</h3>
                    <IconButton
                        onClick={() => { setEditTextZh(''); setEditTextEn(''); setActiveSuggestionItems([]); }}
                        aria-label="一鍵清空中英文指令"
                        title="一鍵清空中英文指令"
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isLoading || isFetchingEditSuggestions || isTranslatingToEn || isTranslatingToZh || (!editTextZh.trim() && !editTextEn.trim())}
                    >
                        <XCircleIcon className="w-5 h-5" />
                    </IconButton>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="editInstructionZh" className="block text-sm font-medium text-gray-700">
                            {uiTexts.multimodalEditChineseInstructionLabel}
                        </label>
                        <div className="flex items-center space-x-1">
                            {/* Individual clear removed */}
                            <button
                                type="button"
                                onClick={() => handleTranslate(editTextZh, 'en', aiSystemPrompts.translateToEnglish)}
                                disabled={isTranslatingToEn || !editTextZh.trim() || !isGeminiAvailable || isLoading || isFetchingEditSuggestions}
                                className="px-2 py-0.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title={!isGeminiAvailable ? "Gemini API 金鑰未設定" : (isTranslatingToEn ? "翻譯中..." : uiTexts.multimodalEditTranslateToEnButtonLabel)}
                            >
                               {isTranslatingToEn ? <LoadingSpinner className="w-3 h-3 mr-1"/> : <LanguageIcon className="w-3 h-3 mr-1" />}
                               {uiTexts.multimodalEditTranslateToEnButtonLabel}
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="editInstructionZh"
                        rows={2}
                        value={editTextZh}
                        onChange={(e) => handleEditTextZhChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm bg-white text-black"
                        placeholder="例如：將沙發換成紅色。"
                        disabled={isLoading || isFetchingEditSuggestions || isTranslatingToEn || isTranslatingToZh}
                    />
                    {translateToEnError && <p className="text-xs text-red-500 mt-0.5">{translateToEnError}</p>}
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="editInstructionEn" className="block text-sm font-medium text-gray-700">
                           {uiTexts.multimodalEditEnglishInstructionLabel} (用於圖像生成)
                        </label>
                        <div className="flex items-center space-x-1">
                            {/* Individual clear removed */}
                             <button
                                type="button"
                                onClick={() => handleTranslate(editTextEn, 'zh', aiSystemPrompts.translateToChinese)}
                                disabled={isTranslatingToZh || !editTextEn.trim() || !isGeminiAvailable || isLoading || isFetchingEditSuggestions}
                                className="px-2 py-0.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title={!isGeminiAvailable ? "Gemini API 金鑰未設定" : (isTranslatingToZh ? "翻譯中..." : uiTexts.multimodalEditTranslateToZhButtonLabel)}
                            >
                               {isTranslatingToZh ? <LoadingSpinner className="w-3 h-3 mr-1"/> : <LanguageIcon className="w-3 h-3 mr-1" />}
                               {uiTexts.multimodalEditTranslateToZhButtonLabel}
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="editInstructionEn"
                        rows={2}
                        value={editTextEn}
                        onChange={(e) => handleEditTextEnChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm bg-white text-black"
                        placeholder="e.g., Change the sofa to red."
                        disabled={isLoading || isFetchingEditSuggestions || isTranslatingToEn || isTranslatingToZh}
                    />
                    {translateToZhError && <p className="text-xs text-red-500 mt-0.5">{translateToZhError}</p>}
                </div>
                 {/* Display Initial Analyzed Keywords */}
                {initialAnalyzedKeywords && initialAnalyzedKeywords.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-1">從圖像分析器帶入的關鍵字 (點擊新增):</p>
                        <div className="flex flex-wrap gap-1.5">
                            {initialAnalyzedKeywords.map((kw, index) => (
                                <button
                                key={`initial-kw-${index}`}
                                onClick={() => handleAddKeywordToInstructions(kw)}
                                className="px-1.5 py-1 text-[10px] bg-sky-100 text-sky-700 border border-sky-300 rounded-md hover:bg-sky-200 transition-colors flex items-center space-x-1"
                                title={`新增 "${kw.termEn} / ${kw.termZh}" 到編輯指令`}
                                disabled={isLoading || isFetchingEditSuggestions}
                                >
                                <PlusCircleIcon className="w-2.5 h-2.5" />
                                <span>{kw.termEn} / {kw.termZh}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                 <div>
                     <button
                        type="button"
                        onClick={handleFetchEditSuggestions}
                        disabled={isFetchingEditSuggestions || isLoading || !isGeminiAvailable}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title={!isGeminiAvailable ? "Gemini API 金鑰未設定" : (isFetchingEditSuggestions ? "獲取中..." : uiTexts.aiSuggestionButtonLabel)}
                    >
                       {isFetchingEditSuggestions ? <LoadingSpinner className="w-3.5 h-3.5 mr-1.5"/> : <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />}
                       {uiTexts.aiSuggestionButtonLabel}
                    </button>
                 </div>


                {showEditSuggestionThinking && (
                    <div className="my-1 p-2 border border-gray-200 rounded-md bg-white text-xs">
                        {editSuggestionThinkingMessages.map((message, index) => (
                        <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentEditSuggestionThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                            {index < currentEditSuggestionThinkingIndex ? <CheckCircleIcon className="w-3 h-3 mr-1.5 text-green-500 shrink-0" />
                            : index === currentEditSuggestionThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1.5 text-blue-500 shrink-0" />
                            : <div className="w-3 h-3 mr-1.5 shrink-0 border border-gray-300 rounded-full" />}
                            <span className={`${index === currentEditSuggestionThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                        </div>
                        ))}
                    </div>
                )}
                {editSuggestionError && !isFetchingEditSuggestions && (
                    <p className="text-xs text-red-500 p-1 bg-red-50 border border-red-200 rounded flex items-center"><ExclamationTriangleIcon className="w-3 h-3 mr-1"/> {editSuggestionError}</p>
                )}
                {editSuggestions.length > 0 && !isFetchingEditSuggestions && !editSuggestionError && (
                    <div className="space-y-1 border border-gray-200 rounded-md p-1.5 bg-gray-50 max-h-60 overflow-y-auto apple-scroll">
                        {editSuggestions.map((s, index) => {
                            const isSelected = activeSuggestionItems.some(item => item.suggestionEn === s.suggestionEn);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleToggleEditSuggestion(s)}
                                    className={`w-full text-left p-1.5 text-[11px] rounded flex items-center justify-between transition-colors ${
                                        isSelected ? 'bg-gray-200 text-gray-800' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    title={`點擊以 ${isSelected ? '移除' : '加入'} 建議：${s.suggestionEn} / ${s.suggestionZh}`}
                                >
                                    <span className="flex-grow">
                                        <strong>En:</strong> {s.suggestionEn}<br/>
                                        <span className="text-gray-600"><strong>Zh:</strong> {s.suggestionZh}</span>
                                    </span>
                                    {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-black shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={handleGenerateEditedImage}
                    disabled={isLoading || !editTextEn.trim() || (selectedEditMode === 'fluxKontextMax' && !isFluxAvailable) || (selectedEditMode === 'gemini' && !isGeminiAvailable) || isFetchingEditSuggestions}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title={
                        (selectedEditMode === 'fluxKontextMax' && !isFluxAvailable) ? "BFL.ai API 金鑰未設定 (BFL_API_KEY)" :
                        (selectedEditMode === 'gemini' && !isGeminiAvailable) ? "Gemini API 金鑰未設定 (API_KEY)" :
                        (!editTextEn.trim() ? "請輸入英文編輯指令" : "")
                    }
                >
                    {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? '編輯中...' : '生成編輯後圖像'}
                </button>

                {error && !isLoading && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-px"/>
                        <span>{error}</span>
                    </div>
                )}
                
                {isLoading && thinkingMessages.length > 0 && !error && (
                    <div className="my-2 p-2 border border-gray-200 rounded-md bg-white text-xs">
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
                
                {newGeneratedImage && !isLoading && !error && (
                  <div className="mt-4 p-3 border border-green-300 rounded-lg bg-green-50">
                    <p className="text-sm font-semibold text-green-700 mb-2">編輯結果:</p>
                    <img src={newGeneratedImage.src} alt="編輯後的圖像" className="w-full rounded border border-gray-200 shadow-sm object-contain max-h-72" />
                    <button
                      onClick={handleUseResultForEditing}
                      className="mt-3 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 flex items-center justify-center"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5"/>
                      {uiTexts.multimodalEditUseResultButtonLabel}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
