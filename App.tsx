
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { Header } from './components/Header';
import { StyleSelector } from './components/StyleSelector';
import { RoomTypeSelector } from './components/RoomTypeSelector';
import { PromptCategoryAccordion } from './components/PromptCategoryAccordion';
import { PromptBuilder } from './components/PromptBuilder';
import { ImageGenerator } from './components/ImageGenerator';
import { AISuggestionsModal } from './components/AISuggestionsModal';
import { ImageHistoryDisplay } from './components/ImageHistoryDisplay';
import { ImageDetailModal } from './components/ImageDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AddStyleModal } from './components/AddStyleModal';
import { AddCustomTermModal } from './components/AddCustomTermModal'; // New
import { GenerateStyleDetailsButton } from './components/GenerateStyleDetailsButton';
import { DesignStyle, PromptCategory, SelectedPromptTerm, PromptTerm, AISuggestedTerm, ImageHistoryEntry, GeneratedImage, PromptStateForHistory, ImageEngine, AIStyleDetails } from './types'; // Updated InitialPromptTerm
import { DESIGN_STYLES as INITIAL_DESIGN_STYLES, PROMPT_CATEGORIES as INITIAL_PROMPT_CATEGORIES, ROOM_TYPES } from './constants/designData';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, ExclamationTriangleIcon, PlusIcon, ChevronDoubleDownIcon, CubeTransparentIcon } from './components/Icons'; // Added CubeTransparentIcon
import { LoadingSpinner } from './components/LoadingSpinner';
import { IconButton } from './components/IconButton';
import { SettingsProvider } from './contexts/SettingsContext';

const USER_STYLES_STORAGE_KEY = 'echoRoomUserStyles';
const USER_CUSTOM_PROMPT_TERMS_STORAGE_KEY = 'echoRoomUserCustomPromptTerms'; // New

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

