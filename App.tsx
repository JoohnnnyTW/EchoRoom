
import React, { useState, useCallback, useMemo, useEffect, useRef, useContext } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { Header } from './components/Header';
import { StyleSelector } from './components/StyleSelector';
import { RoomTypeSelector } from './components/RoomTypeSelector';
import { SubjectInput } from './components/SubjectInput';
import { ImageAnalyzer } from './components/ImageAnalyzer';
// PromptCategoryAccordion is now used inside PromptCategoriesModal
import { PromptBuilder } from './components/PromptBuilder';
import { AISuggestionsModal } from './components/AISuggestionsModal';
import { ImageHistoryDisplay } from './components/ImageHistoryDisplay';
import { ImageDetailModal } from './components/ImageDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AddStyleModal } from './components/AddStyleModal';
import { AddRoomTypeModal } from './components/AddRoomTypeModal';
import { AddCustomTermModal, DESIGN_STYLE_QUICK_ADD_CATEGORY_ID, ROOM_TYPE_QUICK_ADD_CATEGORY_ID } from './components/AddCustomTermModal';
import { AddCategoryModal } from './components/AddCategoryModal'; 
import { GenerateStyleDetailsButton } from './components/GenerateStyleDetailsButton';
import { FavoritesPage } from './components/FavoritesPage';
import { MultimodalEditModal } from './components/MultimodalEditModal';
import { ImageFusionStudioModal } from './components/ImageFusionStudioModal'; 
import { LoadingScreen } from './components/LoadingScreen';
import { ConfirmationTutorialPage } from './components/ConfirmationTutorialPage'; 
import { SubjectPhraseSuggestionsModal } from './components/SubjectPhraseSuggestionsModal'; 
import { ImageGenerator } from './components/ImageGenerator'; 
import { AISuggestedCategoryTermsModal } from './components/AISuggestedCategoryTermsModal'; 
import { FloatingCategoriesButton } from './components/FloatingCategoriesButton';
import { FloatingAISuggestionsButton } from './components/FloatingAISuggestionsButton';
import { FloatingScrollToGeneratorButton } from './components/FloatingScrollToGeneratorButton';
import { PromptCategoriesModal } from './components/PromptCategoriesModal'; 
import { DesignStyle, PromptTerm, SelectedPromptTerm, AISuggestedTerm, ImageHistoryEntry, AppGeneratedImage, PromptStateForHistory, ImageEngine, AIStyleDetails, CustomPromptCategorySetting, PromptCategoryDisplay, AnalyzedImageKeyword, AddCustomTermModalInitialData, AddCustomTermModalOnSaveData, UITexts, SelectedPromptTermForChip, ImageGenerationSettings, AISystemPrompts, StoredAppSettings, AISetupProgressCallback, AppSettings, CustomPromptCategorySettings, DynamicDetailSet, AISuggestionItem, SettingsContextType } from './types';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, ExclamationTriangleIcon, ChevronDoubleDownIcon, CubeTransparentIcon, LanguageIcon, CheckCircleIcon, PlusCircleIcon as PlusCircleIconForAdd, TrashIcon, XCircleIcon } from './components/Icons'; 
import { LoadingSpinner } from './components/LoadingSpinner';
import { IconButton } from './components/IconButton';
import { SettingsProvider, SettingsContext, deepMerge, initialAppSettings as contextInitialAppSettings } from './contexts/SettingsContext';
import { DEFAULT_UI_TEXTS } from './constants/uiTexts';
import { DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS } from './constants/customPromptCategorySettings';
import { DEFAULT_AI_SYSTEM_PROMPTS } from './constants/aiPrompts'; 
import { PROMPT_CATEGORIES, ROOM_TYPES as INITIAL_ROOM_TYPES } from './constants/designData';
import { ensureThreeTerms } from './utils/arrayUtils';


const IMAGE_HISTORY_STORAGE_KEY = 'echoRoomImageHistory_v1';

const parseGeminiJsonResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();

  // Remove BOM (Byte Order Mark) if present at the very beginning
  if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.substring(1);
  }

  // Remove markdown fence if present
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
    // Remove BOM again if it was inside the fence
    if (jsonStr.charCodeAt(0) === 0xFEFF) {
      jsonStr = jsonStr.substring(1);
    }
  }

  // Attempt to fix malformations where extraneous words appear
  // Case 1: ... "value" EXTRANEOUS_WORD } ...  => remove word
  // \p{L} matches any kind of letter from any language. Requires 'u' flag.
  jsonStr = jsonStr.replace(/(")\s*(\p{L}+)\s*(\})/gu, '$1$3');
  
  // Case 2: ... "value" EXTRANEOUS_WORD { ... => remove word, insert comma
  jsonStr = jsonStr.replace(/(")\s*(\p{L}+)\s*(\{)/gu, '$1,$3');


  try {
    return JSON.parse(jsonStr) as T;
  } catch (e: any) {
    console.error("未能解析JSON回應:", e.message);
    console.error("原始文本 (前500字):", responseText.substring(0, 500));
    console.error("嘗試解析的文本 (清理後，前500字):", jsonStr.substring(0, 500));
    
    let errorContext = "";
    const positionMatch = e.message.match(/position\s+(\d+)/);
    if (positionMatch && positionMatch[1]) {
      const errorPos = parseInt(positionMatch[1], 10);
      const contextChars = 150; 
      const start = Math.max(0, errorPos - contextChars);
      const end = Math.min(jsonStr.length, errorPos + contextChars);
      errorContext = `...${jsonStr.substring(start, errorPos)}[ERROR_AT_POS_${errorPos}]${jsonStr.substring(errorPos, end)}...`;
      console.error(`錯誤發生位置附近文本 (清理後): ${errorContext}`);
    }
    
    let alertMessage = `AI 回應解析失敗。請檢查控制台以獲取詳細資訊。\n錯誤: ${e.message}`;
    if(errorContext) {
      alertMessage += `\n\n部分相關文本 (清理後):\n${errorContext.substring(0, 300).replace(`[ERROR_AT_POS_${parseInt(positionMatch?.[1],10)}]`, "<-- 此處附近") }...`;
    } else {
      alertMessage += `\n\n部分原始文本:\n${responseText.substring(0,200)}...`;
    }
    alert(alertMessage);
    return null;
  }
};

const fillPromptTemplate = (template: string, values: Record<string, string>): string => {
  let filledTemplate = template;
  for (const placeholderKey in values) {
    if (Object.prototype.hasOwnProperty.call(values, placeholderKey)) {
        const regex = new RegExp(`{{${placeholderKey}}}`, 'g');
        filledTemplate = filledTemplate.replace(regex, values[placeholderKey]);
    }
  }
  return filledTemplate;
};

interface AddCustomTermModalConfig {
  isOpen: boolean;
  initialData?: AddCustomTermModalInitialData;
  showCategorySelector: boolean;
  modalTitleKey: keyof Pick<UITexts, 'addCustomTermModalTitle' | 'addCustomTermModalQuickAddTitle' | 'saveTermToCategoryModalTitle'>;
}

const AppContent = () => {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) throw new Error("AppContent must be used within a SettingsProvider");
  const {
    settings,
    addTermToCategory: contextAddTermToCategory,
    addMultipleTermsToCategory: contextAddMultipleTermsToCategory, 
    updateTermDefinition: contextUpdateTermDefinition,
    deleteTermFromCategory: contextDeleteTermFromCategory, 
    addDesignStyle: contextAddDesignStyle,
    updateDesignStyle: contextUpdateDesignStyle,
    deleteDesignStyle: contextDeleteDesignStyle, 
    deleteTermFromStyleDetail: contextDeleteTermFromStyleDetail,
    addRoomType: contextAddRoomType,
    updateSettings, 
    updateRoomTypes: contextUpdateRoomTypes,
    deleteRoomType: contextDeleteRoomType,
    addPromptCategory: contextAddPromptCategory, 
    deletePromptCategory: contextDeletePromptCategory, 
  } = settingsContext;
  const { aiSystemPrompts, uiTexts, customPromptCategorySettings, designStyles, roomTypes, appContextThemeEn, appContextThemeZh } = settings;

  const processedPromptCategories: PromptCategoryDisplay[] = useMemo(() => {
    return Object.values(customPromptCategorySettings).map(categorySetting => ({
      id: categorySetting.id,
      nameEn: categorySetting.nameEn,
      nameZh: categorySetting.nameZh,
      terms: categorySetting.terms.map(term => ({...term, categoryId: categorySetting.id})), 
      isOpen: categorySetting.isOpenDefault,
    }));
  }, [customPromptCategorySettings]);


  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | null>(designStyles[0] || null);
  const [selectedRoomType, setSelectedRoomType] = useState<PromptTerm | null>(roomTypes[0] || null);
  const [isRoomTypeSelectorEnabled, setIsRoomTypeSelectorEnabled] = useState<boolean>(false);
  const [subjectInputEn, setSubjectInputEn] = useState<string>('');
  const [subjectInputZh, setSubjectInputZh] = useState<string>('');
  const [aiSuggestionSeedText, setAiSuggestionSeedText] = useState<string>(''); 
  const [isSubjectInputEnabled, setIsSubjectInputEnabled] = useState<boolean>(false);

  const [isImageAnalyzerEnabled, setIsImageAnalyzerEnabled] = useState<boolean>(false);
  const [lastAnalyzedKeywords, setLastAnalyzedKeywords] = useState<AnalyzedImageKeyword[] | null>(null); 
  const [analyzedImageForSubjectContext, setAnalyzedImageForSubjectContext] = useState<string | null>(null);


  const [isPromptCategoriesEnabled, setIsPromptCategoriesEnabled] = useState<boolean>(true); 
  const [activePromptTerms, setActivePromptTerms] = useState<Map<string, SelectedPromptTerm>>(new Map());
  
  
  const [autoGeneratedPromptEn, setAutoGeneratedPromptEn] = useState<string>('');
  const [autoGeneratedPromptZh, setAutoGeneratedPromptZh] = useState<string>('');

  
  const [manualPromptEn, setManualPromptEn] = useState<string>('');
  const [isPromptEnManual, setIsPromptEnManual] = useState<boolean>(false);
  const [manualPromptZh, setManualPromptZh] = useState<string>('');
  const [isPromptZhManual, setIsPromptZhManual] = useState<boolean>(false);


  const [showStyleDetails, setShowStyleDetails] = useState<boolean>(false);
  const [isPromptBuilderVisible, setIsPromptBuilderVisible] = useState<boolean>(true);

  const [showPromptCategoriesModal, setShowPromptCategoriesModal] = useState<boolean>(false); // Added for new modal


  const [aiSuggestedTerms, setAiSuggestedTerms] = useState<AISuggestedTerm[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState<boolean>(false);
  const [showAiSuggestionsModal, setShowAiSuggestionsModal] = useState<boolean>(false);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);
  const [thinkingProcessMessages, setThinkingProcessMessages] = useState<string[]>([]);
  const [currentThinkingMessageIndex, setCurrentThinkingMessageIndex] = useState<number>(0);
  const thinkingIntervalRef = useRef<number | null>(null);

  
  const [showSubjectPhraseSuggestionsModal, setShowSubjectPhraseSuggestionsModal] = useState<boolean>(false);
  const [subjectPhraseSuggestions, setSubjectPhraseSuggestions] = useState<AISuggestionItem[]>([]);
  const [isLoadingSubjectPhraseSuggestions, setIsLoadingSubjectPhraseSuggestions] = useState<boolean>(false);
  const [subjectPhraseSuggestionError, setSubjectPhraseSuggestionError] = useState<string | null>(null);
  const [subjectPhraseThinkingMessages, setSubjectPhraseThinkingMessages] = useState<string[]>([]);
  const [currentSubjectPhraseThinkingIndex, setCurrentSubjectPhraseThinkingIndex] = useState<number>(0);
  const subjectPhraseThinkingIntervalRef = useRef<number | null>(null);

  
  const [isLoadingAISuggestedStyles, setIsLoadingAISuggestedStyles] = useState<boolean>(false);
  const [aiSuggestedStylesError, setAISuggestedStylesError] = useState<string | null>(null);
  const [aiStyleSetThinkingMessages, setAIStyleSetThinkingMessages] = useState<string[]>([]);
  const [currentAIStyleSetThinkingIndex, setCurrentAIStyleSetThinkingIndex] = useState<number>(0);
  const aiStyleSetThinkingIntervalRef = useRef<number | null>(null);

  
  const [isLoadingAIRoomTypeSet, setIsLoadingAIRoomTypeSet] = useState<boolean>(false);
  const [aiRoomTypeSetError, setAIRoomTypeSetError] = useState<string | null>(null);
  const [aiRoomTypeSetThinkingMessages, setAIRoomTypeSetThinkingMessages] = useState<string[]>([]);
  const [currentAIRoomTypeSetThinkingIndex, setCurrentAIRoomTypeSetThinkingIndex] = useState<number>(0);
  const aiRoomTypeSetThinkingIntervalRef = useRef<number | null>(null);

  const [showAISuggestedCategoryTermsModal, setShowAISuggestedCategoryTermsModal] = useState<boolean>(false);
  const [aiSuggestedCategoryTerms, setAISuggestedCategoryTerms] = useState<AISuggestedTerm[]>([]);
  const [isLoadingAISuggestedCategoryTerms, setIsLoadingAISuggestedCategoryTerms] = useState<boolean>(false);
  const [aiSuggestedCategoryTermsError, setAISuggestedCategoryTermsError] = useState<string | null>(null);
  const [aiSuggestedCategoryTermsThinkingMessages, setAISuggestedCategoryTermsThinkingMessages] = useState<string[]>([]);
  const [currentAISuggestedCategoryTermsThinkingIndex, setCurrentAISuggestedCategoryTermsThinkingIndex] = useState<number>(0);
  const aiSuggestedCategoryTermsIntervalRef = useRef<number | null>(null);
  const [targetCategoryForAISuggestions, setTargetCategoryForAISuggestions] = useState<PromptCategoryDisplay | null>(null);


  const [isPolishingEn, setIsPolishingEn] = useState<boolean>(false);
  const [isPolishingZh, setIsPolishingZh] = useState<boolean>(false);
  const [polishError, setPolishError] = useState<string | null>(null);

  const [imageHistory, setImageHistory] = useState<ImageHistoryEntry[]>(() => {
    try {
      const storedHistoryJson = localStorage.getItem(IMAGE_HISTORY_STORAGE_KEY);
      if (storedHistoryJson) {
        const storedHistory = JSON.parse(storedHistoryJson) as ImageHistoryEntry[];
        
        if (Array.isArray(storedHistory)) {
          const validHistory = storedHistory.filter(entry =>
            entry && typeof entry.id === 'string' && typeof entry.src === 'string' &&
            typeof entry.prompt === 'string' && typeof entry.timestamp === 'number' &&
            entry.promptState && typeof entry.promptState.selectedStyleId !== 'undefined' 
          ).map(entry => ({ 
            ...entry,
            isFavorite: !!entry.isFavorite, 
            editBaseImageId: entry.editBaseImageId, 
            editInstruction: entry.editInstruction, 
          }));
          return validHistory.slice(0, 20); 
        }
      }
    } catch (error) {
      console.error("Error loading image history from localStorage:", error);
    }
    return [];
  });

  const [selectedImageForModal, setSelectedImageForModal] = useState<ImageHistoryEntry | null>(null);
  const [modalImageSourceList, setModalImageSourceList] = useState<ImageHistoryEntry[]>([]);
  const [selectedImageIndexInSource, setSelectedImageIndexInSource] = useState<number | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAddStyleModal, setShowAddStyleModal] = useState<boolean>(false);
  const [showAddRoomTypeModal, setShowAddRoomTypeModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false); 

  const [addCustomTermModalConfig, setAddCustomTermModalConfig] = useState<AddCustomTermModalConfig>({
    isOpen: false,
    showCategorySelector: false,
    modalTitleKey: 'addCustomTermModalTitle',
  });


  const [isLoadingStyleDetailsAI, setIsLoadingStyleDetailsAI] = useState<boolean>(false);
  const [styleDetailsAIError, setStyleDetailsAIError] = useState<string | null>(null);
  const [styleDetailsThinkingMessages, setStyleDetailsThinkingMessages] = useState<string[]>([]);
  const [currentStyleDetailsThinkingIndex, setCurrentStyleDetailsThinkingIndex] = useState<number>(0);
  const styleDetailsThinkingIntervalRef = useRef<number | null>(null);


  const [isLoadingRandomPrompts, setIsLoadingRandomPrompts] = useState<boolean>(false);
  const [randomPromptsError, setRandomPromptsError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<'main' | 'favorites' | 'multimodalEdit' | 'imageFusion'>('main'); 

  const [showMultimodalEditModal, setShowMultimodalEditModal] = useState<boolean>(false);
  const [multimodalEditBaseImage, setMultimodalEditBaseImage] = useState<ImageHistoryEntry | null>(null);
  const [multimodalEditInitialKeywords, setMultimodalEditInitialKeywords] = useState<AnalyzedImageKeyword[] | null>(null);


  const [showImageFusionStudioModal, setShowImageFusionStudioModal] = useState<boolean>(false);
  const [imageFusionStudioBaseImage, setImageFusionStudioBaseImage] = useState<ImageHistoryEntry | null>(null);


  const geminiApiKey = process.env.API_KEY;
  const bflAIApiKey = process.env.BFL_API_KEY;

  const ai = useMemo(() => geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null, [geminiApiKey]);
  const imageGeneratorColumnRef = useRef<HTMLDivElement>(null); 

  const togglePromptCategoriesModal = () => setShowPromptCategoriesModal(prev => !prev); 


  useEffect(() => {
    const currentSelectedStyleId = selectedStyle?.id;
    if (currentSelectedStyleId) {
        const styleInNewSettings = designStyles.find(s => s.id === currentSelectedStyleId);
        if (styleInNewSettings) {
            if (JSON.stringify(selectedStyle) !== JSON.stringify(styleInNewSettings)) {
                setSelectedStyle(styleInNewSettings);
            }
        } else {
            setSelectedStyle(designStyles[0] || null);
        }
    } else if (designStyles.length > 0) {
        setSelectedStyle(designStyles[0]);
    } else {
        setSelectedStyle(null);
    }
  }, [designStyles, selectedStyle]);

  useEffect(() => {
    const currentSelectedRoomTypeId = selectedRoomType?.id;
    if (currentSelectedRoomTypeId) {
        const roomTypeInNewSettings = roomTypes.find(rt => rt.id === currentSelectedRoomTypeId);
        if (roomTypeInNewSettings) {
             if (JSON.stringify(selectedRoomType) !== JSON.stringify(roomTypeInNewSettings)) {
                setSelectedRoomType(roomTypeInNewSettings);
            }
        } else {
            setSelectedRoomType(roomTypes[0] || null);
        }
    } else if (roomTypes.length > 0) {
        setSelectedRoomType(roomTypes[0]);
    } else {
        setSelectedRoomType(null);
    }
    
  }, [roomTypes, selectedRoomType]);


  useEffect(() => {
    try {
      // Defensively ensure an array is always stringified for localStorage
      const historyToStore = Array.isArray(imageHistory) ? imageHistory : [];
      localStorage.setItem(IMAGE_HISTORY_STORAGE_KEY, JSON.stringify(historyToStore));
    } catch (error) {
      console.error("Error saving image history to localStorage:", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Inform user or try to prune older history if quota is exceeded.
        // For now, just logging.
      }
    }
  }, [imageHistory]);


  const relevantCategories: PromptCategoryDisplay[] = useMemo(() => {
    const allCategories = processedPromptCategories;
    if (selectedStyle?.relatedCategories && selectedStyle.relatedCategories.length > 0) {
      return allCategories.filter(cat => selectedStyle.relatedCategories.includes(cat.id));
    }
    return allCategories;
  }, [selectedStyle, processedPromptCategories]);

  const accordionStates = useMemo(() => {
    const initialState: Record<string, boolean> = {};
    relevantCategories.forEach(cat => { initialState[cat.id] = cat.isOpen !== undefined ? cat.isOpen : false; });
    return initialState;
  }, [relevantCategories]); 

  const [manualAccordionStates, setManualAccordionStates] = useState<Record<string, boolean>>({});

  useEffect(() => { 
    setManualAccordionStates(prevStates => {
        const newStates: Record<string, boolean> = {};
        relevantCategories.forEach(cat => {
            newStates[cat.id] = prevStates[cat.id] !== undefined ? prevStates[cat.id] : (cat.isOpen || false);
        });
        return newStates;
    });
  }, [relevantCategories]);

  const getAccordionOpenState = useCallback((categoryId: string) => {
    return manualAccordionStates[categoryId] !== undefined ? manualAccordionStates[categoryId] : (accordionStates[categoryId] || false);
  }, [manualAccordionStates, accordionStates]);

  const handleToggleAccordion = (categoryId: string) => {
    setManualAccordionStates(prev => ({ ...prev, [categoryId]: !getAccordionOpenState(categoryId) }));
  };
  
  const handleExpandAllAccordions = () => {
      const allOpen: Record<string, boolean> = {};
      relevantCategories.forEach(cat => { allOpen[cat.id] = true; });
      setManualAccordionStates(prev => ({ ...prev, ...allOpen }));
  };
  const handleCollapseAllAccordions = () => {
      const allClosed: Record<string, boolean> = {};
      relevantCategories.forEach(cat => { allClosed[cat.id] = false; });
      setManualAccordionStates(prev => ({ ...prev, ...allClosed }));
  };


  const getNextOrderBasedOnMap = useCallback((termsMap: Map<string, SelectedPromptTerm>) => {
    if (termsMap.size === 0) return 1;
    return Math.max(0, ...Array.from(termsMap.values()).map(t => t.order || 0)) + 1;
  }, []);

  const getNextOrder = useCallback(() => getNextOrderBasedOnMap(activePromptTerms), [activePromptTerms, getNextOrderBasedOnMap]);


  const updatePrompts = useCallback(() => {
    const termsArray = Array.from(activePromptTerms.values()).sort((a,b) => (a.order || 0) - (b.order || 0) );

    const enParts: string[] = [];
    const zhParts: string[] = [];

    if (settings.appContextThemeEn && settings.appContextThemeEn.trim() !== '') {
        enParts.push(settings.appContextThemeEn.trim());
    }
    if (settings.appContextThemeZh && settings.appContextThemeZh.trim() !== '') {
        zhParts.push(settings.appContextThemeZh.trim());
    }

    if (selectedStyle) enParts.push(selectedStyle.nameEn);
    if (isSubjectInputEnabled && subjectInputEn.trim()) enParts.push(subjectInputEn.trim());
    if (selectedRoomType && isRoomTypeSelectorEnabled) enParts.push(selectedRoomType.termEn);

    if (selectedStyle) zhParts.push(selectedStyle.nameZh);
    if (isSubjectInputEnabled && subjectInputZh.trim()) zhParts.push(subjectInputZh.trim());
    if (selectedRoomType && isRoomTypeSelectorEnabled) zhParts.push(selectedRoomType.termZh);

    termsArray.forEach(term => {
      const termEnString = term.weight === 1 ? term.termEn : `(${term.termEn}:${term.weight.toFixed(1)})`;
      const termZhString = term.weight === 1 ? term.termZh : `(${term.termZh}:${term.weight.toFixed(1)})`;

      if (term.categoryId === 'ai_analyzed_image_terms' || isPromptCategoriesEnabled || term.categoryId === 'style_detail_keyword') {
        enParts.push(termEnString);
        zhParts.push(termZhString);
      }
    });

    setAutoGeneratedPromptEn(enParts.join(', ')); 
    setAutoGeneratedPromptZh(zhParts.join(', ')); 
  }, [activePromptTerms, selectedStyle, selectedRoomType, subjectInputEn, subjectInputZh, isSubjectInputEnabled, isPromptCategoriesEnabled, isRoomTypeSelectorEnabled, settings.appContextThemeEn, settings.appContextThemeZh]);

  useEffect(() => { 
    updatePrompts();
    
    if (!isPromptEnManual) setManualPromptEn(autoGeneratedPromptEn);
    if (!isPromptZhManual) setManualPromptZh(autoGeneratedPromptZh);
  }, [activePromptTerms, selectedStyle, selectedRoomType, subjectInputEn, subjectInputZh, isSubjectInputEnabled, isPromptCategoriesEnabled, isRoomTypeSelectorEnabled, updatePrompts, isPromptEnManual, isPromptZhManual, autoGeneratedPromptEn, autoGeneratedPromptZh, settings.appContextThemeEn, settings.appContextThemeZh]);


  const handleStyleSelect = useCallback((style: DesignStyle) => setSelectedStyle(style), []);
  const handleRoomTypeSelect = useCallback((roomType: PromptTerm | null) => setSelectedRoomType(roomType), []);

  const toggleTerm = useCallback((term: PromptTerm, categoryId: string, order?: number) => {
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      if (newTerms.has(term.id)) {
        newTerms.delete(term.id);
      } else {
        const termOrder = order !== undefined ? order : getNextOrderBasedOnMap(newTerms);
        newTerms.set(term.id, { ...term, weight: 1.0, locked: false, categoryId, order: termOrder });
      }
      return newTerms;
    });
    
    setIsPromptEnManual(false);
    setIsPromptZhManual(false);
  }, [getNextOrderBasedOnMap]);
  
  const handleRemoveTermFromBuilder = useCallback((termId: string) => {
    const termToRemove = Array.from(activePromptTerms.values()).find(t => t.id === termId);
    if (termToRemove) {
        toggleTerm(termToRemove, termToRemove.categoryId || 'unknown_category_for_removal');
    }
  }, [activePromptTerms, toggleTerm]);


  const updateTermWeight = useCallback((termId: string, delta: number) => {
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      const term = newTerms.get(termId);
      if (term) {
        const newWeight = Math.max(0.1, Math.min(2.0, parseFloat((term.weight + delta).toFixed(1))));
        newTerms.set(term.id, { ...term, weight: newWeight });
      }
      return newTerms;
    });
    setIsPromptEnManual(false); setIsPromptZhManual(false);
  }, []);

  const toggleTermLock = useCallback((termId: string) => {
    setActivePromptTerms(prevTerms => {
      const newTerms = new Map(prevTerms);
      const term = newTerms.get(termId);
      if (term) {
        newTerms.set(termId, { ...term, locked: !term.locked });
      }
      return newTerms;
    });
    
  }, []);

  const handleClearAllTerms = useCallback(() => {
    setActivePromptTerms(new Map());
    setIsPromptEnManual(false); setIsPromptZhManual(false);
  }, []);

  const handleAddKeywordFromDetails = useCallback((styleId: string, setIndex: number, termEn: string, termZh: string) => {
    const termId = `style_detail_keyword:${styleId}:${setIndex}:${termEn.toLowerCase().replace(/\s+/g, '_')}`; 
    const newTerm: PromptTerm = { id: termId, termEn, termZh, categoryId: 'style_detail_keyword' };
    toggleTerm(newTerm, 'style_detail_keyword');
  }, [toggleTerm]);


  const handleGetAISuggestions = useCallback(async () => {
    
    if (!ai || !selectedStyle) {
      setAiSuggestionError("請先選擇風格。");
      return;
    }

    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    setIsLoadingAiSuggestions(true);
    setAiSuggestionError(null);
    setAiSuggestedTerms([]);

    const currentTermsString = Array.from(activePromptTerms.values()).map(t => `${t.termEn} (${t.termZh})`).join(', ') || '無';
    const roomTypeEnForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termEn : "Not specified";
    const roomTypeZhForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termZh : "未指定";
    
    const steps = [
      `分析風格: ${selectedStyle.nameEn} (${selectedStyle.nameZh})`,
      `考量空間: ${roomTypeEnForPrompt} (${roomTypeZhForPrompt})`,
      `檢視現有詞語: ${currentTermsString.length > 40 ? currentTermsString.substring(0, 37) + "..." : currentTermsString}`,
      "腦力激盪互補關鍵字...",
      "探索獨特材質与裝飾元素...",
      "構思氛圍與光影細節...",
      "篩選相關性並避免冗餘...",
      "準備建議格式...",
      "即將完成！正在整理清單...",
    ];
    setThinkingProcessMessages(steps);
    setCurrentThinkingMessageIndex(0);

    thinkingIntervalRef.current = window.setInterval(() => {
      setCurrentThinkingMessageIndex(prevIndex => {
        if (prevIndex < steps.length - 1) {
          return prevIndex + 1;
        }
        if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current); 
        thinkingIntervalRef.current = null;
        return prevIndex;
      });
    }, 1200); 

    if (!showAiSuggestionsModal) setShowAiSuggestionsModal(true);

    const promptTemplate = aiSystemPrompts.aiTermSuggestions.template;
    const prompt = fillPromptTemplate(promptTemplate, {
        styleNameEn: selectedStyle.nameEn,
        styleNameZh: selectedStyle.nameZh,
        roomTypeEn: roomTypeEnForPrompt,
        roomTypeZh: roomTypeZhForPrompt,
        currentTerms: currentTermsString,
        subjectSuggestionSeedText: aiSuggestionSeedText.trim() || "使用者未提供主體建議參考文字。AI應基於風格、空間等其他脈絡提供通用提示詞建議。",
        appContextThemeEn: appContextThemeEn || "Interior Design",
        appContextThemeZh: appContextThemeZh || "室內設計",
    });

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: "application/json" } });
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current); 
      thinkingIntervalRef.current = null;

      const parsedSuggestions = parseGeminiJsonResponse<AISuggestedTerm[]>(response.text);
      if (parsedSuggestions && Array.isArray(parsedSuggestions)) {
        const validSuggestions = parsedSuggestions.filter(term => term && typeof term.id === 'string' && typeof term.termEn === 'string' && typeof term.termZh === 'string' && term.id && term.termEn && term.termZh);
        if (validSuggestions.length > 0) {
            setAiSuggestedTerms(validSuggestions);
        } else {
            setAiSuggestionError("AI建議已收到，但部分項目缺少必要欄位或為空。");
            console.error("有問題的建議數據:", parsedSuggestions, "原始文本:", response.text);
            setAiSuggestedTerms([]);
        }
      } else {
        setAiSuggestionError("AI返回了意外的格式。");
        console.error("解析建議錯誤或非陣列:", parsedSuggestions, "原始文本:", response.text);
        setAiSuggestedTerms([]);
      }
    } catch (e: any) {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
      console.error("獲取AI建議時出錯:", e);
      setAiSuggestionError(`獲取AI建議失敗：${e.message || '未知錯誤'}`);
      setAiSuggestedTerms([]);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, [ai, selectedStyle, selectedRoomType, isRoomTypeSelectorEnabled, activePromptTerms, showAiSuggestionsModal, aiSystemPrompts.aiTermSuggestions, aiSuggestionSeedText, appContextThemeEn, appContextThemeZh]); 


  
  const handleFetchSubjectPhraseSuggestions = useCallback(async () => {
    if (!ai || !selectedStyle) {
      setSubjectPhraseSuggestionError("請先選擇風格。");
      return;
    }
    

    if (subjectPhraseThinkingIntervalRef.current) clearInterval(subjectPhraseThinkingIntervalRef.current);
    setIsLoadingSubjectPhraseSuggestions(true);
    setSubjectPhraseSuggestionError(null);
    setSubjectPhraseSuggestions([]);

    const roomTypeEnForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termEn : "Not specified";
    const roomTypeZhForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termZh : "未指定";
    const analyzedKeywordsString = lastAnalyzedKeywords ? lastAnalyzedKeywords.map(kw => `${kw.termEn} / ${kw.termZh}`).join(', ') : "無";
    const ocrTextFromImage = analyzedImageForSubjectContext ? "待實現OCR" : "無"; 

    const steps = [
      `分析風格: ${selectedStyle.nameEn} (${selectedStyle.nameZh})`,
      `考量空間: ${roomTypeEnForPrompt} (${roomTypeZhForPrompt})`,
      `根據參考文字: "${aiSuggestionSeedText.trim() ? aiSuggestionSeedText.substring(0, 20) + "..." : "無 (通用建議)"}"`,
      "生成主體內容描述建議...",
      "即將完成！"
    ];
    setSubjectPhraseThinkingMessages(steps);
    setCurrentSubjectPhraseThinkingIndex(0);

    subjectPhraseThinkingIntervalRef.current = window.setInterval(() => {
      setCurrentSubjectPhraseThinkingIndex(prevIndex => {
        if (prevIndex < steps.length - 1) return prevIndex + 1;
        if (subjectPhraseThinkingIntervalRef.current) clearInterval(subjectPhraseThinkingIntervalRef.current);
        subjectPhraseThinkingIntervalRef.current = null;
        return prevIndex;
      });
    }, 1200);

    if (!showSubjectPhraseSuggestionsModal) setShowSubjectPhraseSuggestionsModal(true);

    const promptTemplate = aiSystemPrompts.subjectSuggestion.template;
    const seedTextForPrompt = aiSuggestionSeedText.trim() || "使用者未提供主體建議參考文字。AI應基於風格、空間等其他脈絡提供通用提示詞建議。";

    const prompt = fillPromptTemplate(promptTemplate, {
      subjectSuggestionSeedText: seedTextForPrompt,
      appContextThemeEn: appContextThemeEn || "Interior Design",
      appContextThemeZh: appContextThemeZh || "室內設計",
      selectedStyleNameEn: selectedStyle.nameEn,
      selectedStyleNameZh: selectedStyle.nameZh,
      selectedRoomTypeNameEn: roomTypeEnForPrompt,
      selectedRoomTypeNameZh: roomTypeZhForPrompt,
      analyzedImageKeywordsString: analyzedKeywordsString,
      ocrTextFromImage: ocrTextFromImage,
    });

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (subjectPhraseThinkingIntervalRef.current) clearInterval(subjectPhraseThinkingIntervalRef.current);
      subjectPhraseThinkingIntervalRef.current = null;

      const parsed = parseGeminiJsonResponse<AISuggestionItem[]>(response.text);
      if (parsed && Array.isArray(parsed) && parsed.every(item => typeof item.suggestionEn === 'string' && typeof item.suggestionZh === 'string')) {
        setSubjectPhraseSuggestions(parsed);
      } else {
        setSubjectPhraseSuggestionError("AI 未能提供主體內容建議，或返回了意外的格式。");
        console.error("Failed to parse subject phrase suggestions:", response.text, parsed);
      }
    } catch (e: any) {
      if (subjectPhraseThinkingIntervalRef.current) clearInterval(subjectPhraseThinkingIntervalRef.current);
      subjectPhraseThinkingIntervalRef.current = null;
      console.error("Error fetching subject phrase suggestions:", e);
      setSubjectPhraseSuggestionError(`獲取主體內容建議失敗：${e.message || '未知錯誤'}`);
    } finally {
      setIsLoadingSubjectPhraseSuggestions(false);
    }
  }, [
    ai, selectedStyle, selectedRoomType, isRoomTypeSelectorEnabled, 
    aiSuggestionSeedText, appContextThemeEn, appContextThemeZh, lastAnalyzedKeywords, analyzedImageForSubjectContext,
    aiSystemPrompts.subjectSuggestion, showSubjectPhraseSuggestionsModal
  ]);

  const handleApplySubjectPhraseSuggestion = useCallback((suggestion: AISuggestionItem) => {
    setSubjectInputEn(suggestion.suggestionEn);
    setSubjectInputZh(suggestion.suggestionZh);
    setShowSubjectPhraseSuggestionsModal(false);
  }, [setSubjectInputEn, setSubjectInputZh]);

  const handleFetchAISuggestedCategoryTerms = useCallback(async (
    categoryInfo: { id: string, nameEn: string, nameZh: string },
    currentTermEnSeed?: string, 
    currentTermZhSeed?: string  
  ) => {
    if (!ai || !selectedStyle) {
      setAISuggestedCategoryTermsError("請先選擇風格以獲取分類詞語建議。");
      return;
    }
    if (!categoryInfo || !categoryInfo.id) {
      setAISuggestedCategoryTermsError("目標分類資訊不完整。");
      return;
    }

    setTargetCategoryForAISuggestions(categoryInfo as PromptCategoryDisplay); 
    if (aiSuggestedCategoryTermsIntervalRef.current) clearInterval(aiSuggestedCategoryTermsIntervalRef.current);
    setIsLoadingAISuggestedCategoryTerms(true);
    setAISuggestedCategoryTermsError(null);
    setAISuggestedCategoryTerms([]);

    const existingTermsInCategory = customPromptCategorySettings[categoryInfo.id]?.terms || [];
    const existingTermsJSON = JSON.stringify(existingTermsInCategory.map(t => ({id: t.id, termEn: t.termEn, termZh: t.termZh})));
    
    const steps = [
      `分析分類: ${categoryInfo.nameEn} / ${categoryInfo.nameZh}`,
      `考量應用主題: ${appContextThemeZh || appContextThemeEn || "通用"}`,
      `參考風格: ${selectedStyle.nameEn} (${selectedStyle.nameZh})`,
      currentTermEnSeed || currentTermZhSeed ? `參考當前輸入: "${(currentTermEnSeed || currentTermZhSeed || "").substring(0,15)}..."` : "未提供當前輸入參考",
      `生成「${categoryInfo.nameZh}」的AI建議詞語...`,
      "即將完成！"
    ];
    setAISuggestedCategoryTermsThinkingMessages(steps);
    setCurrentAISuggestedCategoryTermsThinkingIndex(0);

    aiSuggestedCategoryTermsIntervalRef.current = window.setInterval(() => {
      setCurrentAISuggestedCategoryTermsThinkingIndex(prev => {
        if (prev < steps.length - 1) return prev + 1;
        if (aiSuggestedCategoryTermsIntervalRef.current) clearInterval(aiSuggestedCategoryTermsIntervalRef.current);
        return prev;
      });
    }, 1200);

    if (!showAISuggestedCategoryTermsModal) setShowAISuggestedCategoryTermsModal(true);

    const promptTemplate = aiSystemPrompts.aiCategoryTermSuggestions.template;
    const prompt = fillPromptTemplate(promptTemplate, {
      categoryNameEn: categoryInfo.nameEn,
      categoryNameZh: categoryInfo.nameZh,
      appContextThemeEn: appContextThemeEn || "Interior Design",
      appContextThemeZh: appContextThemeZh || "室內設計",
      selectedStyleNameEn: selectedStyle.nameEn,
      selectedStyleBasePromptEn: selectedStyle.basePromptEn,
      selectedStyleNameZh: selectedStyle.nameZh,
      selectedStyleBasePromptZh: selectedStyle.basePromptZh,
      existingTermsJSON: existingTermsJSON,
      categoryId: categoryInfo.id,
    });
    
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      if (aiSuggestedCategoryTermsIntervalRef.current) clearInterval(aiSuggestedCategoryTermsIntervalRef.current);

      const parsedResult = parseGeminiJsonResponse<AISuggestedTerm[]>(response.text);
      if (parsedResult && Array.isArray(parsedResult)) {
        const validSuggestions = parsedResult.filter(term => 
            term && typeof term.id === 'string' && term.id.trim() !== '' &&
            typeof term.termEn === 'string' && term.termEn.trim() !== '' &&
            typeof term.termZh === 'string' && term.termZh.trim() !== '' &&
            term.categoryId === categoryInfo.id && term.isCustom === true
        );
        if (validSuggestions.length > 0) {
          setAISuggestedCategoryTerms(validSuggestions);
        } else {
          setAISuggestedCategoryTermsError("AI建議已收到，但部分項目缺少必要欄位、為空、或欄位值不符預期 (例如 isCustom 不為 true 或 categoryId 不符)。");
          console.error("AI Category Terms: Invalid data format from AI.", parsedResult, "Original text:", response.text);
        }
      } else {
        setAISuggestedCategoryTermsError("AI返回的詞語建議格式不正確或為空。");
        console.error("AI Category Terms: Failed to parse JSON or not an array.", response.text, parsedResult);
      }
    } catch (e: any) {
      if (aiSuggestedCategoryTermsIntervalRef.current) clearInterval(aiSuggestedCategoryTermsIntervalRef.current);
      console.error("Error fetching AI category term suggestions:", e);
      setAISuggestedCategoryTermsError(`獲取分類詞語建議失敗: ${e.message || '未知錯誤'}`);
    } finally {
      setIsLoadingAISuggestedCategoryTerms(false);
    }
  }, [
    ai, selectedStyle, appContextThemeEn, appContextThemeZh, customPromptCategorySettings, 
    aiSystemPrompts.aiCategoryTermSuggestions, showAISuggestedCategoryTermsModal
  ]);

  const handleAddMultipleTermsToCategoryFromModal = useCallback((terms: PromptTerm[], categoryId: string) => {
    if (!settingsContext) return;
    contextAddMultipleTermsToCategory(categoryId, terms);
    setShowAISuggestedCategoryTermsModal(false);
  }, [settingsContext, contextAddMultipleTermsToCategory]);


  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
      if (styleDetailsThinkingIntervalRef.current) {
        clearInterval(styleDetailsThinkingIntervalRef.current);
        styleDetailsThinkingIntervalRef.current = null;
      }
      if (subjectPhraseThinkingIntervalRef.current) { 
        clearInterval(subjectPhraseThinkingIntervalRef.current);
        subjectPhraseThinkingIntervalRef.current = null;
      }
      if (aiStyleSetThinkingIntervalRef.current) { 
        clearInterval(aiStyleSetThinkingIntervalRef.current);
        aiStyleSetThinkingIntervalRef.current = null;
      }
      if (aiRoomTypeSetThinkingIntervalRef.current) { 
        clearInterval(aiRoomTypeSetThinkingIntervalRef.current);
        aiRoomTypeSetThinkingIntervalRef.current = null;
      }
      if (aiSuggestedCategoryTermsIntervalRef.current) { 
        clearInterval(aiSuggestedCategoryTermsIntervalRef.current);
        aiSuggestedCategoryTermsIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showAiSuggestionsModal && thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
      setThinkingProcessMessages([]);
      setCurrentThinkingMessageIndex(0);
    }
  }, [showAiSuggestionsModal]);

   useEffect(() => { 
    if (!showSubjectPhraseSuggestionsModal && subjectPhraseThinkingIntervalRef.current) {
      clearInterval(subjectPhraseThinkingIntervalRef.current);
      subjectPhraseThinkingIntervalRef.current = null;
      setSubjectPhraseThinkingMessages([]);
      setCurrentSubjectPhraseThinkingIndex(0);
    }
  }, [showSubjectPhraseSuggestionsModal]);

  useEffect(() => {
    if (!showStyleDetails && styleDetailsThinkingIntervalRef.current) {
        clearInterval(styleDetailsThinkingIntervalRef.current);
        styleDetailsThinkingIntervalRef.current = null;
        setStyleDetailsThinkingMessages([]);
        setCurrentStyleDetailsThinkingIndex(0);
    }
  }, [showStyleDetails]);
  
  useEffect(() => { 
    if (!showAISuggestedCategoryTermsModal && aiSuggestedCategoryTermsIntervalRef.current) {
      clearInterval(aiSuggestedCategoryTermsIntervalRef.current);
      aiSuggestedCategoryTermsIntervalRef.current = null;
      setAISuggestedCategoryTermsThinkingMessages([]);
      setCurrentAISuggestedCategoryTermsThinkingIndex(0);
    }
  }, [showAISuggestedCategoryTermsModal]);


  const addAISuggestedTerm = useCallback((term: AISuggestedTerm) => {
    toggleTerm(term, 'ai_suggested'); 
  }, [toggleTerm]);

  const handlePolishPrompt = useCallback(async (language: 'en' | 'zh') => {
    if (!ai) return;
    const isEnglish = language === 'en';
    const promptToPolish = isEnglish ? (isPromptEnManual ? manualPromptEn : autoGeneratedPromptEn) : (isPromptZhManual ? manualPromptZh : autoGeneratedPromptZh);
    
    if (!promptToPolish) { setPolishError(`該 ${isEnglish ? '英文' : '中文'} 提示詞為空。`); return; }
    
    if (isEnglish) setIsPolishingEn(true); else setIsPolishingZh(true);
    setPolishError(null);

    const promptTemplate = isEnglish ? aiSystemPrompts.polishPromptEn.template : aiSystemPrompts.polishPromptZh.template;
    const polishInstruction = fillPromptTemplate(promptTemplate, { 
        promptToPolish,
        appContextThemeEn: appContextThemeEn || "Interior Design",
        appContextThemeZh: appContextThemeZh || "室內設計",
    });

    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: polishInstruction });
      const polishedText = response.text.trim();
      if (isEnglish) {
        setManualPromptEn(polishedText);
        setIsPromptEnManual(true); 
      } else {
        setManualPromptZh(polishedText);
        setIsPromptZhManual(true); 
      }
    } catch (e: any) { console.error(`潤飾 ${language} 提示詞時出錯:`, e); setPolishError(`未能潤飾 ${language} 提示詞: ${e.message || '未知錯誤'}`); }
    finally { if (isEnglish) setIsPolishingEn(false); else setIsPolishingZh(false); }
  }, [ai, autoGeneratedPromptEn, autoGeneratedPromptZh, manualPromptEn, manualPromptZh, isPromptEnManual, isPromptZhManual, aiSystemPrompts.polishPromptEn, aiSystemPrompts.polishPromptZh, appContextThemeEn, appContextThemeZh]);

  const effectivePromptEn = isPromptEnManual ? manualPromptEn : autoGeneratedPromptEn;
  const effectivePromptZh = isPromptZhManual ? manualPromptZh : autoGeneratedPromptZh;


  const handleImageGenerated = useCallback((
    image: AppGeneratedImage,
    engine: ImageEngine,
    editBaseImageId?: string, 
    editInstruction?: string, 
    fusionData?: any 
  ) => {
    const currentPromptState: PromptStateForHistory = {
        selectedStyleId: selectedStyle?.id || null,
        selectedRoomTypeId: selectedRoomType?.id || null,
        activeTerms: Array.from(activePromptTerms.entries()),
        subjectInputEn: subjectInputEn,
        subjectInputZh: subjectInputZh,
        
        manualPromptEn: isPromptEnManual ? manualPromptEn : undefined,
        manualPromptZh: isPromptZhManual ? manualPromptZh : undefined,
    };
    const historyEntry: ImageHistoryEntry = {
        ...image, 
        timestamp: Date.now(),
        promptState: currentPromptState,
        engine,
        isFavorite: false, 
        editBaseImageId, 
        editInstruction, 
        fusionParams: fusionData, 
    };
    setImageHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
  }, [selectedStyle, selectedRoomType, activePromptTerms, subjectInputEn, subjectInputZh, isPromptEnManual, manualPromptEn, isPromptZhManual, manualPromptZh]);


  const handleRestorePromptState = useCallback((historyEntry: ImageHistoryEntry) => {
    const styleToRestore = designStyles.find(s => s.id === historyEntry.promptState.selectedStyleId) || null;
    const roomTypeToRestore = roomTypes.find(r => r.id === historyEntry.promptState.selectedRoomTypeId) || null;
    setSelectedStyle(styleToRestore);
    setSelectedRoomType(roomTypeToRestore);
    setActivePromptTerms(new Map(historyEntry.promptState.activeTerms));

    setSubjectInputEn(historyEntry.promptState.subjectInputEn || '');
    setSubjectInputZh(historyEntry.promptState.subjectInputZh || '');
    setIsSubjectInputEnabled(!!(historyEntry.promptState.subjectInputEn || historyEntry.promptState.subjectInputZh));

    if (roomTypeToRestore) setIsRoomTypeSelectorEnabled(true);

    
    if (historyEntry.promptState.manualPromptEn !== undefined) {
        setManualPromptEn(historyEntry.promptState.manualPromptEn);
        setIsPromptEnManual(true);
    } else {
        setIsPromptEnManual(false); 
    }
    if (historyEntry.promptState.manualPromptZh !== undefined) {
        setManualPromptZh(historyEntry.promptState.manualPromptZh);
        setIsPromptZhManual(true);
    } else {
        setIsPromptZhManual(false); 
    }

    setCurrentView('main'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [designStyles, roomTypes]);

  const handleOpenImageDetail = (item: ImageHistoryEntry, sourceList: ImageHistoryEntry[]) => {
    const indexInSource = sourceList.findIndex(entry => entry.id === item.id);
    setSelectedImageForModal(item);
    setModalImageSourceList(sourceList);
    setSelectedImageIndexInSource(indexInSource !== -1 ? indexInSource : null);
  };

  const handleViewImageFromGenerator = (generatedImage: AppGeneratedImage) => {
    const historyEntry = imageHistory.find(entry => entry.id === generatedImage.id);
    if (historyEntry) {
        handleOpenImageDetail(historyEntry, imageHistory);
    } else {
        const tempEntry: ImageHistoryEntry = {
            ...generatedImage,
            timestamp: Date.now(),
            promptState: { 
                selectedStyleId: selectedStyle?.id || null,
                selectedRoomTypeId: selectedRoomType?.id || null,
                activeTerms: Array.from(activePromptTerms.entries()),
                subjectInputEn, subjectInputZh,
                manualPromptEn: isPromptEnManual ? manualPromptEn : undefined,
                manualPromptZh: isPromptZhManual ? manualPromptZh : undefined,
            },
            engine: 'gemini', 
            isFavorite: false,
        };
        setSelectedImageForModal(tempEntry);
        setModalImageSourceList([tempEntry]); 
        setSelectedImageIndexInSource(0);
    }
  };

  const handleNavigateImageDetail = (direction: 'prev' | 'next') => {
    if (selectedImageIndexInSource === null || modalImageSourceList.length === 0) return;
    let newIndex = selectedImageIndexInSource;
    if (direction === 'prev') newIndex = Math.max(0, selectedImageIndexInSource - 1);
    else newIndex = Math.min(modalImageSourceList.length - 1, selectedImageIndexInSource + 1);
    if (newIndex !== selectedImageIndexInSource) {
      setSelectedImageIndexInSource(newIndex);
      setSelectedImageForModal(modalImageSourceList[newIndex]);
    }
  };


  const handleClearHistory = useCallback(() => { 
    if (window.confirm("您確定要清除所有圖像生成歷史嗎？此操作無法復原。")) {
      setImageHistory([]);
    }
  }, []);

  const handleToggleFavoriteImage = useCallback((imageId: string) => {
    setImageHistory(prev =>
      prev.map(entry =>
        entry.id === imageId ? { ...entry, isFavorite: !entry.isFavorite } : entry
      )
    );
  }, []);

  const favoritedImages = useMemo(() => imageHistory.filter(entry => entry.isFavorite), [imageHistory]);

  const handleOpenMultimodalEditModal = useCallback((image: ImageHistoryEntry) => {
    setMultimodalEditBaseImage(image);
    setShowMultimodalEditModal(true);
  }, []);

  const handleOpenImageFusionStudio = useCallback((image: ImageHistoryEntry) => { 
    setImageFusionStudioBaseImage(image);
    setShowImageFusionStudioModal(true);
  }, []);


  const handleOpenMultimodalEditFromAnalyzer = useCallback((imageSrc: string, imageFile: File | null, keywords: AnalyzedImageKeyword[] | null) => {
    if (!imageSrc) return;
    const tempHistoryEntry: ImageHistoryEntry = {
      id: `analyzer-img-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      src: imageSrc,
      prompt: imageFile ? `Uploaded: ${imageFile.name}` : 'Image from gallery',
      timestamp: Date.now(),
      promptState: { 
        selectedStyleId: selectedStyle?.id || null,
        selectedRoomTypeId: selectedRoomType?.id || null,
        activeTerms: Array.from(activePromptTerms.entries()),
        subjectInputEn: subjectInputEn,
        subjectInputZh: subjectInputZh,
        manualPromptEn: isPromptEnManual ? manualPromptEn : undefined,
        manualPromptZh: isPromptZhManual ? manualPromptZh : undefined,
      },
      engine: 'gemini', 
      isFavorite: false,
    };
    setMultimodalEditBaseImage(tempHistoryEntry);
    setMultimodalEditInitialKeywords(keywords); 
    setShowMultimodalEditModal(true);
  }, [selectedStyle, selectedRoomType, activePromptTerms, subjectInputEn, subjectInputZh, isPromptEnManual, manualPromptEn, isPromptZhManual, manualPromptZh]);

  const handleOpenImageFusionStudioFromAnalyzer = useCallback((imageSrc: string, imageFile: File | null) => {
    if (!imageSrc) return;
     const tempHistoryEntry: ImageHistoryEntry = {
      id: `analyzer-fusion-img-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      src: imageSrc,
      prompt: imageFile ? `Fusion base: ${imageFile.name}` : 'Fusion base from gallery',
      timestamp: Date.now(),
      promptState: { 
        selectedStyleId: selectedStyle?.id || null,
        selectedRoomTypeId: selectedRoomType?.id || null,
        activeTerms: Array.from(activePromptTerms.entries()),
        subjectInputEn: subjectInputEn,
        subjectInputZh: subjectInputZh,
        manualPromptEn: isPromptEnManual ? manualPromptEn : undefined,
        manualPromptZh: isPromptZhManual ? manualPromptZh : undefined,
      },
      engine: 'fluxKontextMax', 
      isFavorite: false,
    };
    setImageFusionStudioBaseImage(tempHistoryEntry);
    setShowImageFusionStudioModal(true);
  }, [selectedStyle, selectedRoomType, activePromptTerms, subjectInputEn, subjectInputZh, isPromptEnManual, manualPromptEn, isPromptZhManual, manualPromptZh]);


  const scrollToImageGenerator = () => imageGeneratorColumnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggleSettingsModal = () => setShowSettingsModal(prev => !prev);
  const toggleAddStyleModal = () => setShowAddStyleModal(prev => !prev);
  const toggleAddRoomTypeModal = () => setShowAddRoomTypeModal(prev => !prev);
  const toggleAddCategoryModal = () => setShowAddCategoryModal(prev => !prev); 


  const handleOpenAddCustomTermFromCategoryModal = useCallback((categoryId: string, categoryName: string) => {
    setAddCustomTermModalConfig({
      isOpen: true,
      initialData: { preselectCategoryId: categoryId, categoryNameForDisplay: categoryName },
      showCategorySelector: false,
      modalTitleKey: 'addCustomTermModalTitle',
    });
  }, []);

  const handleOpenQuickAddTermModal = useCallback((initialEn: string, initialZh: string) => {
    setAddCustomTermModalConfig({
      isOpen: true,
      initialData: { termEn: initialEn, termZh: initialZh },
      showCategorySelector: true,
      modalTitleKey: 'addCustomTermModalQuickAddTitle',
    });
  }, []);

  const handleOpenSaveTermModal = useCallback((termToSave: SelectedPromptTerm) => {
    setAddCustomTermModalConfig({
      isOpen: true,
      initialData: {
        termId: termToSave.id,
        termEn: termToSave.termEn,
        termZh: termToSave.termZh,
        preselectCategoryId: termToSave.categoryId, 
      },
      showCategorySelector: true, 
      modalTitleKey: 'saveTermToCategoryModalTitle',
    });
  }, []);

  const handleSaveModalData = useCallback((data: AddCustomTermModalOnSaveData) => {
    const isQuickAddMode = addCustomTermModalConfig.modalTitleKey === 'addCustomTermModalQuickAddTitle';

    if (isQuickAddMode) {
        if (data.selectedCategoryId === DESIGN_STYLE_QUICK_ADD_CATEGORY_ID) {
            const newStyle: DesignStyle = {
                id: `custom_style_quick_${Date.now()}`,
                nameEn: data.termEn,
                nameZh: data.termZh,
                basePromptEn: `${data.termEn} style`, 
                basePromptZh: `${data.termZh}風格`,  
                relatedCategories: Object.keys(customPromptCategorySettings || DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS), 
                isCustom: true,
                descriptionEn: '', descriptionZh: '',
                dynamicDetails: [ 
                    { labelEn: "Suggested Details 1", labelZh: "建議細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                    { labelEn: "Suggested Details 2", labelZh: "建議細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                ]
            };
            contextAddDesignStyle(newStyle);
            setSelectedStyle(newStyle); 
            setShowStyleDetails(true); 
        } else if (data.selectedCategoryId === ROOM_TYPE_QUICK_ADD_CATEGORY_ID) {
            const newRoomType: PromptTerm = {
                id: `custom_roomtype_quick_${Date.now()}`,
                termEn: data.termEn,
                termZh: data.termZh,
                isCustom: true,
            };
            contextAddRoomType(newRoomType);
            setSelectedRoomType(newRoomType); 
            setIsRoomTypeSelectorEnabled(true); 
        } else {
            const newTermId = `custom_term_quick_${data.selectedCategoryId}_${Date.now()}`;
            const newTerm: PromptTerm = {
                id: newTermId,
                termEn: data.termEn,
                termZh: data.termZh,
                categoryId: data.selectedCategoryId,
                isCustom: true
            };
            contextAddTermToCategory(newTerm, data.selectedCategoryId);
            toggleTerm(newTerm, data.selectedCategoryId); 
        }
    } else { 
        const originalTermInActive = data.termIdToUpdate ? activePromptTerms.get(data.termIdToUpdate) : null;
        const isOriginalTermManagedInSettings = data.termIdToUpdate
          ? processedPromptCategories.some(category =>
              category.terms.some(catTerm => catTerm.id === data.termIdToUpdate)
            )
          : false;

        if (data.termIdToUpdate && originalTermInActive && !isOriginalTermManagedInSettings) {
          const newCustomTermId = `custom_saved_${originalTermInActive.id.replace(/[^a-z0-9_]/gi, '')}_${Date.now()}`;
          const newCustomTerm: PromptTerm = {
            id: newCustomTermId,
            termEn: data.termEn, 
            termZh: data.termZh, 
            categoryId: data.selectedCategoryId,
            isCustom: true,
          };
          contextAddTermToCategory(newCustomTerm, data.selectedCategoryId);
          setActivePromptTerms(prevActiveTerms => {
            const newActiveTerms = new Map(prevActiveTerms);
            newActiveTerms.delete(data.termIdToUpdate!); 
            newActiveTerms.set(newCustomTermId, {
              ...newCustomTerm, 
              weight: originalTermInActive.weight || 1.0,
              locked: originalTermInActive.locked || false,
              order: originalTermInActive.order || getNextOrderBasedOnMap(newActiveTerms),
            });
            return newActiveTerms;
          });
        } else if (data.termIdToUpdate && isOriginalTermManagedInSettings) {
          const newOrUpdatedTermId = contextUpdateTermDefinition(
            data.termIdToUpdate,
            { termEn: data.termEn, termZh: data.termZh, isCustom: true }, 
            data.selectedCategoryId 
          );
          if (newOrUpdatedTermId) {
            setActivePromptTerms(prevActiveTerms => {
              const newActiveTerms = new Map(prevActiveTerms);
              const originalTermData = newActiveTerms.get(data.termIdToUpdate!);
              if (newOrUpdatedTermId !== data.termIdToUpdate) { 
                newActiveTerms.delete(data.termIdToUpdate!);
                const newTermDetailsFromContext = processedPromptCategories
                    .flatMap(cat => cat.terms)
                    .find(t => t.id === newOrUpdatedTermId);
                if (newTermDetailsFromContext) {
                     newActiveTerms.set(newOrUpdatedTermId, {
                        ...newTermDetailsFromContext,
                        weight: originalTermData?.weight || 1.0,
                        locked: originalTermData?.locked || false,
                        order: originalTermData?.order || getNextOrderBasedOnMap(newActiveTerms),
                     });
                }
              } else { 
                if (originalTermData) {
                  newActiveTerms.set(newOrUpdatedTermId, {
                    ...originalTermData,
                    termEn: data.termEn,
                    termZh: data.termZh,
                    categoryId: data.selectedCategoryId, 
                    isCustom: true, 
                  });
                }
              }
              return newActiveTerms;
            });
          } else {
            alert("儲存詞語時發生錯誤，詞語未被找到或更新失敗。");
          }
        } else {
          const newTermId = `custom_term_${data.selectedCategoryId}_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
          const newTerm: PromptTerm = {
            id: newTermId,
            termEn: data.termEn,
            termZh: data.termZh,
            categoryId: data.selectedCategoryId,
            isCustom: true
          };
          contextAddTermToCategory(newTerm, data.selectedCategoryId);
        }
    }
    setAddCustomTermModalConfig(prev => ({ ...prev, isOpen: false }));
  }, [
      contextAddTermToCategory,
      contextUpdateTermDefinition,
      contextAddDesignStyle,
      contextAddRoomType,
      toggleTerm,
      setActivePromptTerms,
      getNextOrderBasedOnMap,
      processedPromptCategories, 
      customPromptCategorySettings, 
      addCustomTermModalConfig.modalTitleKey,
      activePromptTerms,
  ]);


  const handleAddCustomStyle = (nameEn: string, nameZh: string) => {
    const newStyle: DesignStyle = {
      id: `custom_style_${Date.now()}`,
      nameEn, nameZh,
      descriptionEn: '', descriptionZh: '', 
      dynamicDetails: [ 
        { labelEn: "Suggested Details 1", labelZh: "建議細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
        { labelEn: "Suggested Details 2", labelZh: "建議細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
      ],
      basePromptEn: `${nameEn} style`, 
      basePromptZh: `${nameZh}風格`,  
      relatedCategories: Object.keys(customPromptCategorySettings || DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS), 
      isCustom: true
    };
    contextAddDesignStyle(newStyle);
    setSelectedStyle(newStyle); 
    setShowStyleDetails(true); 
  };

  const handleAddCustomRoomType = (termEn: string, termZh: string) => {
    const newRoomType: PromptTerm = {
      id: `custom_roomtype_${Date.now()}`,
      termEn,
      termZh,
      isCustom: true,
    };
    contextAddRoomType(newRoomType);
    setSelectedRoomType(newRoomType); 
    setIsRoomTypeSelectorEnabled(true); 
  };

  const handleTranslateInputForModal = useCallback(async (textToTranslate: string, targetLanguage: 'en' | 'zh'): Promise<string | null> => {
    if (!ai) { console.error("Gemini AI client not available for translation."); return null; }
    const promptTemplateDetails = targetLanguage === 'en' ? aiSystemPrompts.translateToEnglish : aiSystemPrompts.translateToChinese;
     if (!promptTemplateDetails || !promptTemplateDetails.template) {
        console.error(`Translation prompt template for ${targetLanguage} not found.`);
        throw new Error(`Translation prompt template for ${targetLanguage} not found.`);
    }
    const prompt = fillPromptTemplate(promptTemplateDetails.template, { textToTranslate });
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      return response.text.trim();
    } catch (e: any) { console.error("Error translating with AI:", e); throw e; }
  }, [ai, aiSystemPrompts.translateToEnglish, aiSystemPrompts.translateToChinese]); 


  const handleGenerateStyleDetailsWithAI = useCallback(async () => {
    if (!ai || !selectedStyle) { setStyleDetailsAIError("請先選擇一個風格。"); return; }
    if (!settingsContext) { setStyleDetailsAIError("設定組件載入失敗。"); return; }
    if (styleDetailsThinkingIntervalRef.current) clearInterval(styleDetailsThinkingIntervalRef.current);
    setIsLoadingStyleDetailsAI(true);
    setStyleDetailsAIError(null);
    
    const industryContextForAI = appContextThemeZh || appContextThemeEn || "室內設計"; // Prioritize Zh for display in thinking
    const steps = [
        `分析風格主旨: ${selectedStyle.nameEn} / ${selectedStyle.nameZh}`,
        `考量產業主題: ${industryContextForAI}`,
        `AI 正在為「${selectedStyle.nameZh}」風格生成專屬描述...`,
        `AI 根據描述和主題「${industryContextForAI.substring(0,10)}...」構思兩組動態標籤...`,
        `AI 為動態標籤生成對應的提示詞建議...`,
        "整合所有專業見解...",
        "準備JSON格式化輸出...",
        "即將完成風格詳細資料生成！",
    ];
    setStyleDetailsThinkingMessages(steps);
    setCurrentStyleDetailsThinkingIndex(0);
    styleDetailsThinkingIntervalRef.current = window.setInterval(() => {
        setCurrentStyleDetailsThinkingIndex(prevIndex => {
            if (prevIndex < steps.length - 1) return prevIndex + 1;
            if (styleDetailsThinkingIntervalRef.current) clearInterval(styleDetailsThinkingIntervalRef.current);
            styleDetailsThinkingIntervalRef.current = null;
            return prevIndex;
        });
    }, 1200);
    const promptTemplate = aiSystemPrompts.styleDetails.template;
    const prompt = fillPromptTemplate(promptTemplate, {
        styleNameEn: selectedStyle.nameEn,
        styleNameZh: selectedStyle.nameZh,
        basePromptEn: selectedStyle.basePromptEn,
        basePromptZh: selectedStyle.basePromptZh,
        industryContext: appContextThemeZh || appContextThemeEn || "室內設計", // Pass combined or preferred
    });
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: "application/json" } });
      if (styleDetailsThinkingIntervalRef.current) clearInterval(styleDetailsThinkingIntervalRef.current);
      styleDetailsThinkingIntervalRef.current = null;
      const parsedDetails = parseGeminiJsonResponse<AIStyleDetails>(response.text);
      const validateDynamicDetailSet = (detailSet?: DynamicDetailSet): boolean => 
        !!(detailSet && typeof detailSet.labelEn === 'string' && detailSet.labelEn.trim() !== '' && typeof detailSet.labelZh === 'string' && detailSet.labelZh.trim() !== '' && Array.isArray(detailSet.termsEn) && detailSet.termsEn.length === 3 && detailSet.termsEn.every(item => typeof item === 'string' && item.trim() !== '') && Array.isArray(detailSet.termsZh) && detailSet.termsZh.length === 3 && detailSet.termsZh.every(item => typeof item === 'string' && item.trim() !== ''));
      
      if (parsedDetails && 
          typeof parsedDetails.descriptionEn === 'string' && 
          typeof parsedDetails.descriptionZh === 'string' &&
          validateDynamicDetailSet(parsedDetails.dynamicDetail1) &&
          validateDynamicDetailSet(parsedDetails.dynamicDetail2)) { 
        const detailsToUpdate: Partial<Pick<DesignStyle, 'descriptionEn' | 'descriptionZh' | 'dynamicDetails'>> = {
            descriptionEn: parsedDetails.descriptionEn,
            descriptionZh: parsedDetails.descriptionZh,
            dynamicDetails: [parsedDetails.dynamicDetail1, parsedDetails.dynamicDetail2],
        };
        contextUpdateDesignStyle(selectedStyle.id, detailsToUpdate);
        setSelectedStyle(prevSelStyle => prevSelStyle ? { ...prevSelStyle, ...detailsToUpdate } : null);
      } else { 
        setStyleDetailsAIError("AI返回的資料格式不完整、不符預期或陣列項目數量不正確。"); 
        console.error("AI生成的風格詳細資料格式錯誤:", parsedDetails, "原始文本:", response.text); 
      }
    } catch (e: any) {
        if (styleDetailsThinkingIntervalRef.current) clearInterval(styleDetailsThinkingIntervalRef.current);
        styleDetailsThinkingIntervalRef.current = null;
        console.error("使用AI生成風格詳細資訊時出錯:", e); setStyleDetailsAIError(`生成失敗：${e.message || '未知錯誤'}`);
    }
    finally { setIsLoadingStyleDetailsAI(false); }
  }, [ai, selectedStyle, appContextThemeEn, appContextThemeZh, aiSystemPrompts.styleDetails, contextUpdateDesignStyle, settingsContext]); 

  const handleTranslateNameToEnglish = useCallback(async (nameZh: string): Promise<string | null> => {
    if (!ai) { console.error("Gemini AI client not available for translation."); return null; }
    const promptTemplate = aiSystemPrompts.translateStyleNameToEnglish.template;
    const prompt = fillPromptTemplate(promptTemplate, { nameZh });
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
      return response.text.trim();
    } catch (e: any) { console.error("Error translating name with AI:", e); throw e; }
  }, [ai, aiSystemPrompts.translateStyleNameToEnglish]); 

  const handleRandomizeAllPrompts = useCallback(async () => {
    if (!ai || !selectedStyle || (!selectedRoomType && isRoomTypeSelectorEnabled)) { 
      setRandomPromptsError("請先選擇風格 (若空間類型已啟用，亦需選擇空間類型) 才能隨機選詞。");
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
    const roomTypeEnForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termEn : "Not specified";
    const roomTypeZhForPrompt = (selectedRoomType && isRoomTypeSelectorEnabled) ? selectedRoomType.termZh : "未指定";

    const promptTemplate = aiSystemPrompts.randomPromptSelection.template;
    const prompt = fillPromptTemplate(promptTemplate, {
        styleNameEn: selectedStyle.nameEn,
        styleNameZh: selectedStyle.nameZh,
        roomTypeEn: roomTypeEnForPrompt,
        roomTypeZh: roomTypeZhForPrompt,
        availableTermsList: termsListForPrompt,
        appContextThemeEn: appContextThemeEn || "Interior Design",
        appContextThemeZh: appContextThemeZh || "室內設計",
    });

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
          prevTerms.forEach((term, id) => { if (term.locked) newTerms.set(id, term); });
          let nextOrder = getNextOrderBasedOnMap(newTerms); 
          suggestedTermIds.forEach(idToActivate => {
            if (!newTerms.has(idToActivate)) { 
              const termDefinition = processedPromptCategories.flatMap(cat => cat.terms).find(t => t.id === idToActivate);
              if (termDefinition) {
                 newTerms.set(idToActivate, {
                    ...termDefinition, weight: 1.0, locked: false,
                    categoryId: termDefinition.categoryId || 'unknown', 
                    order: nextOrder++
                });
              }
            }
          });
          return newTerms;
        });
        setIsPromptEnManual(false); setIsPromptZhManual(false); 
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
  }, [ai, selectedStyle, selectedRoomType, isRoomTypeSelectorEnabled, relevantCategories, processedPromptCategories, aiSystemPrompts.randomPromptSelection, getNextOrderBasedOnMap, appContextThemeEn, appContextThemeZh]); 

  const handleKeywordsExtractedFromAnalyzer = useCallback((keywords: AnalyzedImageKeyword[]) => {
      setLastAnalyzedKeywords(keywords);
  }, []);

  const handleAddAnalyzedKeywordToActivePrompt = useCallback((keyword: AnalyzedImageKeyword) => {
    const termEnLower = (keyword.termEn || "").toLowerCase().trim();
    const termZhLower = (keyword.termZh || "").toLowerCase().trim();
    if (!termEnLower && !termZhLower) return; 
    let foundExistingTerm: PromptTerm | null = null;
    let existingTermCategoryId: string | null = null;
    for (const category of processedPromptCategories) {
      for (const term of category.terms) {
        const existingTermEnLower = term.termEn.toLowerCase().trim();
        const existingTermZhLower = term.termZh.toLowerCase().trim();
        if ((termEnLower && termEnLower === existingTermEnLower) || (termZhLower && termZhLower === existingTermZhLower)) {
          foundExistingTerm = term;
          existingTermCategoryId = category.id;
          break;
        }
      }
      if (foundExistingTerm) break;
    }
    setActivePromptTerms(prevActiveTerms => {
      const newActiveTermsMap = new Map(prevActiveTerms);
      if (foundExistingTerm && existingTermCategoryId) {
        if (!newActiveTermsMap.has(foundExistingTerm.id)) {
          newActiveTermsMap.set(foundExistingTerm.id, {
            ...foundExistingTerm,
            weight: 1.0,
            locked: false,
            categoryId: existingTermCategoryId,
            order: getNextOrderBasedOnMap(newActiveTermsMap)
          });
        }
      } else {
        const newTermId = `ai_img_term_${Date.now()}_${termEnLower.replace(/[^a-z0-9]/gi, '_').substring(0, 10)}_${Math.random().toString(16).slice(2, 8)}`;
        const newTermToAdd: PromptTerm = {
          id: newTermId,
          termEn: keyword.termEn,
          termZh: keyword.termZh,
          categoryId: 'ai_analyzed_image_terms', 
          isCustom: true,
        };
        newActiveTermsMap.set(newTermToAdd.id, {
          ...newTermToAdd,
          weight: 1.0,
          locked: false,
          categoryId: 'ai_analyzed_image_terms',
          order: getNextOrderBasedOnMap(newActiveTermsMap)
        });
      }
      return newActiveTermsMap;
    });
    setIsPromptEnManual(false); setIsPromptZhManual(false);
  }, [processedPromptCategories, getNextOrderBasedOnMap]); 


  const activeTermsForBuilder: SelectedPromptTermForChip[] = useMemo(() => {
    return Array.from(activePromptTerms.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(term => {
        const isCategorized = processedPromptCategories.some(category =>
          category.terms.some(catTerm => catTerm.id === term.id)
        );
        return { ...term, isCategorized };
      });
  }, [activePromptTerms, processedPromptCategories]);
  
  const handleSetImageForSubjectContext = useCallback((imageSrc: string | null) => {
    setAnalyzedImageForSubjectContext(imageSrc);
  }, []);

  const currentPromptStateForImageGen: PromptStateForHistory = useMemo(() => ({
    selectedStyleId: selectedStyle?.id || null,
    selectedRoomTypeId: selectedRoomType?.id || null,
    activeTerms: Array.from(activePromptTerms.entries()),
    subjectInputEn,
    subjectInputZh,
    manualPromptEn: isPromptEnManual ? manualPromptEn : undefined,
    manualPromptZh: isPromptZhManual ? manualPromptZh : undefined,
  }), [selectedStyle, selectedRoomType, activePromptTerms, subjectInputEn, subjectInputZh, isPromptEnManual, manualPromptEn, isPromptZhManual, manualPromptZh]);


  const handleGenerateNewStyleSet = useCallback(async () => {
    if (!ai || !settingsContext) {
        setAISuggestedStylesError("AI client 或設定組件不可用。");
        return;
    }
    const effectiveAppContextThemeEn = appContextThemeEn || "Interior Design";
    const effectiveAppContextThemeZh = appContextThemeZh || "室內設計";

    setIsLoadingAISuggestedStyles(true);
    setAISuggestedStylesError(null);
    if (aiStyleSetThinkingIntervalRef.current) clearInterval(aiStyleSetThinkingIntervalRef.current);

    const steps = [
        `分析應用程式主題: ${effectiveAppContextThemeZh}`,
        "AI 正在構思一個新的設計風格...",
        "生成風格名稱与基礎提示詞...",
        "準備新風格資料...",
        "即將完成！"
    ];
    setAIStyleSetThinkingMessages(steps);
    setCurrentAIStyleSetThinkingIndex(0);
    aiStyleSetThinkingIntervalRef.current = window.setInterval(() => {
        setCurrentAIStyleSetThinkingIndex(prev => {
            if (prev < steps.length - 1) return prev + 1;
            if (aiStyleSetThinkingIntervalRef.current) clearInterval(aiStyleSetThinkingIntervalRef.current);
            return prev;
        });
    }, 1200);

    const promptTemplate = aiSystemPrompts.aiStyleSetSuggestion.template;
    const allCategoryIds = Object.keys(customPromptCategorySettings || PROMPT_CATEGORIES);
    const existingStyleNames = designStyles.map(s => `${s.nameEn} (${s.nameZh})`);
    
    const prompt = fillPromptTemplate(promptTemplate, {
        appContextThemeEn: effectiveAppContextThemeEn,
        appContextThemeZh: effectiveAppContextThemeZh,
        existingStyleNamesJSON: JSON.stringify(existingStyleNames),
        categoryIdsJSON: JSON.stringify(allCategoryIds),
    });

    try {
        const response: GeminiGenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        if (aiStyleSetThinkingIntervalRef.current) clearInterval(aiStyleSetThinkingIntervalRef.current);

        const newStyleObject = parseGeminiJsonResponse<DesignStyle>(response.text);
        if (newStyleObject && newStyleObject.id && newStyleObject.nameEn && newStyleObject.nameZh && newStyleObject.basePromptEn && newStyleObject.basePromptZh) {
            
            const validatedNewStyle: DesignStyle = {
                ...newStyleObject,
                descriptionEn: newStyleObject.descriptionEn || '',
                descriptionZh: newStyleObject.descriptionZh || '',
                dynamicDetails: newStyleObject.dynamicDetails && newStyleObject.dynamicDetails.length === 2 ?
                    [
                        { ...newStyleObject.dynamicDetails[0], termsEn: ensureThreeTerms(newStyleObject.dynamicDetails[0]?.termsEn), termsZh: ensureThreeTerms(newStyleObject.dynamicDetails[0]?.termsZh) },
                        { ...newStyleObject.dynamicDetails[1], termsEn: ensureThreeTerms(newStyleObject.dynamicDetails[1]?.termsEn), termsZh: ensureThreeTerms(newStyleObject.dynamicDetails[1]?.termsZh) }
                    ]
                    : [ 
                        { labelEn: "Details 1", labelZh: "細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                        { labelEn: "Details 2", labelZh: "細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                    ],
                relatedCategories: Array.isArray(newStyleObject.relatedCategories) && newStyleObject.relatedCategories.length > 0 
                                    ? newStyleObject.relatedCategories 
                                    : allCategoryIds,
                isCustom: false, // AI is instructed to set this to false for these "core" suggestions
            };
            
            contextAddDesignStyle(validatedNewStyle);
            setSelectedStyle(validatedNewStyle); 
            setAISuggestedStylesError(null);
        } else {
            console.error("AI Style Suggestion: Invalid data format from AI for single style.", newStyleObject, "Original text:", response.text);
            setAISuggestedStylesError("AI 返回的風格建議格式不正確或為空。");
        }
    } catch (e: any) {
        if (aiStyleSetThinkingIntervalRef.current) clearInterval(aiStyleSetThinkingIntervalRef.current);
        console.error("Error generating new style:", e);
        setAISuggestedStylesError(`新增 AI 風格建議失敗: ${e.message || "未知錯誤"}`);
    } finally {
        setIsLoadingAISuggestedStyles(false);
    }
  }, [ai, appContextThemeEn, appContextThemeZh, aiSystemPrompts.aiStyleSetSuggestion, customPromptCategorySettings, designStyles, settingsContext, contextAddDesignStyle]);

  const handleGenerateNewRoomTypeSet = useCallback(async () => {
    if (!ai || !settingsContext) {
        setAIRoomTypeSetError("AI client 或設定組件不可用。");
        return;
    }
    const effectiveAppContextThemeEn = appContextThemeEn || "Interior Design";
    const effectiveAppContextThemeZh = appContextThemeZh || "室內設計";


    setIsLoadingAIRoomTypeSet(true);
    setAIRoomTypeSetError(null);
    if (aiRoomTypeSetThinkingIntervalRef.current) clearInterval(aiRoomTypeSetThinkingIntervalRef.current);

    const steps = [
        `分析應用程式主題: ${effectiveAppContextThemeZh}`,
        `AI 正在為「${uiTexts.roomTypeSelectorTitle?.textZh || '空間類型'}」構思一個新的項目...`,
        "生成空間/區域類型名稱...",
        "準備新空間/區域類型資料...",
        "即將完成！"
    ];
    setAIRoomTypeSetThinkingMessages(steps);
    setCurrentAIRoomTypeSetThinkingIndex(0);
    aiRoomTypeSetThinkingIntervalRef.current = window.setInterval(() => {
        setCurrentAIRoomTypeSetThinkingIndex(prev => {
            if (prev < steps.length - 1) return prev + 1;
            if (aiRoomTypeSetThinkingIntervalRef.current) clearInterval(aiRoomTypeSetThinkingIntervalRef.current);
            return prev;
        });
    }, 1200);
    
    const promptTemplate = aiSystemPrompts.aiRoomTypeSetSuggestion.template;
    const existingRoomTypeNames = roomTypes.map(rt => `${rt.termEn} (${rt.termZh})`);
    const prompt = fillPromptTemplate(promptTemplate, { 
        appContextThemeEn: effectiveAppContextThemeEn,
        appContextThemeZh: effectiveAppContextThemeZh,
        existingRoomTypeNamesJSON: JSON.stringify(existingRoomTypeNames),
    });

    try {
        const response: GeminiGenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        if (aiRoomTypeSetThinkingIntervalRef.current) clearInterval(aiRoomTypeSetThinkingIntervalRef.current);

        const newRoomTypeObject = parseGeminiJsonResponse<PromptTerm>(response.text);
        if (newRoomTypeObject && newRoomTypeObject.id && newRoomTypeObject.termEn && newRoomTypeObject.termZh) {
            
            const validatedNewRoomType: PromptTerm = {
                ...newRoomTypeObject,
                isCustom: false, // AI instructed to set this
            };
            
            contextAddRoomType(validatedNewRoomType);
            setSelectedRoomType(validatedNewRoomType);
            setAIRoomTypeSetError(null);
        } else {
            console.error("AI Room Type Suggestion: Invalid data format from AI for single room type.", newRoomTypeObject, "Original text:", response.text);
            setAIRoomTypeSetError("AI 返回的空間/區域類型建議格式不正確或為空。");
        }
    } catch (e: any) {
        if (aiRoomTypeSetThinkingIntervalRef.current) clearInterval(aiRoomTypeSetThinkingIntervalRef.current);
        console.error("Error generating new room type:", e);
        setAIRoomTypeSetError(`新增 AI 空間/區域類型建議失敗: ${e.message || "未知錯誤"}`);
    } finally {
        setIsLoadingAIRoomTypeSet(false);
    }
  }, [ai, appContextThemeEn, appContextThemeZh, aiSystemPrompts.aiRoomTypeSetSuggestion, roomTypes, settingsContext, uiTexts.roomTypeSelectorTitle, contextAddRoomType]);

  const handleDeleteTermFromCategoryAndActive = useCallback((termId: string, categoryId: string) => {
    if (!settingsContext) return;
    const termToDelete = processedPromptCategories.flatMap(cat => cat.terms).find(t => t.id === termId);
    const categoryOfTerm = processedPromptCategories.find(cat => cat.id === categoryId);

    let confirmMessage = `您確定要從分類「${categoryOfTerm?.nameZh || categoryId}」中刪除詞語「${termToDelete?.termZh || termId}」嗎？`;
    confirmMessage += `\n此操作會將其從目前設定中移除。若要復原，需重設此分類或整體應用程式設定至預設值。`;

    if (window.confirm(confirmMessage)) {
        contextDeleteTermFromCategory(termId, categoryId);
        setActivePromptTerms(prevTerms => {
            const newTerms = new Map(prevTerms);
            if (newTerms.has(termId)) {
                newTerms.delete(termId);
            }
            return newTerms;
        });
    }
  }, [settingsContext, contextDeleteTermFromCategory, processedPromptCategories]);

  const handleDeleteTermFromStyleDetailContext = useCallback((styleId: string, detailSetIndex: 0 | 1, termIndex: number) => {
    if(!settingsContext || !selectedStyle) return;
    const styleName = selectedStyle.nameZh;
    const detailSet = selectedStyle.dynamicDetails[detailSetIndex];
    const labelName = detailSet.labelZh;
    const termEn = detailSet.termsEn[termIndex];
    const termZh = detailSet.termsZh[termIndex];

    const confirmMessage = `您確定要從風格「${styleName}」的「${labelName}」中刪除詞語「${termEn} / ${termZh}」嗎？\n此操作會將其從目前設定中移除（若要復原，需透過 AI 重新生成此風格的詳細資料或重設整體應用程式設定至預設值）。`;
    if (window.confirm(confirmMessage)) {
        contextDeleteTermFromStyleDetail(styleId, detailSetIndex, termIndex);
    }
  }, [settingsContext, selectedStyle, contextDeleteTermFromStyleDetail]);

  const handleDeleteRoomTypeAndUpdateSelection = useCallback((roomTypeId: string) => {
    if (!settingsContext) return;
    const roomTypeToDelete = roomTypes.find(rt => rt.id === roomTypeId);
    if (!roomTypeToDelete) return;
    
    const confirmMessage = `您確定要刪除空間類型「${roomTypeToDelete.termZh} (${roomTypeToDelete.termEn})」嗎？\n此操作會將其從目前設定中移除。若要復原，需重設空間類型或整體應用程式設定至預設值。`;
    if (window.confirm(confirmMessage)) {
        contextDeleteRoomType(roomTypeId);
        if (selectedRoomType?.id === roomTypeId) {
            setSelectedRoomType(null); 
        }
    }
  }, [settingsContext, roomTypes, selectedRoomType, contextDeleteRoomType]);

  const handleDeleteDesignStyleAndUpdateSelection = useCallback((styleId: string) => {
    if (!settingsContext) return;
    const styleToDelete = designStyles.find(s => s.id === styleId);
    if (!styleToDelete) return;

    const confirmMessage = `您確定要刪除設計風格「${styleToDelete.nameZh} (${styleToDelete.nameEn})」嗎？\n此操作會將其從目前設定中移除，且可能無法輕易復原。\n若要取回預設風格，需重設核心內容或整體應用程式設定。`;
    if (window.confirm(confirmMessage)) {
        contextDeleteDesignStyle(styleId);
        if (selectedStyle?.id === styleId) {
            const remainingStyles = designStyles.filter(s => s.id !== styleId);
            setSelectedStyle(remainingStyles.length > 0 ? remainingStyles[0] : null);
        }
    }
  }, [settingsContext, designStyles, selectedStyle, contextDeleteDesignStyle]);

  const handleAddNewCategory = useCallback((data: { id: string; nameEn: string; nameZh: string; isOpenDefault: boolean }) => {
    if (!settingsContext) return false;
    const success = contextAddPromptCategory({
      id: data.id, 
      nameEn: data.nameEn,
      nameZh: data.nameZh,
      isOpenDefault: data.isOpenDefault,
    });
    if (success) {
        setShowAddCategoryModal(false); 
    }
    return success; 
  }, [settingsContext, contextAddPromptCategory]);

  const handleDeletePromptCategoryAndUpdateActive = useCallback((categoryId: string) => {
    if (!settingsContext) return;
    const categoryToDelete = processedPromptCategories.find(cat => cat.id === categoryId);
    if (!categoryToDelete) return;
    
    const confirmMessage = `您確定要刪除分類「${categoryToDelete.nameZh}」及其包含的所有詞語嗎？此操作無法復原。`;
    if (window.confirm(confirmMessage)) {
        contextDeletePromptCategory(categoryId);
        setActivePromptTerms(prevTerms => {
            const newTerms = new Map(prevTerms);
            prevTerms.forEach((term, termId) => {
                if (term.categoryId === categoryId) {
                    newTerms.delete(termId);
                }
            });
            return newTerms;
        });
    }
  }, [settingsContext, contextDeletePromptCategory, processedPromptCategories]);


  if (currentView === 'favorites') {
    return (
      <FavoritesPage
        images={favoritedImages}
        onBack={() => setCurrentView('main')}
        onToggleFavorite={handleToggleFavoriteImage}
        onViewImageDetail={(image) => handleOpenImageDetail(image, favoritedImages)}
        onRestoreState={handleRestorePromptState}
        onOpenMultimodalEditModal={handleOpenMultimodalEditModal}
        onOpenImageFusionStudio={handleOpenImageFusionStudio} 
        uiTexts={{
          backButtonLabel: uiTexts.backToMainAppButtonLabel.textZh,
          pageTitle: uiTexts.favoritesPageTitle.textZh,
          favoriteImageButtonTooltip: uiTexts.favoriteImageButtonTooltip.textZh,
          unfavoriteImageButtonTooltip: uiTexts.unfavoriteImageButtonTooltip.textZh,
          // imageFusionStudioOpenButtonTooltip is now sourced from context inside FavoritesPage
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header
        onToggleSettings={toggleSettingsModal}
        onViewFavorites={() => setCurrentView('favorites')}
        currentView={currentView}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-8 gap-6">
          
          {/* Left Column: Selectors */}
          <div className="lg:col-span-1 2xl:col-span-2 space-y-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200 apple-scroll overflow-y-auto max-h-[calc(100vh-120px)]">
            <StyleSelector
                styles={designStyles}
                selectedStyle={selectedStyle}
                onSelect={handleStyleSelect}
                onShowAddStyleModal={toggleAddStyleModal}
                title={uiTexts.styleSelectorTitle?.textZh || DEFAULT_UI_TEXTS.styleSelectorTitle.textZh}
                onGenerateNewStyleSet={handleGenerateNewStyleSet}
                isLoadingAISuggestedStyles={isLoadingAISuggestedStyles}
                aiSuggestedStylesError={aiSuggestedStylesError}
                geminiApiKeySet={!!geminiApiKey}
                thinkingMessages={aiStyleSetThinkingMessages}
                currentThinkingIndex={currentAIStyleSetThinkingIndex}
                onDeleteTermFromDetail={handleDeleteTermFromStyleDetailContext}
                onDeleteStyle={handleDeleteDesignStyleAndUpdateSelection} 
            />
            {selectedStyle && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <button onClick={() => setShowStyleDetails(!showStyleDetails)} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-900/90 hover:text-gray-900 active:scale-95 transform transition-transform duration-100" aria-expanded={showStyleDetails} aria-controls="style-details-content">
                  <span>{selectedStyle.nameEn} / {selectedStyle.nameZh} 詳細資訊</span>
                  {showStyleDetails ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
                {showStyleDetails && (
                  <div id="style-details-content" className="mt-2 space-y-3 text-xs text-gray-600">
                    <GenerateStyleDetailsButton 
                        onClick={handleGenerateStyleDetailsWithAI}
                        isLoading={isLoadingStyleDetailsAI}
                        error={styleDetailsAIError}
                        geminiApiKeySet={!!geminiApiKey}
                    />
                    {isLoadingStyleDetailsAI && styleDetailsThinkingMessages.length > 0 && (
                      <div className="my-1 p-1.5 border border-gray-100 rounded-md bg-white text-[11px]">
                          {styleDetailsThinkingMessages.map((message, index) => (
                            <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentStyleDetailsThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                              {index < currentStyleDetailsThinkingIndex ? <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 shrink-0" />
                              : index === currentStyleDetailsThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1 text-blue-500 shrink-0" />
                              : <div className="w-3 h-3 mr-1 shrink-0 border border-gray-300 rounded-full" />}
                              <span className={`${index === currentStyleDetailsThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                            </div>
                          ))}
                      </div>
                    )}
                    <p><strong>英文描述:</strong> {selectedStyle.descriptionEn || '尚無描述。'}</p>
                    <p><strong>中文描述:</strong> {selectedStyle.descriptionZh || '尚無描述。'}</p>
                    {selectedStyle.dynamicDetails?.map((detailSet, setIndex) => (
                      <div key={setIndex} className="mt-2 pt-2 border-t border-gray-100">
                        <p className="font-medium text-gray-700">{detailSet.labelEn} / {detailSet.labelZh}:</p>
                        <ul className="list-disc list-inside pl-2 text-[11px] space-y-0.5">
                          {detailSet.termsEn.map((termEn, termIndex) => {
                            const termZh = detailSet.termsZh[termIndex];
                            if (termEn || termZh) { 
                                return (
                                    <li key={termIndex} className="group flex justify-between items-center">
                                    <button 
                                        onClick={() => handleAddKeywordFromDetails(selectedStyle.id, setIndex as 0 | 1, termEn, termZh)}
                                        className="text-left hover:text-blue-600 transition-colors active:scale-95 transform duration-100"
                                        title={`點擊以新增 "${termEn} / ${termZh}" 到主要提示詞`}
                                    >
                                        {termEn} / {termZh}
                                    </button>
                                    <IconButton
                                        onClick={() => contextDeleteTermFromStyleDetail(selectedStyle.id, setIndex as 0 | 1, termIndex)}
                                        aria-label={`從「${detailSet.labelZh}」刪除詞語「${termEn} / ${termZh}」`}
                                        title={`刪除此建議詞語`}
                                        className="ml-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 active:scale-95 transform transition-transform duration-100"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </IconButton>
                                    </li>
                                );
                            }
                            return null;
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <RoomTypeSelector
              roomTypes={roomTypes}
              selectedRoomType={selectedRoomType}
              onSelect={handleRoomTypeSelect}
              title={uiTexts.roomTypeSelectorTitle?.textZh || DEFAULT_UI_TEXTS.roomTypeSelectorTitle.textZh}
              isEnabled={isRoomTypeSelectorEnabled}
              onToggleEnable={setIsRoomTypeSelectorEnabled}
              onShowAddRoomTypeModal={toggleAddRoomTypeModal}
              onGenerateNewRoomTypeSet={handleGenerateNewRoomTypeSet}
              isLoadingAIRoomTypeSet={isLoadingAIRoomTypeSet}
              aiRoomTypeSetError={aiRoomTypeSetError}
              geminiApiKeySet={!!geminiApiKey}
              thinkingMessages={aiRoomTypeSetThinkingMessages}
              currentThinkingIndex={currentAIRoomTypeSetThinkingIndex}
              buttonLabelFromAI={uiTexts.roomTypeSetAISuggestionButtonLabel?.textZh || DEFAULT_UI_TEXTS.roomTypeSetAISuggestionButtonLabel.textZh}
              onDeleteRoomType={handleDeleteRoomTypeAndUpdateSelection}
            />
            
            <SubjectInput 
                subjectEn={subjectInputEn}
                subjectZh={subjectInputZh}
                onSubjectEnChange={setSubjectInputEn}
                onSubjectZhChange={setSubjectInputZh}
                aiSuggestionSeedText={aiSuggestionSeedText} 
                onAiSuggestionSeedTextChange={setAiSuggestionSeedText}
                isEnabled={isSubjectInputEnabled}
                onToggleEnable={setIsSubjectInputEnabled}
                ai={ai}
                geminiApiKeySet={!!geminiApiKey}
                uiTexts={{
                    title: uiTexts.subjectInputTitle.textZh,
                    aiSuggestionButtonLabel: uiTexts.subjectInputAISuggestionButtonLabel.textZh,
                    translateToEnglishButton: "譯為英文",
                    translateToChineseButton: "譯為中文",
                    enPlaceholder: "例如：A woman standing on a city street at night",
                    zhPlaceholder: "例如：一個女人站在夜晚的城市街道上",
                }}
                fillPromptTemplate={fillPromptTemplate}
                aiSystemPrompts={aiSystemPrompts}
                appContextThemeEn={appContextThemeEn}
                appContextThemeZh={appContextThemeZh}
                analyzedImageKeywords={lastAnalyzedKeywords}
                selectedStyle={selectedStyle}
                selectedRoomType={selectedRoomType}
                isRoomTypeSelectorEnabled={isRoomTypeSelectorEnabled}
                analyzedImageSrc={analyzedImageForSubjectContext} 
                onFetchSubjectPhraseSuggestions={handleFetchSubjectPhraseSuggestions}
            />
            
            <ImageAnalyzer 
                isEnabled={isImageAnalyzerEnabled}
                onToggleEnable={setIsImageAnalyzerEnabled}
                uiTexts={{
                    imageAnalyzerTitle: uiTexts.imageAnalyzerTitle,
                    analyzeImageButton: uiTexts.analyzeImageButton,
                    uploadImageLabel: uiTexts.uploadImageLabel,
                    imageAnalyzerAdvancedEditButtonLabel: uiTexts.imageAnalyzerAdvancedEditButtonLabel,
                    imageAnalyzerOpenFusionStudioButtonLabel: uiTexts.imageAnalyzerOpenFusionStudioButtonLabel,
                    imageFusionStudioImportFromGalleryButtonLabel: uiTexts.imageFusionStudioImportFromGalleryButtonLabel,
                    imageSelectorModalTitle: uiTexts.imageSelectorModalTitle,
                    imageSelectorModalAllTab: uiTexts.imageSelectorModalAllTab,
                    imageSelectorModalFavoritesTab: uiTexts.imageSelectorModalFavoritesTab,
                    imageSelectorModalNoImages: uiTexts.imageSelectorModalNoImages,
                    imageSelectorModalNoFavorites: uiTexts.imageSelectorModalNoFavorites,
                    favoriteImageButtonTooltip: uiTexts.favoriteImageButtonTooltip,
                    unfavoriteImageButtonTooltip: uiTexts.unfavoriteImageButtonTooltip,
                }}
                geminiApiKeySet={!!geminiApiKey}
                onOpenMultimodalEditFromAnalyzer={handleOpenMultimodalEditFromAnalyzer}
                onOpenImageFusionStudioFromAnalyzer={handleOpenImageFusionStudioFromAnalyzer}
                ai={ai}
                aiSystemPrompts={{
                    imageAnalysisForPrompts: aiSystemPrompts.imageAnalysisForPrompts,
                    ocrImage: aiSystemPrompts.ocrImage,
                }}
                fillPromptTemplate={fillPromptTemplate}
                appContextThemeEn={appContextThemeEn}
                appContextThemeZh={appContextThemeZh}
                onKeywordsExtracted={handleKeywordsExtractedFromAnalyzer}
                onAddAnalyzedKeywordToPrompt={handleAddAnalyzedKeywordToActivePrompt}
                imageHistory={imageHistory}
                onImageReadyForContext={handleSetImageForSubjectContext} 
            />
          </div>

          {/* Middle Column: Image Generator and History */}
          <div ref={imageGeneratorColumnRef} className="lg:col-span-2 2xl:col-span-4 space-y-6">
            <ImageGenerator
              promptEn={effectivePromptEn}
              geminiApiKey={geminiApiKey}
              onImageGenerated={handleImageGenerated}
              onViewImage={handleViewImageFromGenerator}
              currentPromptState={currentPromptStateForImageGen}
              title={uiTexts.imageGeneratorTitle?.textZh || DEFAULT_UI_TEXTS.imageGeneratorTitle.textZh}
            />
            <ImageHistoryDisplay
              history={imageHistory}
              onViewImage={(image) => handleOpenImageDetail(image, imageHistory)}
              onRestoreState={handleRestorePromptState}
              onClearAllHistory={handleClearHistory}
              onToggleFavorite={handleToggleFavoriteImage}
              onOpenMultimodalEditModal={handleOpenMultimodalEditModal}
              onOpenImageFusionStudio={handleOpenImageFusionStudio}
              title={uiTexts.imageHistoryDisplayTitle?.textZh || DEFAULT_UI_TEXTS.imageHistoryDisplayTitle.textZh}
            />
          </div>
          
          {/* Right Column: Prompt Builder */}
          <div className="lg:col-span-1 2xl:col-span-2 space-y-6">
            <PromptBuilder
                activeTerms={activeTermsForBuilder}
                onUpdateWeight={updateTermWeight}
                onToggleLock={toggleTermLock}
                onRemoveTerm={handleRemoveTermFromBuilder}
                onClearAllTerms={handleClearAllTerms}
                autoGeneratedPromptEn={autoGeneratedPromptEn}
                autoGeneratedPromptZh={autoGeneratedPromptZh}
                manualPromptEn={manualPromptEn}
                onManualPromptEnChange={setManualPromptEn}
                isPromptEnManual={isPromptEnManual}
                onIsPromptEnManualChange={setIsPromptEnManual}
                manualPromptZh={manualPromptZh}
                onManualPromptZhChange={setManualPromptZh}
                isPromptZhManual={isPromptZhManual}
                onIsPromptZhManualChange={setIsPromptZhManual}
                onPolishPrompt={handlePolishPrompt}
                isPolishingEn={isPolishingEn}
                isPolishingZh={isPolishingZh}
                polishError={polishError}
                clearPolishError={() => setPolishError(null)}
                isGeminiKeyAvailable={!!geminiApiKey}
                title={uiTexts.promptBuilderTitle?.textZh || DEFAULT_UI_TEXTS.promptBuilderTitle.textZh}
                isVisible={isPromptBuilderVisible}
                onToggleVisibility={setIsPromptBuilderVisible}
                onSaveTermFromChip={handleOpenSaveTermModal}
                onOpenQuickAddTermModal={handleOpenQuickAddTermModal}
            />
          </div>
        </div>
        
        {/* Floating Action Buttons */}
        <FloatingScrollToGeneratorButton
            onClick={scrollToImageGenerator}
            title="前往圖像生成區"
        />
        <FloatingAISuggestionsButton
            onClick={handleGetAISuggestions}
            isLoading={isLoadingAiSuggestions}
            disabled={!selectedStyle || !geminiApiKey}
            title={!geminiApiKey ? "Gemini API 金鑰未設定" : (!selectedStyle ? "請先選擇風格" : "獲取 AI 關鍵詞建議")}
        />
        <FloatingCategoriesButton 
            onClick={togglePromptCategoriesModal}
            title="開啟提示詞分類選擇器"
        />

        {/* Modals */}
        {showPromptCategoriesModal && (
            <PromptCategoriesModal
                isOpen={showPromptCategoriesModal}
                onClose={togglePromptCategoriesModal}
                uiTexts={uiTexts}
                relevantCategories={relevantCategories}
                activePromptTerms={activePromptTerms}
                toggleTerm={toggleTerm}
                getAccordionOpenState={getAccordionOpenState}
                handleToggleAccordion={handleToggleAccordion}
                handleExpandAllAccordions={handleExpandAllAccordions}
                handleCollapseAllAccordions={handleCollapseAllAccordions}
                toggleAddCategoryModal={toggleAddCategoryModal}
                handleRandomizeAllPrompts={handleRandomizeAllPrompts}
                isLoadingRandomPrompts={isLoadingRandomPrompts}
                randomPromptsError={randomPromptsError}
                isPromptCategoriesEnabled={isPromptCategoriesEnabled}
                setIsPromptCategoriesEnabled={setIsPromptCategoriesEnabled}
                geminiApiKeySet={!!geminiApiKey}
                selectedStyle={selectedStyle}
                isRoomTypeSelectorEnabled={isRoomTypeSelectorEnabled}
                selectedRoomType={selectedRoomType}
                handleOpenAddCustomTermFromCategoryModal={handleOpenAddCustomTermFromCategoryModal}
                handleDeleteTermFromCategoryAndActive={handleDeleteTermFromCategoryAndActive}
                handleDeletePromptCategoryAndUpdateActive={handleDeletePromptCategoryAndUpdateActive}
            />
        )}
        <AISuggestionsModal
            isOpen={showAiSuggestionsModal}
            onClose={() => setShowAiSuggestionsModal(false)}
            suggestions={aiSuggestedTerms}
            onAddTerm={addAISuggestedTerm}
            activeTerms={activePromptTerms}
            onRegenerate={handleGetAISuggestions}
            isLoadingSuggestions={isLoadingAiSuggestions}
            title={uiTexts.aiSuggestionsModalTitle?.textZh || DEFAULT_UI_TEXTS.aiSuggestionsModalTitle.textZh}
            thinkingProcessMessages={thinkingProcessMessages}
            currentThinkingMessageIndex={currentThinkingMessageIndex}
            error={aiSuggestionError}
        />
        {selectedImageForModal && (
            <ImageDetailModal
            isOpen={!!selectedImageForModal}
            onClose={() => setSelectedImageForModal(null)}
            image={selectedImageForModal}
            currentIndex={selectedImageIndexInSource}
            totalImages={modalImageSourceList.length}
            onNavigate={handleNavigateImageDetail}
            title={uiTexts.imageDetailModalTitle?.textZh || DEFAULT_UI_TEXTS.imageDetailModalTitle.textZh}
            />
        )}
        {showSettingsModal && (
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={toggleSettingsModal}
                ai={ai}
                fillPromptTemplate={fillPromptTemplate}
                imageHistory={imageHistory} 
            />
        )}
        {showAddStyleModal && (
             <AddStyleModal
                isOpen={showAddStyleModal}
                onClose={toggleAddStyleModal}
                onAddStyle={handleAddCustomStyle}
                onTranslateName={handleTranslateNameToEnglish}
                geminiApiKeySet={!!geminiApiKey}
                title={uiTexts.addStyleModalTitle?.textZh || DEFAULT_UI_TEXTS.addStyleModalTitle.textZh}
             />
        )}
        {showAddRoomTypeModal && (
             <AddRoomTypeModal
                isOpen={showAddRoomTypeModal}
                onClose={toggleAddRoomTypeModal}
                onAddRoomType={handleAddCustomRoomType}
                onTranslateTerm={handleTranslateInputForModal} 
                geminiApiKeySet={!!geminiApiKey}
                title={uiTexts.addRoomTypeModalTitle?.textZh || DEFAULT_UI_TEXTS.addRoomTypeModalTitle.textZh}
             />
        )}
        {addCustomTermModalConfig.isOpen && (
            <AddCustomTermModal
                isOpen={addCustomTermModalConfig.isOpen}
                onClose={() => setAddCustomTermModalConfig(prev => ({ ...prev, isOpen: false }))}
                onSave={handleSaveModalData}
                onTranslate={handleTranslateInputForModal}
                initialData={addCustomTermModalConfig.initialData}
                showCategorySelector={addCustomTermModalConfig.showCategorySelector}
                allCategories={processedPromptCategories}
                geminiApiKeySet={!!geminiApiKey}
                modalTitleKey={addCustomTermModalConfig.modalTitleKey}
                onShowAISuggestions={handleFetchAISuggestedCategoryTerms}
            />
        )}
        {showMultimodalEditModal && multimodalEditBaseImage && ai && (
            <MultimodalEditModal
                isOpen={showMultimodalEditModal}
                onClose={() => setShowMultimodalEditModal(false)}
                baseImage={multimodalEditBaseImage}
                ai={ai}
                onImageGenerated={handleImageGenerated}
                uiTexts={{
                    modalTitle: uiTexts.multimodalEditModalTitle.textZh,
                    aiSuggestionButtonLabel: uiTexts.multimodalEditAISuggestionButtonLabel.textZh,
                    multimodalEditUseResultButtonLabel: uiTexts.multimodalEditUseResultButtonLabel.textZh,
                    multimodalEditChineseInstructionLabel: uiTexts.multimodalEditChineseInstructionLabel.textZh,
                    multimodalEditEnglishInstructionLabel: uiTexts.multimodalEditEnglishInstructionLabel.textZh,
                    multimodalEditTranslateToEnButtonLabel: uiTexts.multimodalEditTranslateToEnButtonLabel.textZh,
                    multimodalEditTranslateToZhButtonLabel: uiTexts.multimodalEditTranslateToZhButtonLabel.textZh,
                }}
                systemPromptTemplate={aiSystemPrompts.describeEditedImageForImagen.template}
                fillPromptTemplate={fillPromptTemplate}
                imageGenerationSettings={settings.imageGeneration}
                appContextThemeEn={settings.appContextThemeEn}
                appContextThemeZh={settings.appContextThemeZh}
                aiSystemPrompts={{
                    editInstructionSuggestion: aiSystemPrompts.editInstructionSuggestion,
                    translateToEnglish: aiSystemPrompts.translateToEnglish,
                    translateToChinese: aiSystemPrompts.translateToChinese, 
                }}
                initialAnalyzedKeywords={multimodalEditInitialKeywords}
            />
        )}
        {showImageFusionStudioModal && imageFusionStudioBaseImage && ai && (
          <ImageFusionStudioModal
            isOpen={showImageFusionStudioModal}
            onClose={() => setShowImageFusionStudioModal(false)}
            initialBaseImage={imageFusionStudioBaseImage}
            ai={ai}
            onImageGenerated={handleImageGenerated}
            uiTexts={{
              imageFusionStudioModalTitle: uiTexts.imageFusionStudioModalTitle,
              imageFusionStudioUploadSecondaryButtonLabel: uiTexts.imageFusionStudioUploadSecondaryButtonLabel,
              imageFusionStudioUsageIntentLabel: uiTexts.imageFusionStudioUsageIntentLabel,
              imageFusionStudioGenerateButtonLabel: uiTexts.imageFusionStudioGenerateButtonLabel,
              imageFusionStudioUseResultButtonLabel: uiTexts.imageFusionStudioUseResultButtonLabel,
              imageFusionStudioAISuggestionButtonLabel: uiTexts.imageFusionStudioAISuggestionButtonLabel,
              imageFusionStudioSwapInstructionsButtonTooltip: uiTexts.imageFusionStudioSwapInstructionsButtonTooltip,
              imageFusionStudioImportFromGalleryButtonLabel: uiTexts.imageFusionStudioImportFromGalleryButtonLabel, 
              imageFusionStudioChineseInstructionLabel: uiTexts.imageFusionStudioChineseInstructionLabel, 
              imageFusionStudioEnglishInstructionLabel: uiTexts.imageFusionStudioEnglishInstructionLabel, 
              imageFusionStudioTranslateToEnButtonLabel: uiTexts.imageFusionStudioTranslateToEnButtonLabel, 
              imageFusionStudioTranslateToZhButtonLabel: uiTexts.imageFusionStudioTranslateToZhButtonLabel, 
              imageSelectorModalTitle: uiTexts.imageSelectorModalTitle,
              imageSelectorModalAllTab: uiTexts.imageSelectorModalAllTab,
              imageSelectorModalFavoritesTab: uiTexts.imageSelectorModalFavoritesTab,
              imageSelectorModalNoImages: uiTexts.imageSelectorModalNoImages,
              imageSelectorModalNoFavorites: uiTexts.imageSelectorModalNoFavorites,
              favoriteImageButtonTooltip: uiTexts.favoriteImageButtonTooltip, 
              unfavoriteImageButtonTooltip: uiTexts.unfavoriteImageButtonTooltip, 
            }}
            aiSystemPrompts={{
                imageFusionInstructionSuggestion: aiSystemPrompts.imageFusionInstructionSuggestion,
                translateToEnglish: aiSystemPrompts.translateToEnglish,
                translateToChinese: aiSystemPrompts.translateToChinese,
                imageFusionSlotDescription: aiSystemPrompts.imageFusionSlotDescription,
            }}
            imageGenerationSettings={settings.imageGeneration}
            appContextThemeEn={settings.appContextThemeEn}
            appContextThemeZh={settings.appContextThemeZh}
            fillPromptTemplate={fillPromptTemplate}
            imageHistory={imageHistory}
          />
        )}
        {showSubjectPhraseSuggestionsModal && (
          <SubjectPhraseSuggestionsModal
            isOpen={showSubjectPhraseSuggestionsModal}
            onClose={() => setShowSubjectPhraseSuggestionsModal(false)}
            suggestions={subjectPhraseSuggestions}
            onApplySuggestion={handleApplySubjectPhraseSuggestion}
            isLoadingSuggestions={isLoadingSubjectPhraseSuggestions}
            title={uiTexts.subjectPhraseSuggestionsModalTitle.textZh}
            thinkingProcessMessages={subjectPhraseThinkingMessages}
            currentThinkingMessageIndex={currentSubjectPhraseThinkingIndex}
            error={subjectPhraseSuggestionError}
            onRegenerate={handleFetchSubjectPhraseSuggestions}
          />
        )}
        {showAddCategoryModal && (
            <AddCategoryModal
                isOpen={showAddCategoryModal}
                onClose={toggleAddCategoryModal}
                onAddCategory={handleAddNewCategory}
                existingCategoryIds={Object.keys(customPromptCategorySettings)}
                uiTexts={{ addCategoryModalTitle: uiTexts.addCategoryModalTitle }}
                geminiApiKeySet={!!geminiApiKey}
                ai={ai}
                fillPromptTemplate={fillPromptTemplate}
                aiSystemPrompts={{
                    aiGenerateCategoryID: aiSystemPrompts.aiGenerateCategoryID,
                    translateToEnglish: aiSystemPrompts.translateToEnglish,
                    translateToChinese: aiSystemPrompts.translateToChinese,
                }}
                onTranslateNameForModal={handleTranslateInputForModal}
            />
        )}
        {showAISuggestedCategoryTermsModal && targetCategoryForAISuggestions && (
            <AISuggestedCategoryTermsModal
                isOpen={showAISuggestedCategoryTermsModal}
                onClose={() => { 
                    setShowAISuggestedCategoryTermsModal(false); 
                    setTargetCategoryForAISuggestions(null);
                }}
                targetCategory={targetCategoryForAISuggestions}
                suggestions={aiSuggestedCategoryTerms}
                onAddTerms={handleAddMultipleTermsToCategoryFromModal}
                isLoadingSuggestions={isLoadingAISuggestedCategoryTerms}
                title={uiTexts.aiSuggestedCategoryTermsModalTitle.textZh}
                thinkingProcessMessages={aiSuggestedCategoryTermsThinkingMessages}
                currentThinkingMessageIndex={currentAISuggestedCategoryTermsThinkingIndex}
                error={aiSuggestedCategoryTermsError}
                onRegenerate={handleFetchAISuggestedCategoryTerms}
            />
        )}
      </main>
    </div>
  );
};

const initiateFullAISetup = async (themeInput: string, reportProgress: AISetupProgressCallback, context: SettingsContextType): Promise<{ themeEn: string; themeZh: string } | null> => { 
    if (!process.env.API_KEY) {
        const defaultThemeEn = "Interior Design";
        const defaultThemeZh = "室內設計";
        reportProgress(
            ["Gemini API 金鑰未設定。將使用預設設定。"], 1, 1, true, 
            "Gemini API 金鑰未設定。無法執行AI設定調整。將載入應用程式預設設定。"
        );
        context.updateSettings(prev => ({...prev, appContextThemeEn: defaultThemeEn, appContextThemeZh: defaultThemeZh}));
        context.saveSettings(); // Save default settings if API key is missing
        return { themeEn: defaultThemeEn, themeZh: defaultThemeZh };
    }

    const aiForSetup = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const allThinkingSteps = [
        "重設編輯器內設定為出廠預設...", // Step 1
        `理解產業脈絡: ${themeInput.substring(0, 40)}...`, // Step 2
        "AI 正在生成應用程式主題 (中/英文)...", // Step 3
        "分析 AI 系統提示詞結構...", // Step 4
        "檢閱 UI 文字標籤以進行調整...", // Step 5
        "評估提示詞分類與詞語的主題一致性...", // Step 6
        "評估設計風格的適應性 (名稱、基礎提示詞、清空細節)...", // Step 7
        "評估空間類型的適應性 (名稱)...", // Step 8
        "生成更新後的 JSON 結構草案...", // Step 9
        "最終化設定調整...", // Step 10
        "即將完成 AI 設定更新！", // Step 11
    ];
    const totalProgressSteps = allThinkingSteps.length;
    let currentProgressStepNum = 0;

    try {
        // Step 1: Reset local settings in editor
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps);
        let newSettings = JSON.parse(JSON.stringify(contextInitialAppSettings)) as AppSettings;

        // Step 2: Understand context (visual step)
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps);
        
        const metaPromptTemplateDetails = DEFAULT_AI_SYSTEM_PROMPTS.metaUpdateAllEditableSettings;
        if (!metaPromptTemplateDetails) {
            const errorMsg = "找不到 AI 設定更新的元提示詞模板。";
            reportProgress(allThinkingSteps, currentProgressStepNum, totalProgressSteps, true, errorMsg);
            context.updateSettings(prev => ({...prev, appContextThemeEn: "Interior Design", appContextThemeZh: "室內設計"}));
            context.saveSettings();
            return { themeEn: "Interior Design", themeZh: "室內設計" };
        }
        
        const settingsForAI = JSON.parse(JSON.stringify(contextInitialAppSettings));
        const filledPrompt = fillPromptTemplate(metaPromptTemplateDetails.template, {
            industryContext: themeInput,
            currentAISystemPromptsJSON: JSON.stringify(settingsForAI.aiSystemPrompts),
            currentEditableUITextsJSON: JSON.stringify(settingsForAI.uiTexts),
            currentCustomPromptCategoriesJSON: JSON.stringify(settingsForAI.customPromptCategorySettings),
            currentDesignStylesJSON: JSON.stringify(Array.isArray(settingsForAI.designStyles) ? settingsForAI.designStyles : []), 
            existingStyleNamesJSON: JSON.stringify((newSettings.designStyles || []).map(s => `${s.nameEn} (${s.nameZh})`)),
            currentRoomTypesJSON: JSON.stringify(Array.isArray(settingsForAI.roomTypes) ? settingsForAI.roomTypes : []),
            existingRoomTypeNamesJSON: JSON.stringify((newSettings.roomTypes || []).map(rt => `${rt.termEn} (${rt.termZh})`)),
            availableCategoryIdsJSON: JSON.stringify(Object.keys(settingsForAI.customPromptCategorySettings)),
        }); 

        const response = await aiForSetup.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: filledPrompt,
            config: { responseMimeType: "application/json" }
        });

        const parsedResponse = parseGeminiJsonResponse<{
            updatedAppContextThemeEn?: string; 
            updatedAppContextThemeZh?: string; 
            updatedAISystemPrompts?: AISystemPrompts;
            updatedUITexts?: UITexts; 
            updatedCustomPromptCategories?: CustomPromptCategorySettings;
            updatedDesignStyles?: DesignStyle[];
            updatedRoomTypes?: PromptTerm[]; 
        }>(response.text);

        if (!parsedResponse) throw new Error("AI 返回的設定更新資料格式不正確或無法解析。");
        
        // Step 3: Processing App Context Theme
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedAppContextThemeEn) newSettings.appContextThemeEn = parsedResponse.updatedAppContextThemeEn;
        else newSettings.appContextThemeEn = "Interior Design"; 
        if (parsedResponse.updatedAppContextThemeZh) newSettings.appContextThemeZh = parsedResponse.updatedAppContextThemeZh;
        else newSettings.appContextThemeZh = "室內設計"; 
        
        // Step 4: Analyze AI System Prompts
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedAISystemPrompts) newSettings.aiSystemPrompts = deepMerge(newSettings.aiSystemPrompts, parsedResponse.updatedAISystemPrompts);
        
        // Step 5: Review UI Text Labels
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedUITexts) {
            const originalHeaderTitle = newSettings.uiTexts.headerTitle;
            newSettings.uiTexts = deepMerge(newSettings.uiTexts, parsedResponse.updatedUITexts);
            newSettings.uiTexts.headerTitle = originalHeaderTitle; 
        }

        // Step 6: Assess Prompt Categories
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedCustomPromptCategories) newSettings.customPromptCategorySettings = deepMerge(newSettings.customPromptCategorySettings, parsedResponse.updatedCustomPromptCategories);
        
        // Step 7: Assess Design Styles
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedDesignStyles && Array.isArray(parsedResponse.updatedDesignStyles)) {
            newSettings.designStyles = parsedResponse.updatedDesignStyles.map(styleFromAI => {
                 const originalDefaultStyle = (contextInitialAppSettings.designStyles || []).find(s => s.id === styleFromAI.id);
                return {
                    ...styleFromAI,
                    descriptionEn: "", 
                    descriptionZh: "", 
                    dynamicDetails: [ 
                        { labelEn: "Details 1", labelZh: "細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                        { labelEn: "Details 2", labelZh: "細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                    ] as [DynamicDetailSet, DynamicDetailSet],
                    isCustom: originalDefaultStyle ? originalDefaultStyle.isCustom : true, 
                    relatedCategories: Array.isArray(styleFromAI.relatedCategories) ? styleFromAI.relatedCategories : Object.keys(newSettings.customPromptCategorySettings || {}),
                };
            });
        } else {
            newSettings.designStyles = (contextInitialAppSettings.designStyles || []).map(style => ({
                ...style, descriptionEn: "", descriptionZh: "",
                dynamicDetails: [ 
                    { labelEn: "Details 1", labelZh: "細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                    { labelEn: "Details 2", labelZh: "細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                ] as [DynamicDetailSet, DynamicDetailSet],
            }));
        }

        // Step 8: Assess Room Types
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        if (parsedResponse.updatedRoomTypes && Array.isArray(parsedResponse.updatedRoomTypes)) {
            const defaultRoomTypesSource = settingsForAI.roomTypes || [];
            const rethemedRoomTypes = defaultRoomTypesSource.map(defaultRt => {
                const aiMatch = parsedResponse.updatedRoomTypes!.find(aiRt => aiRt.id === defaultRt.id);
                if (aiMatch && typeof aiMatch.termEn === 'string' && aiMatch.termEn.trim() !== '' && typeof aiMatch.termZh === 'string' && aiMatch.termZh.trim() !== '') {
                    return { ...defaultRt, termEn: aiMatch.termEn, termZh: aiMatch.termZh, isCustom: false };
                }
                return defaultRt;
            });
            newSettings.roomTypes = rethemedRoomTypes;
        } else {
            newSettings.roomTypes = JSON.parse(JSON.stringify(settingsForAI.roomTypes));
        }

        // Step 9: Generate Draft JSON (visual step)
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 

        // Step 10: Finalize Settings (applying to context)
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps); 
        context.updateSettings(newSettings); 
        context.saveSettings(); // Automatically save settings
        
        // Step 11: Final message
        const finalMessage = allThinkingSteps[allThinkingSteps.length - 1];
        reportProgress(allThinkingSteps, ++currentProgressStepNum, totalProgressSteps, false, finalMessage); 
        return { themeEn: newSettings.appContextThemeEn || "Error", themeZh: newSettings.appContextThemeZh || "錯誤" };

    } catch (e: any) {
        const errorDisplayMessage = `AI設定調整失敗: ${e.message || '未知錯誤'}`;
        reportProgress(allThinkingSteps, Math.max(1, currentProgressStepNum), totalProgressSteps, true, errorDisplayMessage);
        context.updateSettings(prev => ({...prev, appContextThemeEn: "Interior Design", appContextThemeZh: "室內設計"}));
        context.saveSettings();
        return { themeEn: "Interior Design", themeZh: "室內設計" };
    }
  };


