
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleGenAI,
  GenerateContentResponse as GeminiGenerateContentResponse,
} from '@google/genai';
import {
  ImageHistoryEntry, AppGeneratedImage, ImageEngine, ImageGenerationSettings,
  ImageFusionStudioModalProps, ImageSlotState, IMAGE_USAGE_INTENTS, ImageUsageIntent,
  AISuggestionItem,
  GeminiAspectRatio, FluxKontextMaxAspectRatio
} from '../types';
import {
  XCircleIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon,
  ArrowPathIcon, LanguageIcon, UploadIcon, LayersIcon, PlusCircleIcon, SwitchHorizontalIcon,
  PhotoIcon // For import button
} from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton';
import { FileUploadComponent } from './FileUploadComponent'; 
import { ImageSelectorModal } from './ImageSelectorModal'; 
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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

function swapTextPair(originalText: string, term1: string, term2: string, caseInsensitive: boolean = false): string {
  const placeholder1 = `__TEMP_SWAP_PLACEHOLDER_1_${Date.now()}__`;
  const flags = caseInsensitive ? 'gi' : 'g';

  let tempText = originalText.replace(new RegExp(escapeRegExp(term1), flags), placeholder1);
  tempText = tempText.replace(new RegExp(escapeRegExp(term2), flags), term1);
  tempText = tempText.replace(new RegExp(escapeRegExp(placeholder1), 'g'), term2);
  
  return tempText;
}