const AppContent: React.FC = () => {
  const [userDesignStyles, setUserDesignStyles] = useState<DesignStyle[]>(() => {
    try {
      const storedStyles = localStorage.getItem(USER_STYLES_STORAGE_KEY);
      if (storedStyles) return JSON.parse(storedStyles);
    } catch (e) { console.error("Error loading user styles from localStorage:", e); }
    return INITIAL_DESIGN_STYLES;
  });

  const [userCustomTerms, setUserCustomTerms] = useState<PromptTerm[]>(() => { // New state for custom terms
    try {
      const storedCustomTerms = localStorage.getItem(USER_CUSTOM_PROMPT_TERMS_STORAGE_KEY);
      if (storedCustomTerms) return JSON.parse(storedCustomTerms);
    } catch (e) { console.error("Error loading custom prompt terms from localStorage:", e); }
    return [];
  });

  const userPromptCategories = useMemo(() => { // Combines initial categories with custom terms
    const baseCategories = JSON.parse(JSON.stringify(INITIAL_PROMPT_CATEGORIES)) as PromptCategory[];
    userCustomTerms.forEach(customTerm => {
      const category = baseCategories.find(cat => cat.id === customTerm.categoryId);
      if (category) {
        if (!category.terms.find(t => t.id === customTerm.id)) { // Avoid duplicates
          category.terms.push(customTerm);
        }
      } else {
        console.warn(`Custom term "${customTerm.termEn}" has unknown categoryId "${customTerm.categoryId}"`);
      }
    });
    return baseCategories;
  }, [userCustomTerms]);

  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | null>(userDesignStyles[0] || null);
  const [selectedRoomType, setSelectedRoomType] = useState<PromptTerm | null>(ROOM_TYPES[0] || null); // Updated type
  const [activePromptTerms, setActivePromptTerms] = useState<Map<string, SelectedPromptTerm>>(new Map());
  const [generatedPromptEn, setGeneratedPromptEn] = useState<string>('');
  const [generatedPromptZh, setGeneratedPromptZh] = useState<string>('');
  const [showStyleDetails, setShowStyleDetails] = useState<boolean>(false); 

  const [aiSuggestedTerms, setAiSuggestedTerms] = useState<AISuggestedTerm[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState<boolean>(false);
  const [showAiSuggestionsModal, setShowAiSuggestionsModal] = useState<boolean>(false);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);

  const [isPolishingEn, setIsPolishingEn] = useState<boolean>(false);
  const [isPolishingZh, setIsPolishingZh] = useState<boolean>(false);
  const [polishError, setPolishError] = useState<string | null>(null);

  const [imageHistory, setImageHistory] = useState<ImageHistoryEntry[]>([]);
  const [selectedImageForModal, setSelectedImageForModal] = useState<ImageHistoryEntry | GeneratedImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAddStyleModal, setShowAddStyleModal] = useState<boolean>(false);
  const [showAddCustomTermModal, setShowAddCustomTermModal] = useState<boolean>(false); // New
  const [currentCategoryForCustomTerm, setCurrentCategoryForCustomTerm] = useState<{id: string, name: string} | null>(null); // New

  const [isLoadingStyleDetailsAI, setIsLoadingStyleDetailsAI] = useState<boolean>(false);
  const [styleDetailsAIError, setStyleDetailsAIError] = useState<string | null>(null);

  const [isLoadingRandomPrompts, setIsLoadingRandomPrompts] = useState<boolean>(false); // New
  const [randomPromptsError, setRandomPromptsError] = useState<string | null>(null); // New

  const geminiApiKey = process.env.API_KEY;
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const bflAIApiKey = process.env.BFL_API_KEY; 

  const ai = useMemo(() => geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null, [geminiApiKey]);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(USER_STYLES_STORAGE_KEY, JSON.stringify(userDesignStyles)); }
    catch (e) { console.error("Error saving user styles to localStorage:", e); }
  }, [userDesignStyles]);

  useEffect(() => { // Save custom terms to localStorage
    try { localStorage.setItem(USER_CUSTOM_PROMPT_TERMS_STORAGE_KEY, JSON.stringify(userCustomTerms)); }
    catch (e) { console.error("Error saving custom prompt terms to localStorage:", e); }
  }, [userCustomTerms]);

  const relevantCategories = useMemo(() => {
    const sourceCategories = userPromptCategories; // Use combined categories
    if (selectedStyle?.relatedCategories && selectedStyle.relatedCategories.length > 0) {
      return sourceCategories.filter(cat => selectedStyle.relatedCategories.includes(cat.id));
    }
    return sourceCategories;
  }, [selectedStyle, userPromptCategories]);

  const [accordionStates, setAccordionStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    relevantCategories.forEach(cat => { initialState[cat.id] = cat.isOpen !== undefined ? cat.isOpen : false; });
    return initialState;
  });

  useEffect(() => {
    setAccordionStates(prevStates => {
        const newStates: Record<string, boolean> = {};
        let changed = false;
        relevantCategories.forEach(cat => {
            if (prevStates[cat.id] !== undefined) newStates[cat.id] = prevStates[cat.id];
            else { newStates[cat.id] = cat.isOpen !== undefined ? cat.isOpen : false; changed = true; }
        });
        const oldKeys = Object.keys(prevStates);
        const newKeys = Object.keys(newStates);
        if (oldKeys.length !== newKeys.length || oldKeys.some(key => !newKeys.includes(key))) changed = true;
        return changed ? newStates : prevStates;
    });
  }, [relevantCategories]);

  const handleToggleAccordion = (categoryId: string) => setAccordionStates(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  const handleExpandAllAccordions = () => {
      const allOpen: Record<string, boolean> = {};
      relevantCategories.forEach(cat => { allOpen[cat.id] = true; });
      setAccordionStates(prev => ({ ...prev, ...allOpen }));
  };
  const handleCollapseAllAccordions = () => {
      const allClosed: Record<string, boolean> = {};
      relevantCategories.forEach(cat => { allClosed[cat.id] = false; });
      setAccordionStates(prev => ({ ...prev, ...allClosed }));
  };

  const getNextOrder = useCallback(() => {
    if (activePromptTerms.size === 0) return 1;
    return Math.max(0, ...Array.from(activePromptTerms.values()).map(t => t.order || 0)) + 1;
  }, [activePromptTerms]);

  const updatePrompts = useCallback(() => {
    const termsArray = Array.from(activePromptTerms.values()).sort((a,b) => (a.order || 0) - (b.order || 0) );
    const baseEnParts: string[] = [];
    if (selectedStyle) baseEnParts.push(selectedStyle.basePromptEn);
    if (selectedRoomType) baseEnParts.push(selectedRoomType.termEn);
    const baseZhParts: string[] = [];
    if (selectedStyle) baseZhParts.push(selectedStyle.basePromptZh);
    if (selectedRoomType) baseZhParts.push(selectedRoomType.termZh);
    const enPrompt = [...baseEnParts, ...termsArray.map(term => term.weight === 1 ? term.termEn : `(${term.termEn}:${term.weight.toFixed(1)})`)].join(', ');
    const zhPrompt = [...baseZhParts, ...termsArray.map(term => term.weight === 1 ? term.termZh : `(${term.termZh}:${term.weight.toFixed(1)})`)].join(', ');
    setGeneratedPromptEn(enPrompt);
    setGeneratedPromptZh(zhPrompt);
  }, [activePromptTerms, selectedStyle, selectedRoomType]);

  useEffect(() => { updatePrompts(); }, [activePromptTerms, selectedStyle, selectedRoomType, updatePrompts]);

  const handleStyleSelect = useCallback((style: DesignStyle) => setSelectedStyle(style), []);
  const handleRoomTypeSelect = useCallback((roomType: PromptTerm | null) => setSelectedRoomType(roomType), []); // Updated type

  const toggleTerm = useCallback((term: PromptTerm, categoryId: string, order?: number) => { // Updated type
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      if (newTerms.has(term.id)) newTerms.delete(term.id);
      else {
        const termOrder = order !== undefined ? order : getNextOrder();
        newTerms.set(term.id, { ...term, weight: 1.0, locked: false, categoryId, order: termOrder });
      }
      return newTerms;
    });
  }, [getNextOrder]);

  const updateTermWeight = useCallback((termId: string, delta: number) => {
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      const term = newTerms.get(termId);
      if (term) {
        const newWeight = Math.max(0.1, Math.min(2.0, parseFloat((term.weight + delta).toFixed(1))));
        newTerms.set(termId, { ...term, weight: newWeight });
      }
      return newTerms;
    });
  }, []);

  const toggleTermLock = useCallback((termId: string) => {
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      const term = newTerms.get(termId);
      if (term) newTerms.set(termId, { ...term, locked: !term.locked });
      return newTerms;
    });
  }, []);
  
  const handleClearAllTerms = useCallback(() => setActivePromptTerms(new Map()), []);

  const handleAddKeywordFromDetails = useCallback((termEn: string, termZh: string) => {
    const termId = `detail_${termEn.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}_${Date.now()%1000}`;
    const newTerm: PromptTerm = { id: termId, termEn, termZh, categoryId: 'style_detail_keyword' }; // Added categoryId
    const existingTerm = Array.from(activePromptTerms.values()).find(t => t.termEn.toLowerCase() === termEn.toLowerCase());
    if (!activePromptTerms.has(termId) && !existingTerm) toggleTerm(newTerm, 'style_detail_keyword', getNextOrder());
    else if (existingTerm) console.log("Term already exists:", existingTerm.termEn);
  }, [activePromptTerms, toggleTerm, getNextOrder]);

  const handleGetAISuggestions = useCallback(async () => {
    if (!ai || !selectedStyle || !selectedRoomType) {
      setAiSuggestionError("請先選擇風格和空間類型。");
      return;
    }
    setIsLoadingAiSuggestions(true);
    setAiSuggestionError(null);
    setAiSuggestedTerms([]); 
    const currentTermsString = Array.from(activePromptTerms.values()).map(t => `${t.termEn} (${t.termZh})`).join(', ') || '無';
    const prompt = `您是一位專業的室內設計提示詞助手。
使用者選擇的風格是：「${selectedStyle.nameEn} / ${selectedStyle.nameZh}」，空間類型是：「${selectedRoomType.termEn} / ${selectedRoomType.termZh}」。
目前已選用的提示詞有：${currentTermsString}。
請建議5-7個獨特且互補的提示詞（關鍵字或短語），包含英文和繁體中文，以增強此室內設計的AI圖像生成提示詞效果。
重點關注：
- 符合風格但通常未列出的特定材料。
- 獨特的裝飾品或特徵。
- 氛圍或情緒描述詞。
- 特定的照明品質。
- 增添真實感或藝術感的元素。
請勿建議過於通用或已被風格/空間類型暗示的詞語。請勿建議与「目前已選用的提示詞」列表中相似的詞語。
請以有效的JSON陣列物件格式返回建議。每個物件必須具有以下結構：
{ "id": "一個該詞語的唯一字串識別碼 (ai_sugg_開頭)", "termEn": "English Term", "termZh": "繁體中文術語" }
確保JSON格式正確，且僅包含建議物件的陣列。`;
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: "application/json" } });
      const parsedSuggestions = parseGeminiJsonResponse<AISuggestedTerm[]>(response.text);
      if (parsedSuggestions && Array.isArray(parsedSuggestions)) {
        const validSuggestions = parsedSuggestions.filter(term => term && typeof term.id === 'string' && typeof term.termEn === 'string' && typeof term.termZh === 'string' && term.id && term.termEn && term.termZh);
        if (validSuggestions.length > 0) { setAiSuggestedTerms(validSuggestions); if (!showAiSuggestionsModal) setShowAiSuggestionsModal(true); }
        else { setAiSuggestionError("AI建議已收到，但部分項目缺少必要欄位或為空。"); console.error("有問題的建議數據:", parsedSuggestions, "原始文本:", response.text); }
      } else { setAiSuggestionError("AI返回了意外的格式。"); console.error("解析建議錯誤或非陣列:", parsedSuggestions, "原始文本:", response.text); }
    } catch (e: any) { console.error("獲取AI建議時出錯:", e); setAiSuggestionError(`獲取AI建議失敗：${e.message || '未知錯誤'}`); }
    finally { setIsLoadingAiSuggestions(false); }
  }, [ai, selectedStyle, selectedRoomType, activePromptTerms, showAiSuggestionsModal]);

  const addAISuggestedTerm = useCallback((term: AISuggestedTerm) => {
    const order = getNextOrder(); 
    toggleTerm(term, 'ai_suggested', order);
  }, [toggleTerm, getNextOrder]);

  const handlePolishPrompt = useCallback(async (language: 'en' | 'zh') => {
    if (!ai) return;
    const promptToPolish = language === 'en' ? generatedPromptEn : generatedPromptZh;
    if (!promptToPolish) { setPolishError(`該 ${language === 'en' ? '英文' : '中文'} 提示詞為空。`); return; }
    if (language === 'en') setIsPolishingEn(true); else setIsPolishingZh(true);
    setPolishError(null);
    const polishInstruction = language === 'en' ? 
      `Refine the English prompt for interior design AI: "${promptToPolish}". Make it vivid, descriptive, optimized. Return only refined prompt.`
      : `優化繁體中文室內設計AI提示詞：「${promptToPolish}」。使其生動、描述性強、優化。僅返回優化後提示詞。`;
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: polishInstruction });
      const polishedText = response.text.trim();
      if (language === 'en') setGeneratedPromptEn(polishedText); else setGeneratedPromptZh(polishedText);
    } catch (e: any) { console.error(`潤飾 ${language} 提示詞時出錯:`, e); setPolishError(`未能潤飾 ${language} 提示詞: ${e.message || '未知錯誤'}`); }
    finally { if (language === 'en') setIsPolishingEn(false); else setIsPolishingZh(false); }
  }, [ai, generatedPromptEn, generatedPromptZh]);

  const handleImageGenerated = useCallback((image: GeneratedImage, engine: ImageEngine) => {
    const currentPromptState: PromptStateForHistory = { selectedStyleId: selectedStyle?.id || null, selectedRoomTypeId: selectedRoomType?.id || null, activeTerms: Array.from(activePromptTerms.entries()) };
    const historyEntry: ImageHistoryEntry = { ...image, timestamp: Date.now(), promptState: currentPromptState, engine };
    setImageHistory(prev => [historyEntry, ...prev.slice(0, 19)]); 
  }, [selectedStyle, selectedRoomType, activePromptTerms]);

  const handleRestorePromptState = useCallback((historyEntry: ImageHistoryEntry) => {
    const styleToRestore = userDesignStyles.find(s => s.id === historyEntry.promptState.selectedStyleId) || null;
    const roomTypeToRestore = ROOM_TYPES.find(r => r.id === historyEntry.promptState.selectedRoomTypeId) || null;
    setSelectedStyle(styleToRestore);
    setSelectedRoomType(roomTypeToRestore);
    setActivePromptTerms(new Map(historyEntry.promptState.activeTerms));
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }, [userDesignStyles]);

  const handleOpenImageDetail = (item: ImageHistoryEntry | GeneratedImage) => {
    const isHistoryEntry = 'timestamp' in item;
    if (isHistoryEntry) {
        const entry = item as ImageHistoryEntry;
        const index = imageHistory.findIndex(histEntry => histEntry.id === entry.id);
        setSelectedImageForModal(entry);
        setSelectedImageIndex(index !== -1 ? index : 0);
    } else { 
        const latestInHistory = imageHistory.length > 0 && imageHistory[0].id === item.id ? imageHistory[0] : null;
        if (latestInHistory) { setSelectedImageForModal(latestInHistory); setSelectedImageIndex(0); }
        else { setSelectedImageForModal(item as GeneratedImage); setSelectedImageIndex(null); }
    }
  };
  
  const handleViewImageFromGenerator = (generatedImage: GeneratedImage) => {
    const historyEntry = imageHistory.find(entry => entry.id === generatedImage.id);
    if (historyEntry) handleOpenImageDetail(historyEntry);
    else { setSelectedImageForModal(generatedImage); setSelectedImageIndex(null); }
  };

  const handleNavigateImageDetail = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null || !selectedImageForModal || !('timestamp' in selectedImageForModal)) return;
    let newIndex = selectedImageIndex;
    if (direction === 'prev') newIndex = Math.max(0, selectedImageIndex - 1);
    else newIndex = Math.min(imageHistory.length - 1, selectedImageIndex + 1);
    if (newIndex !== selectedImageIndex) { setSelectedImageIndex(newIndex); setSelectedImageForModal(imageHistory[newIndex]); }
  };

  const scrollToImageGenerator = () => rightColumnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggleSettingsModal = () => setShowSettingsModal(prev => !prev);
  const toggleAddStyleModal = () => setShowAddStyleModal(prev => !prev);

  const toggleAddCustomTermModal = useCallback((categoryId?: string, categoryName?: string) => {
    if (categoryId && categoryName) setCurrentCategoryForCustomTerm({id: categoryId, name: categoryName});
    else setCurrentCategoryForCustomTerm(null);
    setShowAddCustomTermModal(prev => !prev);
  }, []);

  const handleAddCustomStyle = (nameEn: string, nameZh: string) => {
    const newStyle: DesignStyle = { id: `custom_style_${Date.now()}`, nameEn, nameZh, descriptionEn: '', descriptionZh: '', furnitureBrandsEn: [], furnitureBrandsZh: [], decorTipsEn: [], decorTipsZh: [], basePromptEn: `${nameEn} style`, basePromptZh: `${nameZh}風格`, relatedCategories: INITIAL_PROMPT_CATEGORIES.map(cat => cat.id), isCustom: true };
    setUserDesignStyles(prev => [newStyle, ...prev]);
    setSelectedStyle(newStyle);
    setShowStyleDetails(true);
  };

  const handleAddCustomTerm = useCallback((termEn: string, termZh: string, categoryId: string) => {
    const newTerm: PromptTerm = { id: `custom_term_${categoryId}_${Date.now()}`, termEn, termZh, categoryId, isCustom: true };
    setUserCustomTerms(prev => [...prev, newTerm]);
  }, []);

  const handleTranslateInputForModal = useCallback(async (textToTranslate: string, targetLanguage: 'en' | 'zh'): Promise<string | null> => {
    if (!ai) { console.error("Gemini AI client not available for translation."); return null; }
    
    let prompt = '';
    if (targetLanguage === 'en') {
      prompt = `Translate the following Traditional Chinese interior design keyword/phrase to its concise English equivalent. Return only the English translation, without any explanations or quotation marks. Input: "${textToTranslate}" Output:`;
    } else { // targetLanguage === 'zh'
      prompt = `Translate the following English interior design keyword/phrase to its concise Traditional Chinese equivalent. Return only the Traditional Chinese translation, without any explanations or quotation marks. Input: "${textToTranslate}" Output:`;
    }

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      return response.text.trim();
    } catch (e: any) { console.error("Error translating with AI:", e); throw e; }
  }, [ai]);


  const handleGenerateStyleDetailsWithAI = useCallback(async () => {
    if (!ai || !selectedStyle) { setStyleDetailsAIError("請先選擇一個風格。"); return; }
    setIsLoadingStyleDetailsAI(true); setStyleDetailsAIError(null);
    const prompt = `您是一位專業的室內設計風格分析師。針對設計風格：「${selectedStyle.nameEn} / ${selectedStyle.nameZh}」，請提供以下詳細資訊。風格基礎提示詞：「${selectedStyle.basePromptEn}」 / 「${selectedStyle.basePromptZh}」。請嚴格按照以下JSON物件格式返回資訊，不含任何額外文字或Markdown：{ "descriptionEn": "Detailed English description, 50-80 words.", "descriptionZh": "詳細繁中描述, 約50-80字。", "furnitureBrandsEn": ["Brand1", "Brand2", "Brand3"], "furnitureBrandsZh": ["品牌1", "品牌2", "品牌3"], "decorTipsEn": ["Tip1", "Tip2", "Tip3"], "decorTipsZh": ["技巧1", "技巧2", "技巧3"] }。確保每個陣列剛好三個項目，且中英文對應。`;
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: "application/json" } });
      const parsedDetails = parseGeminiJsonResponse<AIStyleDetails>(response.text);
      if (parsedDetails && typeof parsedDetails.descriptionEn === 'string' && typeof parsedDetails.descriptionZh === 'string' && Array.isArray(parsedDetails.furnitureBrandsEn) && Array.isArray(parsedDetails.furnitureBrandsZh) && Array.isArray(parsedDetails.decorTipsEn) && Array.isArray(parsedDetails.decorTipsZh) && parsedDetails.furnitureBrandsEn.every(item => typeof item === 'string') && parsedDetails.furnitureBrandsZh.every(item => typeof item === 'string') && parsedDetails.decorTipsEn.every(item => typeof item === 'string') && parsedDetails.decorTipsZh.every(item => typeof item === 'string') && parsedDetails.furnitureBrandsEn.length === 3 && parsedDetails.decorTipsEn.length === 3) {
        setUserDesignStyles(prevStyles => prevStyles.map(style => style.id === selectedStyle.id ? { ...style, ...parsedDetails } : style));
        setSelectedStyle(prevSelStyle => prevSelStyle ? { ...prevSelStyle, ...parsedDetails } : null);
      } else { setStyleDetailsAIError("AI返回的資料格式不完整、不符預期或陣列項目數量不正確。"); console.error("AI生成的風格詳細資料格式錯誤:", parsedDetails, "原始文本:", response.text); }
    } catch (e: any) { console.error("使用AI生成風格詳細資訊時出錯:", e); setStyleDetailsAIError(`生成失敗：${e.message || '未知錯誤'}`); }
    finally { setIsLoadingStyleDetailsAI(false); }
  }, [ai, selectedStyle]);

  const handleTranslateNameToEnglish = useCallback(async (nameZh: string): Promise<string | null> => {
    if (!ai) { console.error("Gemini AI client not available for translation."); return null; }
    const prompt = `Translate the following Traditional Chinese interior design style name to English. Return only the concise English name, without any explanations or quotation marks. Input: "${nameZh}" Output:`;
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      return response.text.trim();
    } catch (e: any) { console.error("Error translating name with AI:", e); throw e; }
  }, [ai]);

  const handleRandomizeAllPrompts = useCallback(async () => {
    if (!ai || !selectedStyle || !selectedRoomType) {
      setRandomPromptsError("請先選擇風格和空間類型才能隨機選詞。");
      return;
    }
    setIsLoadingRandomPrompts(true);
    setRandomPromptsError(null);

    const allRelevantTermsFromCategories = relevantCategories.flatMap(cat => cat.terms);
    if (allRelevantTermsFromCategories.length === 0) {
      setRandomPromptsError("沒有可供選擇的提示詞。");
      setIsLoadingRandomPrompts(false);
      return;
    }

    const termsListForPrompt = allRelevantTermsFromCategories.map(t => `- ${t.termEn} / ${t.termZh} (ID: ${t.id})`).join('\n');
    const prompt = `You are an AI assistant for interior design prompt generation.
Current Style: ${selectedStyle.nameEn} / ${selectedStyle.nameZh}
Room Type: ${selectedRoomType.termEn} / ${selectedRoomType.termZh}
Available prompt terms (with IDs):
${termsListForPrompt}

Based on the style and room type, please select 5 to 7 diverse and complementary term IDs from the list above that would create a great interior design image.
Prioritize terms that are highly characteristic of the style or offer unique details.
Return a JSON array of selected term IDs, like: ["id1", "id2", "id3", "id4", "id5"].
Ensure the output is only the JSON array.`;

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const suggestedTermIds = parseGeminiJsonResponse<string[]>(response.text);

      if (suggestedTermIds && Array.isArray(suggestedTermIds) && suggestedTermIds.every(id => typeof id === 'string')) {
        setActivePromptTerms(prevTerms => {
          const newTerms = new Map<string, SelectedPromptTerm>();
          // Preserve locked terms
          prevTerms.forEach((term, id) => {
            if (term.locked) {
              newTerms.set(id, term);
            }
          });
          
          let orderOffset = (newTerms.size > 0 ? Math.max(...Array.from(newTerms.values()).map(t => t.order)) : 0) + 1;

          suggestedTermIds.forEach(idToActivate => {
            if (!newTerms.has(idToActivate)) { // Don't re-add if it was locked and already present
              const termDefinition = allRelevantTermsFromCategories.find(t => t.id === idToActivate);
              if (termDefinition) {
                 const categoryOfTerm = userPromptCategories.find(cat => cat.terms.some(t => t.id === idToActivate));
                 newTerms.set(idToActivate, { 
                    ...termDefinition, 
                    weight: 1.0, 
                    locked: false, 
                    categoryId: categoryOfTerm?.id || 'unknown', // Find actual categoryId
                    order: orderOffset++ 
                });
              }
            }
          });
          return newTerms;
        });
      } else {
        setRandomPromptsError("AI 返回的隨機選詞建議格式不正確。");
        console.error("AI隨機選詞建議格式錯誤:", suggestedTermIds, "原始文本:", response.text);
      }
    } catch (e: any) {
      console.error("隨機選詞時出錯:", e);
      setRandomPromptsError(`隨機選詞失敗：${e.message || '未知錯誤'}`);
    } finally {
      setIsLoadingRandomPrompts(false);
    }
  }, [ai, selectedStyle, selectedRoomType, relevantCategories, userPromptCategories]);


  if (!geminiApiKey && !openAIApiKey && !bflAIApiKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="p-8 bg-white shadow-xl rounded-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">API 金鑰錯誤</h1>
          <p className="text-gray-700">任何 AI 服務的 API 金鑰均未設定。</p>
          <p className="text-gray-600 mt-2 text-sm">請確保下列至少一個環境變數已設定：</p>
          <ul className="text-gray-600 mt-1 text-xs list-disc list-inside">
            <li><code className="bg-gray-200 p-1 rounded">process.env.API_KEY</code> (Gemini)</li>
            <li><code className="bg-gray-200 p-1 rounded">process.env.OPENAI_API_KEY</code> (OpenAI)</li>
            <li><code className="bg-gray-200 p-1 rounded">process.env.BFL_API_KEY</code> (BFL.ai)</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onToggleSettings={toggleSettingsModal} />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6 p-4 bg-white rounded-xl shadow-lg apple-scroll overflow-y-auto max-h-[calc(100vh-120px)]">
            <StyleSelector styles={userDesignStyles} selectedStyle={selectedStyle} onSelect={handleStyleSelect} onShowAddStyleModal={toggleAddStyleModal} />
            {selectedStyle && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <button onClick={() => setShowStyleDetails(!showStyleDetails)} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-700 hover:text-gray-900" aria-expanded={showStyleDetails} aria-controls="style-details-content">
                  <span>{selectedStyle.nameEn} / {selectedStyle.nameZh} 詳細資訊</span>
                  {showStyleDetails ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
                {showStyleDetails && (
                  <div id="style-details-content" className="mt-2 space-y-3 text-xs text-gray-600">
                    <GenerateStyleDetailsButton onClick={handleGenerateStyleDetailsWithAI} isLoading={isLoadingStyleDetailsAI} error={styleDetailsAIError} geminiApiKeySet={!!geminiApiKey} disabled={!selectedStyle}/>
                    <p><strong className="font-medium">描述 (En):</strong> {selectedStyle.descriptionEn || '尚無描述。'}</p>
                    <p><strong className="font-medium">描述 (繁中):</strong> {selectedStyle.descriptionZh || '尚無描述。'}</p>
                    <div><strong className="font-medium block mb-1">主要家具/品牌:</strong>
                        {(selectedStyle.furnitureBrandsEn && selectedStyle.furnitureBrandsEn.length > 0) ? (
                            <div className="flex flex-wrap gap-1.5"> {selectedStyle.furnitureBrandsEn.map((brandEn, index) => (
                                <button key={`brand-${index}-${selectedStyle.id}`} onClick={() => handleAddKeywordFromDetails(brandEn, selectedStyle.furnitureBrandsZh?.[index] || brandEn)} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-[10px] flex items-center space-x-1 transition-colors" title={`新增 ${brandEn} / ${selectedStyle.furnitureBrandsZh?.[index] || brandEn}`}>
                                    <PlusIcon className="w-2.5 h-2.5" /><span>{brandEn} / {selectedStyle.furnitureBrandsZh?.[index] || brandEn}</span></button> ))} </div>
                        ) : <p className="text-[11px] text-gray-500">尚無家具/品牌資訊。</p>}
                    </div>
                     <div><strong className="font-medium block mb-1 mt-2">佈置技巧:</strong>
                        {(selectedStyle.decorTipsEn && selectedStyle.decorTipsEn.length > 0) ? (
                            <div className="flex flex-wrap gap-1.5"> {selectedStyle.decorTipsEn.map((tipEn, index) => (
                                <button key={`tip-${index}-${selectedStyle.id}`} onClick={() => handleAddKeywordFromDetails(tipEn, selectedStyle.decorTipsZh?.[index] || tipEn)} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-[10px] flex items-center space-x-1 transition-colors" title={`新增 ${tipEn} / ${selectedStyle.decorTipsZh?.[index] || tipEn}`}>
                                    <PlusIcon className="w-2.5 h-2.5" /><span>{tipEn} / {selectedStyle.decorTipsZh?.[index] || tipEn}</span></button>))} </div>
                        ) : <p className="text-[11px] text-gray-500">尚無佈置技巧資訊。</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
            <RoomTypeSelector roomTypes={ROOM_TYPES} selectedRoomType={selectedRoomType} onSelect={handleRoomTypeSelect} />
            <div className="my-4">
              <button onClick={handleGetAISuggestions} disabled={isLoadingAiSuggestions || !selectedStyle || !selectedRoomType || !geminiApiKey} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed" title={!geminiApiKey ? "Gemini API 金鑰未設定" : (!selectedStyle || !selectedRoomType ? "請先選擇風格和空間類型" : "獲取 AI 建議")}>
                {isLoadingAiSuggestions && !showAiSuggestionsModal ? (<><LoadingSpinner className="w-5 h-5 mr-2" /> 正在獲取建議...</>) : (<><SparklesIcon className="w-5 h-5 mr-2" /> 獲取 AI 建議</>)}
              </button>
              {aiSuggestionError && (<div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-700 flex items-start"><ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5"/><span>{aiSuggestionError}</span></div>)}
            </div>
            <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-800">提示詞分類</h2>
                    <div className="space-x-1 sm:space-x-2">
                        <button onClick={handleRandomizeAllPrompts} disabled={isLoadingRandomPrompts || !selectedStyle || !selectedRoomType || !geminiApiKey} className="text-xs text-gray-600 hover:text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center" title={!geminiApiKey ? "Gemini API 金鑰未設定" : (!selectedStyle || !selectedRoomType ? "請先選擇風格和空間" : "一鍵隨機選詞")}>
                            {isLoadingRandomPrompts ? <LoadingSpinner className="w-3 h-3 sm:w-4 sm:h-4 mr-1"/> : <CubeTransparentIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            <span className="hidden sm:inline">一鍵</span>隨機
                        </button>
                        <button onClick={handleExpandAllAccordions} className="text-xs text-gray-600 hover:text-black font-medium">全部展開</button>
                        <button onClick={handleCollapseAllAccordions} className="text-xs text-gray-600 hover:text-black font-medium">全部收合</button>
                    </div>
                </div>
                 {randomPromptsError && (<div className="my-2 p-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-700 flex items-start"><ExclamationTriangleIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5"/><span>{randomPromptsError}</span></div>)}
                <div className="space-y-2"> 
                  {relevantCategories.map((category, index) => (
                    <PromptCategoryAccordion
                      key={category.id}
                      category={category}
                      selectedTerms={activePromptTerms}
                      onToggleTerm={(term) => toggleTerm(term, category.id, index * 1000 + (category.terms.findIndex(t=>t.id === term.id)) )}
                      isOpen={accordionStates[category.id] === undefined ? (category.isOpen || false) : accordionStates[category.id]}
                      onToggle={() => handleToggleAccordion(category.id)}
                      onShowAddCustomTermModal={toggleAddCustomTermModal} // New prop
                    />
                  ))}
                </div>
            </div>
          </div>

          <div ref={rightColumnRef} className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PromptBuilder activeTerms={Array.from(activePromptTerms.values()).sort((a,b) => (a.order || 0) - (b.order || 0) )} onUpdateWeight={updateTermWeight} onToggleLock={toggleTermLock} onRemoveTerm={(termId) => setActivePromptTerms(prev => { const m = new Map(prev); m.delete(termId); return m; })} onClearAllTerms={handleClearAllTerms} generatedPromptEn={generatedPromptEn} generatedPromptZh={generatedPromptZh} onPolishPrompt={handlePolishPrompt} isPolishingEn={isPolishingEn} isPolishingZh={isPolishingZh} polishError={polishError} clearPolishError={() => setPolishError(null)} geminiApiKeySet={!!geminiApiKey} />
              <ImageGenerator promptEn={generatedPromptEn} geminiApiKey={geminiApiKey} openAIApiKey={openAIApiKey} onImageGenerated={handleImageGenerated} onViewImage={handleViewImageFromGenerator} currentPromptState={{ selectedStyleId: selectedStyle?.id || null, selectedRoomTypeId: selectedRoomType?.id || null, activeTerms: Array.from(activePromptTerms.entries()) }} />
            </div>
            <ImageHistoryDisplay history={imageHistory} onViewImage={handleOpenImageDetail} onRestoreState={handleRestorePromptState} />
          </div>
        </div>
      </main>
      {showAiSuggestionsModal && (<AISuggestionsModal isOpen={showAiSuggestionsModal} onClose={() => setShowAiSuggestionsModal(false)} suggestions={aiSuggestedTerms} onAddTerm={addAISuggestedTerm} activeTerms={activePromptTerms} onRegenerate={handleGetAISuggestions} isLoadingSuggestions={isLoadingAiSuggestions} />)}
      <ImageDetailModal isOpen={!!selectedImageForModal} onClose={() => { setSelectedImageForModal(null); setSelectedImageIndex(null);}} image={selectedImageForModal} currentIndex={selectedImageIndex} totalImages={imageHistory.length} onNavigate={handleNavigateImageDetail} />
      <SettingsModal isOpen={showSettingsModal} onClose={toggleSettingsModal} />
      <AddStyleModal isOpen={showAddStyleModal} onClose={toggleAddStyleModal} onAddStyle={handleAddCustomStyle} onTranslateName={handleTranslateNameToEnglish} geminiApiKeySet={!!geminiApiKey} />
      <AddCustomTermModal 
        isOpen={showAddCustomTermModal} 
        onClose={() => toggleAddCustomTermModal()} 
        onAddTerm={handleAddCustomTerm}
        onTranslate={handleTranslateInputForModal}
        categoryId={currentCategoryForCustomTerm?.id || null}
        categoryName={currentCategoryForCustomTerm?.name}
        geminiApiKeySet={!!geminiApiKey}
      />
      <div className="lg:hidden fixed bottom-6 right-6 z-50"> <IconButton onClick={scrollToImageGenerator} aria-label="捲動至圖像生成區" title="捲動至圖像生成區" className="bg-black text-white rounded-full p-3 shadow-lg hover:bg-gray-800"> <ChevronDoubleDownIcon className="w-6 h-6" /> </IconButton> </div>
    </div>
  );
};

const App: React.FC = () => (<SettingsProvider><AppContent /></SettingsProvider>);
export default App;