export const App = () => {
  const [isLoadingInitialSettings, setIsLoadingInitialSettings] = useState(true);
  const [initialThemeEn, setInitialThemeEn] = useState<string | null>(null); 
  const [initialThemeZh, setInitialThemeZh] = useState<string | null>(null); 
  const [showTutorial, setShowTutorial] = useState(false); 

  const handleAISetupComplete = useCallback((themeEnFromLoading: string, themeZhFromLoading: string) => { 
    setInitialThemeEn(themeEnFromLoading); 
    setInitialThemeZh(themeZhFromLoading);
    setShowTutorial(true); 
    setIsLoadingInitialSettings(false);
  }, []);

  const handleConfirmTutorial = () => {
    setShowTutorial(false);
  };
  
  const LoadingScreenWithContext: React.FC<{
    onLoadingComplete: (themeEn: string, themeZh: string) => void;
  }> = ({ onLoadingComplete }) => {
    const context = useContext(SettingsContext);
    if (!context) {
        console.error("SettingsContext not found in LoadingScreenWithContext. This should not happen.");
        return <div className="flex items-center justify-center min-h-screen text-lg text-red-700">嚴重錯誤：設定組件載入失敗！</div>;
    }
    return (
        <LoadingScreen 
            onLoadingComplete={onLoadingComplete} 
            onInitiateAISetup={(themeInput, cb) => initiateFullAISetup(themeInput, cb, context)}
        />
    );
  };

  // Define a component to access context for ConfirmationTutorialPage
  const ConfirmationTutorialPageWithContext: React.FC<{
    theme: string;
    onConfirm: () => void;
  }> = ({ theme, onConfirm }) => {
    const context = useContext(SettingsContext);
    if (!context) {
      console.error("SettingsContext not found in ConfirmationTutorialPageWithContext.");
      return <div className="flex items-center justify-center min-h-screen text-lg text-red-700">嚴重錯誤：確認教學頁面設定載入失敗！</div>;
    }
    return (
      <ConfirmationTutorialPage
        theme={theme}
        onConfirm={onConfirm}
        uiTexts={context.settings.uiTexts}
        appSettings={context.settings}
      />
    );
  };


  if (isLoadingInitialSettings) {
    return (
      <SettingsProvider>
        <LoadingScreenWithContext onLoadingComplete={handleAISetupComplete} />
      </SettingsProvider>
    );
  }

  if (showTutorial && initialThemeEn && initialThemeZh) { 
    return (
      <SettingsProvider>
        <ConfirmationTutorialPageWithContext 
          theme={initialThemeZh} 
          onConfirm={handleConfirmTutorial}
        />
      </SettingsProvider>
    );
  }

  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};