export const ImageFusionStudioModal: React.FC<ImageFusionStudioModalProps> = ({
  isOpen,
  onClose,
  initialBaseImage,
  ai,
  onImageGenerated,
  uiTexts,
  aiSystemPrompts,
  imageGenerationSettings,
  appContextThemeEn, // Changed
  appContextThemeZh, // Added
  fillPromptTemplate,
  imageHistory,
}) => {
  const [baseImageSlot, setBaseImageSlot] = useState<ImageSlotState>({
    id: 'base', file: null, src: initialBaseImage.src, descriptionKeywords: [], intent: 'image_merge_1', isLoadingDescription: false,
  });
  const [secondaryImageSlot, setSecondaryImageSlot] = useState<ImageSlotState>({
    id: 'secondary', file: null, src: null, descriptionKeywords: [], intent: 'image_merge_2', isLoadingDescription: false,
  });

  const [mainInstructionEn, setMainInstructionEn] = useState<string>('');
  const [mainInstructionZh, setMainInstructionZh] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFusedImage, setGeneratedFusedImage] = useState<AppGeneratedImage | null>(null);

  const [isTranslatingToEn, setIsTranslatingToEn] = useState(false);
  const [translateToEnError, setTranslateToEnError] = useState<string | null>(null);
  const [isTranslatingToZh, setIsTranslatingToZh] = useState(false);
  const [translateToZhError, setTranslateToZhError] = useState<string | null>(null);

  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestionItem[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionThinkingMessages, setSuggestionThinkingMessages] = useState<string[]>([]);
  const [currentSuggestionThinkingIndex, setCurrentSuggestionThinkingIndex] = useState<number>(0);
  const suggestionThinkingIntervalRef = useRef<number | null>(null);
  
  const [generationThinkingMessages, setGenerationThinkingMessages] = useState<string[]>([]);
  const [currentGenerationThinkingIndex, setCurrentGenerationThinkingIndex] = useState<number>(0);
  const generationThinkingIntervalRef = useRef<number | null>(null);

  const [showImageSelectorModal, setShowImageSelectorModal] = useState<boolean>(false);
  const [imageSelectorTargetSlot, setImageSelectorTargetSlot] = useState<'base' | 'secondary' | null>(null);


  const isGeminiAvailable = !!process.env.API_KEY;

  const resetAllLocalStates = useCallback(() => {
    setBaseImageSlot({
      id: 'base', file: null, src: initialBaseImage.src, descriptionKeywords: [], intent: 'image_merge_1', isLoadingDescription: false,
    });
    setSecondaryImageSlot({
      id: 'secondary', file: null, src: null, descriptionKeywords: [], intent: 'image_merge_2', isLoadingDescription: false,
    });
    setMainInstructionEn('');
    setMainInstructionZh('');
    setError(null);
    setGeneratedFusedImage(null);
    setIsLoading(false);
    setIsTranslatingToEn(false); setTranslateToEnError(null);
    setIsTranslatingToZh(false); setTranslateToZhError(null);
    setIsFetchingSuggestions(false); setSuggestions([]); setSuggestionError(null);
    if (suggestionThinkingIntervalRef.current) clearInterval(suggestionThinkingIntervalRef.current);
    setSuggestionThinkingMessages([]); setCurrentSuggestionThinkingIndex(0);
    if (generationThinkingIntervalRef.current) clearInterval(generationThinkingIntervalRef.current);
    setGenerationThinkingMessages([]); setCurrentGenerationThinkingIndex(0);
    setShowImageSelectorModal(false); setImageSelectorTargetSlot(null);
  }, [initialBaseImage.src]);

  useEffect(() => {
    if (isOpen) {
      resetAllLocalStates();
      if (initialBaseImage.src) {
        handleDescribeImageForSlot('base', null, initialBaseImage.src);
      }
    }
  }, [isOpen, resetAllLocalStates, initialBaseImage.src]);

  useEffect(() => {
    return () => { 
      if (suggestionThinkingIntervalRef.current) clearInterval(suggestionThinkingIntervalRef.current);
      if (generationThinkingIntervalRef.current) clearInterval(generationThinkingIntervalRef.current);
    };
  }, []);

  const handleDescribeImageForSlot = useCallback(async (slotId: 'base' | 'secondary', file: File | null, existingSrc?: string): Promise<void> => {
    if (!ai || !isGeminiAvailable) {
      console.error("Image Keyword Extraction: Gemini AI client not available or API key not set.");
      const updater = slotId === 'base' ? setBaseImageSlot : setSecondaryImageSlot;
      updater(prev => ({ ...prev, descriptionKeywords: [{keywordEn: "Keyword extraction unavailable", keywordZh: "關鍵字提取功能不可用"}], isLoadingDescription: false }));
      return;
    }

    let imageSrcToUse = existingSrc;
    if (file) { 
      imageSrcToUse = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    if (!imageSrcToUse) {
      const updater = slotId === 'base' ? setBaseImageSlot : setSecondaryImageSlot;
      updater(prev => ({ ...prev, descriptionKeywords: [], isLoadingDescription: false }));
      return;
    }

    const updater = slotId === 'base' ? setBaseImageSlot : setSecondaryImageSlot;
    updater(prev => ({ ...prev, isLoadingDescription: true, descriptionKeywords: [] }));

    try {
      const base64ImageData = imageSrcToUse.split(',')[1];
      const mimeType = imageSrcToUse.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

      const imagePart = { inlineData: { mimeType, data: base64ImageData } };
      const descriptionPromptTemplate = aiSystemPrompts.imageFusionSlotDescription.template;
      const textPart = { text: descriptionPromptTemplate };

      const response: GeminiGenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: "application/json" } 
      });
      
      const parsedKeywords = parseGeminiJsonResponse<Array<{keywordEn: string; keywordZh: string}>>(response.text);

      if (parsedKeywords && Array.isArray(parsedKeywords) && parsedKeywords.length > 0) {
        updater(prev => ({ ...prev, descriptionKeywords: parsedKeywords.filter(kw => kw.keywordEn && kw.keywordZh), isLoadingDescription: false }));
      } else {
        updater(prev => ({ ...prev, descriptionKeywords: [{keywordEn: "Failed to extract keywords", keywordZh: "未能提取關鍵字"}], isLoadingDescription: false }));
        console.error("Image keyword extraction parsing failed or missing fields:", response.text, parsedKeywords);
      }
    } catch (e: any) {
      console.error(`Image keyword extraction failed for ${slotId}:`, e);
      updater(prev => ({ ...prev, descriptionKeywords: [{keywordEn: `Keyword extraction error: ${e.message || 'Unknown error'}`, keywordZh: `關鍵字提取錯誤: ${e.message || '未知錯誤'}`}], isLoadingDescription: false }));
    }
  }, [ai, isGeminiAvailable, aiSystemPrompts.imageFusionSlotDescription]);


 const handleBaseFileUpload = useCallback((file: File | null, fileSrc: string | null) => {
    if (file && fileSrc) {
      setBaseImageSlot(prev => ({ ...prev, file, src: fileSrc, descriptionKeywords: [] }));
      handleDescribeImageForSlot('base', file, fileSrc);
    } else { 
      setBaseImageSlot(prev => ({
        ...prev,
        file: null,
        src: initialBaseImage.src, 
        descriptionKeywords: []
      }));
      if (initialBaseImage.src) {
        handleDescribeImageForSlot('base', null, initialBaseImage.src);
      } else {
         setBaseImageSlot(prev => ({ ...prev, isLoadingDescription: false, descriptionKeywords: [] }));
      }
    }
  }, [handleDescribeImageForSlot, initialBaseImage.src]);

  const handleSecondaryFileUpload = useCallback((file: File | null, fileSrc: string | null) => {
    if (file && fileSrc) {
      setSecondaryImageSlot(prev => ({ ...prev, file, src: fileSrc, descriptionKeywords: [] }));
      handleDescribeImageForSlot('secondary', file, fileSrc);
    } else { 
      setSecondaryImageSlot(prev => ({ ...prev, file: null, src: null, descriptionKeywords: [], isLoadingDescription: false }));
    }
  }, [handleDescribeImageForSlot]);


  const handleAddKeywordToInstruction = (keyword: { keywordEn: string; keywordZh: string }) => {
    setMainInstructionEn(prev => {
      const newPart = keyword.keywordEn;
      return prev.trim() ? `${prev.trim()}, ${newPart}` : newPart;
    });
    setMainInstructionZh(prev => {
      const newPart = keyword.keywordZh;
      return prev.trim() ? `${prev.trim()}，${newPart}` : newPart;
    });
  };

  const handleTranslateInstruction = async (targetLanguage: 'en' | 'zh') => {
    const textToTranslate = targetLanguage === 'en' ? mainInstructionZh : mainInstructionEn;
    const currentSetterLoading = targetLanguage === 'en' ? setIsTranslatingToEn : setIsTranslatingToZh;
    const errorSetter = targetLanguage === 'en' ? setTranslateToEnError : setTranslateToZhError;
    const finalSetter = targetLanguage === 'en' ? setMainInstructionEn : setMainInstructionZh;
    const promptDetails = targetLanguage === 'en' ? aiSystemPrompts.translateToEnglish : aiSystemPrompts.translateToChinese;

    if (!ai || !isGeminiAvailable) { errorSetter("Gemini API 未設定"); return; }
    if (!textToTranslate.trim()) { errorSetter("請先輸入內容"); return; }

    currentSetterLoading(true); errorSetter(null);
    try {
      const prompt = fillPromptTemplate(promptDetails.template, { textToTranslate });
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      finalSetter(response.text.trim());
    } catch (e: any) { errorSetter(`翻譯失敗: ${e.message}`); }
    finally { currentSetterLoading(false); }
  };

  const handleFetchInstructionSuggestions = async () => {
    if (!ai || !isGeminiAvailable) { setSuggestionError("Gemini API 未設定"); return; }
    
    setIsFetchingSuggestions(true); setSuggestionError(null); setSuggestions([]);
    if (suggestionThinkingIntervalRef.current) clearInterval(suggestionThinkingIntervalRef.current);

    const baseKeywordsString = JSON.stringify(baseImageSlot.descriptionKeywords);
    const secondaryKeywordsString = secondaryImageSlot.src ? JSON.stringify(secondaryImageSlot.descriptionKeywords) : "[]";
    const displayTheme = appContextThemeZh || appContextThemeEn || "通用";

    const steps = [
        `分析 圖A 關鍵字...`,
        secondaryImageSlot.src ? `分析 圖B 關鍵字...` : "無 圖B 可分析...",
        `參考應用主題: ${displayTheme}...`,
        `根據圖像關鍵字與意圖構思指令...`,
        "準備建議清單..."
    ];
    setSuggestionThinkingMessages(steps); setCurrentSuggestionThinkingIndex(0);
    suggestionThinkingIntervalRef.current = window.setInterval(() => setCurrentSuggestionThinkingIndex(prev => Math.min(prev + 1, steps.length - 1)), 1200);

    try {
        const promptTemplate = aiSystemPrompts.imageFusionInstructionSuggestion.template;
        const filledPrompt = fillPromptTemplate(promptTemplate, {
            appContextThemeEn: appContextThemeEn || "General",
            appContextThemeZh: appContextThemeZh || "通用",
            currentUserInstructionEn: mainInstructionEn,
            currentUserInstructionZh: mainInstructionZh,
            baseImageKeywordsJSON: baseKeywordsString,
            baseImageIntent: IMAGE_USAGE_INTENTS.find(i => i.value === baseImageSlot.intent)?.labelZh || baseImageSlot.intent,
            secondaryImageKeywordsJSON: secondaryKeywordsString,
            secondaryImageIntent: secondaryImageSlot.src ? (IMAGE_USAGE_INTENTS.find(i => i.value === secondaryImageSlot.intent)?.labelZh || secondaryImageSlot.intent) : "N/A",
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: filledPrompt,
            config: { responseMimeType: "application/json" }
        });

        if (suggestionThinkingIntervalRef.current) clearInterval(suggestionThinkingIntervalRef.current);
        const parsed = parseGeminiJsonResponse<AISuggestionItem[]>(response.text);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setSuggestions(parsed.filter(s => s.suggestionEn && s.suggestionZh));
        } else {
            setSuggestionError("AI 未能提供指令建議，或返回格式不符。");
        }
    } catch (e:any) {
        if (suggestionThinkingIntervalRef.current) clearInterval(suggestionThinkingIntervalRef.current);
        setSuggestionError(`獲取建議失敗: ${e.message}`);
    } finally {
        setIsFetchingSuggestions(false);
        setCurrentSuggestionThinkingIndex(steps.length > 0 ? steps.length -1 : 0);
    }
  };
  
  const handleApplySuggestion = (suggestion: AISuggestionItem) => {
    setMainInstructionEn(suggestion.suggestionEn);
    setMainInstructionZh(suggestion.suggestionZh);
    setSuggestions([]);
  };

  const handleGenerateFusedImage = async () => {
    if (!mainInstructionEn.trim()) { setError("請輸入英文主要指令。"); return; }
    if (!baseImageSlot.src) { setError("缺少 圖A。"); return; }

    setIsLoading(true); setError(null); setGeneratedFusedImage(null);
    if (generationThinkingIntervalRef.current) clearInterval(generationThinkingIntervalRef.current);
    
    const steps = [
        "準備圖像與指令...",
        `指令 (En): "${mainInstructionEn.substring(0,20)}..."`,
        "傳送至 Flux Kontext Max 模型...",
        "Flux 正在處理圖像融合/風格轉換...",
        "即將完成！"
    ];
    setGenerationThinkingMessages(steps); setCurrentGenerationThinkingIndex(0);
    generationThinkingIntervalRef.current = window.setInterval(() => setCurrentGenerationThinkingIndex(prev => Math.min(prev + 1, steps.length - 1)), 1500);

    try {
        const payload: any = {
            prompt: mainInstructionEn,
            input_image_base64: baseImageSlot.src.split(',')[1],
            output_format: imageGenerationSettings.fluxKontextMax.output_format,
            seed: imageGenerationSettings.fluxKontextMax.seed,
            prompt_upsampling: imageGenerationSettings.fluxKontextMax.prompt_upsampling,
            safety_tolerance: Math.min(imageGenerationSettings.fluxKontextMax.safety_tolerance, 2), 
        };

        const img = new Image();
        await new Promise<void>((resolve) => {
            img.onload = () => {
                const originalRatio = img.naturalWidth / img.naturalHeight;
                payload.aspect_ratio = findClosestSupportedAspectRatio(originalRatio, FLUX_KONTEXT_MAX_ASPECT_RATIOS, imageGenerationSettings.fluxKontextMax.aspectRatio);
                resolve();
            };
            img.onerror = () => {
                payload.aspect_ratio = imageGenerationSettings.fluxKontextMax.aspectRatio; resolve();
            };
            img.src = baseImageSlot.src!;
        });

        const controlImages: string[] = [];
        const styleImages: string[] = [];

        if (baseImageSlot.intent === 'style_transfer_target' && baseImageSlot.src) {
            styleImages.push(baseImageSlot.src.split(',')[1]);
        } else if (baseImageSlot.intent === 'reference_object' && baseImageSlot.src) { 
            controlImages.push(baseImageSlot.src.split(',')[1]);
        }
        
        if (secondaryImageSlot.src) {
            const secBase64 = secondaryImageSlot.src.split(',')[1];
            if (secondaryImageSlot.intent === 'style_transfer_target') styleImages.push(secBase64);
            else if (secondaryImageSlot.intent === 'reference_object' || secondaryImageSlot.intent === 'object_replacement' || secondaryImageSlot.intent === 'image_merge_2') {
                 controlImages.push(secBase64);
            }
        }
        
        // Handle image_merge_1 and image_merge_2 explicitly
        // If base is merge_1, it's already input_image.
        // If secondary is merge_1, it becomes input_image, and original base (if not style) becomes control.
        // If base is merge_2 and secondary is not merge_1, base becomes control.
        if (secondaryImageSlot.intent === 'image_merge_1' && secondaryImageSlot.src) {
            // Secondary is main input
            payload.input_image_base64 = secondaryImageSlot.src.split(',')[1];
            if (baseImageSlot.src && baseImageSlot.intent !== 'style_transfer_target' && baseImageSlot.intent !== 'image_merge_1') {
                controlImages.push(baseImageSlot.src.split(',')[1]);
            }
        } else if (baseImageSlot.intent === 'image_merge_2' && baseImageSlot.src && secondaryImageSlot.intent !== 'image_merge_1') {
            // Base is merge_2, and secondary is not the main input, so base is a control image
            if (!controlImages.includes(baseImageSlot.src.split(',')[1])) { // Avoid duplicates
                 controlImages.push(baseImageSlot.src.split(',')[1]);
            }
        }
        
        if (controlImages.length > 0) payload.control_images_base64 = Array.from(new Set(controlImages)); // Deduplicate
        if (styleImages.length > 0) payload.style_images_base64 = Array.from(new Set(styleImages)); // Deduplicate
        
        const proxyResponse = await fetch('/.netlify/functions/generateFluxKontextImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json().catch(() => ({ error: `圖像融合代理錯誤 (${proxyResponse.status})` }));
            throw new Error(errorData.error || `圖像融合代理請求失敗 (${proxyResponse.status})`);
        }
        const responseData = await proxyResponse.json();
        if (responseData.image_b64 && responseData.mime_type) {
            const newImage: AppGeneratedImage = {
                id: `img-fusion-${Date.now()}`,
                src: `data:${responseData.mime_type};base64,${responseData.image_b64}`,
                prompt: mainInstructionEn,
            };
            setGeneratedFusedImage(newImage);
            onImageGenerated(newImage, 'fluxKontextMax', initialBaseImage.id, mainInstructionEn, {
                baseIntent: baseImageSlot.intent,
                secondaryIntent: secondaryImageSlot.src ? secondaryImageSlot.intent : null,
            });
        } else {
            throw new Error("圖像融合未返回圖像數據。");
        }
    } catch (e: any) {
        setError(`生成失敗: ${e.message}`);
    } finally {
        setIsLoading(false);
        if (generationThinkingIntervalRef.current) clearInterval(generationThinkingIntervalRef.current);
        setCurrentGenerationThinkingIndex(steps.length > 0 ? steps.length - 1: 0);
    }
  };
  
  const handleUseResultForEditing = () => {
    if (generatedFusedImage) {
        setBaseImageSlot({
            id: 'base',
            file: null, 
            src: generatedFusedImage.src,
            descriptionKeywords: [], 
            intent: 'image_merge_1', 
            isLoadingDescription: false,
        });
        setSecondaryImageSlot({ id: 'secondary', file: null, src: null, descriptionKeywords: [], intent: 'image_merge_2', isLoadingDescription: false });
        setMainInstructionEn('');
        setMainInstructionZh('');
        setGeneratedFusedImage(null);
        setError(null);
        setSuggestions([]);
        setSuggestionError(null);
        handleDescribeImageForSlot('base', null, generatedFusedImage.src);
    }
  };

  const handleSwapImageReferencesInInstructions = () => {
    let currentEn = mainInstructionEn;
    currentEn = swapTextPair(currentEn, "Image A", "Image B", true);
    currentEn = swapTextPair(currentEn, "圖A", "圖B");  

    let currentZh = mainInstructionZh;
    currentZh = swapTextPair(currentZh, "圖A", "圖B");
    currentZh = swapTextPair(currentZh, "圖像A", "圖像B");
    currentZh = swapTextPair(currentZh, "Image A", "Image B", true); 
    
    setMainInstructionEn(currentEn);
    setMainInstructionZh(currentZh);
  };

  const handleOpenImageSelector = (targetSlot: 'base' | 'secondary') => {
    setImageSelectorTargetSlot(targetSlot);
    setShowImageSelectorModal(true);
  };

  const handleImageSelectedFromGallery = (selectedImage: ImageHistoryEntry) => {
    if (imageSelectorTargetSlot === 'base') {
      setBaseImageSlot(prev => ({
        ...prev,
        file: null,
        src: selectedImage.src,
        descriptionKeywords: [],
      }));
      handleDescribeImageForSlot('base', null, selectedImage.src);
    } else if (imageSelectorTargetSlot === 'secondary') {
      setSecondaryImageSlot(prev => ({
        ...prev,
        file: null,
        src: selectedImage.src,
        descriptionKeywords: [],
      }));
      handleDescribeImageForSlot('secondary', null, selectedImage.src);
    }
    setShowImageSelectorModal(false);
    setImageSelectorTargetSlot(null);
  };

  if (!isOpen) return null;

  const renderKeywordsWithAddButtons = (slot: ImageSlotState, slotName: string) => {
    return (
      <>
        {slot.isLoadingDescription && <div className="text-xs text-blue-500 flex items-center mt-1"><LoadingSpinner className="w-3 h-3 mr-1"/>正在提取圖像關鍵字...</div>}
        {slot.descriptionKeywords.length > 0 && !slot.isLoadingDescription && 
          !(slot.descriptionKeywords.length === 1 && (slot.descriptionKeywords[0].keywordEn.includes("unavailable") || slot.descriptionKeywords[0].keywordEn.includes("No image data") || slot.descriptionKeywords[0].keywordEn.includes("Failed to extract") || slot.descriptionKeywords[0].keywordEn.includes("Keyword extraction error"))) &&
        (
          <div className="mt-1 p-1.5 bg-white border rounded">
            <p className="text-[11px] font-medium text-gray-700 mb-1">AI 分析關鍵字 ({slotName}):</p>
            <div className="flex flex-wrap gap-1.5">
                {slot.descriptionKeywords.map((kw, index) => (
                    <button 
                        key={`${slot.id}-kw-${index}`}
                        onClick={() => handleAddKeywordToInstruction(kw)}
                        className="px-1.5 py-0.5 text-[10px] bg-gray-200 hover:bg-gray-300 rounded flex items-center space-x-1"
                        title={`加入 "${kw.keywordEn} / ${kw.keywordZh}" 到指令`}
                        disabled={isLoading || isFetchingSuggestions}
                    >
                       <PlusCircleIcon className="w-2.5 h-2.5" />
                       <span>{kw.keywordEn} / {kw.keywordZh}</span>
                    </button>
                ))}
            </div>
          </div>
        )}
        {(slot.descriptionKeywords.length === 0 || (slot.descriptionKeywords.length === 1 && (slot.descriptionKeywords[0].keywordEn.includes("unavailable") || slot.descriptionKeywords[0].keywordEn.includes("No image data") || slot.descriptionKeywords[0].keywordEn.includes("Failed to extract") || slot.descriptionKeywords[0].keywordEn.includes("Keyword extraction error")))) && !slot.isLoadingDescription && slot.src && (
            <p className="text-xs text-gray-400 mt-1">未能獲取此圖像的關鍵字。</p>
        )}
      </>
    );
  };

  return (
    <>
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-[90]" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-5xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <LayersIcon className="w-6 h-6 mr-2 text-gray-700" />
            {uiTexts.imageFusionStudioModalTitle.textZh}
          </h2>
          <IconButton onClick={onClose} aria-label="關閉" className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-7 h-7" />
          </IconButton>
        </div>

        <div className="flex-grow overflow-y-auto apple-scroll pr-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
            {/* Base Image Slot */}
            <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-gray-50 shadow">
              <p className="text-sm font-semibold text-gray-800">圖A</p>
              <FileUploadComponent
                file={baseImageSlot.file}
                fileSrc={baseImageSlot.src}
                onFileChange={handleBaseFileUpload}
                title="圖A"
                isLoading={baseImageSlot.isLoadingDescription || isLoading}
              />
              <button
                onClick={() => handleOpenImageSelector('base')}
                className="w-full mt-1.5 px-3 py-1.5 text-xs border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:text-black flex items-center justify-center"
                disabled={isLoading || baseImageSlot.isLoadingDescription}
              >
                <PhotoIcon className="w-4 h-4 mr-1.5" /> {uiTexts.imageFusionStudioImportFromGalleryButtonLabel.textZh} (圖A)
              </button>
              {renderKeywordsWithAddButtons(baseImageSlot, "圖A")}
              <div>
                <label htmlFor="baseIntent" className="text-xs font-medium text-gray-600">{uiTexts.imageFusionStudioUsageIntentLabel.textZh}:</label>
                <select id="baseIntent" value={baseImageSlot.intent} onChange={e => setBaseImageSlot(prev => ({ ...prev, intent: e.target.value as ImageUsageIntent }))} className="mt-1 w-full p-1.5 border-gray-300 rounded-md text-xs bg-white text-black focus:ring-black focus:border-black" disabled={isLoading || isFetchingSuggestions}>
                  {IMAGE_USAGE_INTENTS.map(opt => <option key={opt.value} value={opt.value}>{opt.labelZh} ({opt.labelEn})</option>)}
                </select>
              </div>
            </div>

            {/* Secondary Image Slot */}
            <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-gray-50 shadow">
              <p className="text-sm font-semibold text-gray-800">圖B</p>
              <FileUploadComponent
                file={secondaryImageSlot.file}
                fileSrc={secondaryImageSlot.src}
                onFileChange={handleSecondaryFileUpload}
                title="圖B"
                isLoading={secondaryImageSlot.isLoadingDescription || isLoading}
              />
              <button
                onClick={() => handleOpenImageSelector('secondary')}
                className="w-full mt-1.5 px-3 py-1.5 text-xs border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:text-black flex items-center justify-center"
                disabled={isLoading || secondaryImageSlot.isLoadingDescription}
              >
                <PhotoIcon className="w-4 h-4 mr-1.5" /> {uiTexts.imageFusionStudioImportFromGalleryButtonLabel.textZh} (圖B)
              </button>
              {secondaryImageSlot.src && renderKeywordsWithAddButtons(secondaryImageSlot, "圖B")}
              {secondaryImageSlot.src && (
                <div>
                  <label htmlFor="secondaryIntent" className="text-xs font-medium text-gray-600">{uiTexts.imageFusionStudioUsageIntentLabel.textZh}:</label>
                  <select id="secondaryIntent" value={secondaryImageSlot.intent} onChange={e => setSecondaryImageSlot(prev => ({ ...prev, intent: e.target.value as ImageUsageIntent }))} className="mt-1 w-full p-1.5 border-gray-300 rounded-md text-xs bg-white text-black focus:ring-black focus:border-black" disabled={isLoading || isFetchingSuggestions}>
                    {IMAGE_USAGE_INTENTS.map(opt => <option key={opt.value} value={opt.value}>{opt.labelZh} ({opt.labelEn})</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Instructions Area */}
          <div className="space-y-3 p-3 border border-gray-300 rounded-lg bg-gray-50 shadow">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800">主要編輯指令</h3>
                <IconButton
                    onClick={handleSwapImageReferencesInInstructions}
                    title={uiTexts.imageFusionStudioSwapInstructionsButtonTooltip.textZh}
                    aria-label={uiTexts.imageFusionStudioSwapInstructionsButtonTooltip.textZh}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isLoading || isFetchingSuggestions || (!mainInstructionEn.trim() && !mainInstructionZh.trim())}
                >
                    <SwitchHorizontalIcon className="w-4 h-4" />
                </IconButton>
            </div>
            {/* Chinese Instruction */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="fusionMainInstructionZh" className="block text-xs font-medium text-gray-700">{uiTexts.imageFusionStudioChineseInstructionLabel.textZh}</label>
                <button type="button" onClick={() => handleTranslateInstruction('en')} disabled={isTranslatingToEn || !mainInstructionZh.trim() || !isGeminiAvailable} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100 disabled:opacity-50 flex items-center">
                  {isTranslatingToEn ? <LoadingSpinner className="w-2.5 h-2.5 mr-1"/> : <LanguageIcon className="w-2.5 h-2.5 mr-1" />} {uiTexts.imageFusionStudioTranslateToEnButtonLabel.textZh}
                </button>
              </div>
              <textarea id="fusionMainInstructionZh" rows={2} value={mainInstructionZh} onChange={e => setMainInstructionZh(e.target.value)} className="w-full p-1.5 border-gray-300 rounded-md text-xs bg-white text-black" placeholder="例如：將圖A的風格套用到圖B的內容上。" disabled={isLoading || isFetchingSuggestions}/>
              {translateToEnError && <p className="text-[10px] text-red-500 mt-0.5">{translateToEnError}</p>}
            </div>
            {/* English Instruction */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="fusionMainInstructionEn" className="block text-xs font-medium text-gray-700">{uiTexts.imageFusionStudioEnglishInstructionLabel.textZh}</label>
                <button type="button" onClick={() => handleTranslateInstruction('zh')} disabled={isTranslatingToZh || !mainInstructionEn.trim() || !isGeminiAvailable} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100 disabled:opacity-50 flex items-center">
                  {isTranslatingToZh ? <LoadingSpinner className="w-2.5 h-2.5 mr-1"/> : <LanguageIcon className="w-2.5 h-2.5 mr-1" />} {uiTexts.imageFusionStudioTranslateToZhButtonLabel.textZh}
                </button>
              </div>
              <textarea id="fusionMainInstructionEn" rows={2} value={mainInstructionEn} onChange={e => setMainInstructionEn(e.target.value)} className="w-full p-1.5 border-gray-300 rounded-md text-xs bg-white text-black" placeholder="e.g., Apply the style of Image A to the content of Image B." disabled={isLoading || isFetchingSuggestions}/>
              {translateToZhError && <p className="text-[10px] text-red-500 mt-0.5">{translateToZhError}</p>}
            </div>
            <button type="button" onClick={handleFetchInstructionSuggestions} disabled={isFetchingSuggestions || isLoading || !isGeminiAvailable} className="w-full mt-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center">
              {isFetchingSuggestions ? <LoadingSpinner className="w-3.5 h-3.5 mr-1.5"/> : <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />} {uiTexts.imageFusionStudioAISuggestionButtonLabel.textZh}
            </button>
            {suggestionThinkingMessages.length > 0 && isFetchingSuggestions && (
                <div className="my-1 p-1 border border-gray-200 rounded-md bg-white text-[10px]">
                    {suggestionThinkingMessages.map((message, index) => (
                    <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentSuggestionThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                        {index < currentSuggestionThinkingIndex ? <CheckCircleIcon className="w-2.5 h-2.5 mr-1 text-green-500 shrink-0" />
                        : index === currentSuggestionThinkingIndex ? <LoadingSpinner className="w-2 h-2 mr-1 text-blue-500 shrink-0" />
                        : <div className="w-2.5 h-2.5 mr-1 shrink-0 border border-gray-300 rounded-full" />}
                        <span className={`${index === currentSuggestionThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                    </div>
                    ))}
                </div>
            )}
            {suggestionError && !isFetchingSuggestions && <p className="text-xs text-red-500 p-1 bg-red-50 border border-red-200 rounded">{suggestionError}</p>}
            {suggestions.length > 0 && !isFetchingSuggestions && !suggestionError && (
              <div className="space-y-1 border rounded p-1 max-h-40 overflow-y-auto apple-scroll">
                {suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => handleApplySuggestion(s)} className="w-full text-left p-1 text-[10px] hover:bg-gray-100 rounded">
                    <strong>En:</strong> {s.suggestionEn} <br/><span className="text-gray-600"><strong>Zh:</strong> {s.suggestionZh}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
           {/* Generation Button & Result */}
          <div className="space-y-3">
            <button onClick={handleGenerateFusedImage} disabled={isLoading || !mainInstructionEn.trim() || !baseImageSlot.src} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed">
              {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2"/> : <LayersIcon className="w-5 h-5 mr-2" />}
              {isLoading ? '處理中...' : uiTexts.imageFusionStudioGenerateButtonLabel.textZh}
            </button>
            {error && !isLoading && <div className="p-2 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start"><ExclamationTriangleIcon className="w-4 h-4 mr-1.5 shrink-0 mt-px"/> {error}</div>}
            {generationThinkingMessages.length > 0 && isLoading && (
                 <div className="my-1 p-1.5 border border-gray-200 rounded-md bg-white text-xs">
                    {generationThinkingMessages.map((message, index) => (
                    <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentGenerationThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                        {index < currentGenerationThinkingIndex ? <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 shrink-0" />
                        : index === currentGenerationThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1 text-blue-500 shrink-0" />
                        : <div className="w-3 h-3 mr-1 shrink-0 border border-gray-300 rounded-full" />}
                        <span className={`${index === currentGenerationThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                    </div>
                    ))}
                </div>
            )}
            {generatedFusedImage && !isLoading && !error && (
              <div className="mt-3 p-2 border border-green-300 rounded-lg bg-green-50">
                <p className="text-sm font-semibold text-green-700 mb-1.5">融合/風格化結果:</p>
                <img src={generatedFusedImage.src} alt="融合後的圖像" className="w-full rounded border border-gray-200 shadow-sm object-contain max-h-72"/>
                <button onClick={handleUseResultForEditing} className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 flex items-center justify-center">
                    <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5"/> {uiTexts.imageFusionStudioUseResultButtonLabel.textZh}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">關閉</button>
        </div>
      </div>
    </div>
    {showImageSelectorModal && (
        <ImageSelectorModal
            isOpen={showImageSelectorModal}
            onClose={() => { setShowImageSelectorModal(false); setImageSelectorTargetSlot(null); }}
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
