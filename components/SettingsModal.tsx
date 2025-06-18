
import React, { useState, useContext, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse as GeminiGenerateContentResponse } from "@google/genai";
import { SettingsContext, deepMerge, initialAppSettings as globalInitialAppSettings, FACTORY_DEFAULT_PROFILE_ID } from '../contexts/SettingsContext';
import { 
  AppSettings, ImageGenerationSettings, GeminiImageConfig, BFLAIImageConfig, 
  GeminiAspectRatio, GeminiOutputMimeType, BFLAIOutputFormat, 
  AISystemPrompts, AIInteractionPrompt, UITexts, UIText, 
  CustomPromptCategorySettings, CustomPromptCategorySetting, StoredAppSettings, PromptTerm,
  DesignStyle, AIStyleDetails, FluxKontextMaxImageConfig, FluxKontextMaxAspectRatio, FluxKontextMaxOutputFormat, DynamicDetailSet,
  ImageHistoryEntry, CachedProfile, SettingsModalProps
} from '../types';
import { XCircleIcon, DownloadIcon, UploadIcon, ArrowPathIcon, PlusCircleIcon, TrashIcon, PencilSquareIcon, SparklesIcon, InformationCircleIcon, CheckCircleIcon, PhotoIcon, BookmarkIcon as SaveIcon, EyeIcon as LoadIcon, ExclamationTriangleIcon, SlidersIcon, CubeTransparentIcon } from './Icons'; 
import { LoadingSpinner } from './LoadingSpinner';
import { FileUploadComponent } from './FileUploadComponent';
import { ThumbnailSelectorModal } from './ThumbnailSelectorModal';
import { IconButton } from './IconButton'; 
import { 
  GEMINI_ASPECT_RATIOS, GEMINI_OUTPUT_MIME_TYPES, 
  BFL_AI_OUTPUT_FORMATS, BFL_AI_RESOLUTION_OPTIONS,
  FLUX_KONTEXT_MAX_ASPECT_RATIOS, FLUX_KONTEXT_MAX_OUTPUT_FORMATS, 
  DEFAULT_IMAGE_GENERATION_SETTINGS
} from '../constants/imageGenerationOptions';
import { DEFAULT_AI_SYSTEM_PROMPTS } from '../constants/aiPrompts';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts';
import { DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS } from '../constants/customPromptCategorySettings';
import { DESIGN_STYLES as INITIAL_DESIGN_STYLES_CONST, ROOM_TYPES as INITIAL_ROOM_TYPES_CONST } from '../constants/designData';
import { ensureThreeTerms } from '../utils/arrayUtils';


const APP_SETTINGS_STORAGE_KEY = 'echoRoomAppSettings_v5'; 

interface EditablePromptTerm extends PromptTerm {
  idBeforeEdit?: string;
}

interface ManageCategoryTermsProps {
  category: CustomPromptCategorySetting;
  onUpdateCategory: (updatedCategory: CustomPromptCategorySetting) => void;
  onClose: () => void;
}

const ManageCategoryTermsModal: React.FC<ManageCategoryTermsProps> = ({ category, onUpdateCategory, onClose }) => {
  const [editableTerms, setEditableTerms] = useState<PromptTerm[]>(() => JSON.parse(JSON.stringify(category.terms)));
  const [editingTerm, setEditingTerm] = useState<EditablePromptTerm | null>(null);
  const [newTermEn, setNewTermEn] = useState('');
  const [newTermZh, setNewTermZh] = useState('');
  const [newTermId, setNewTermId] = useState('');

  useEffect(() => {
    setEditableTerms(JSON.parse(JSON.stringify(category.terms)));
  }, [category.terms]);

  const handleAddTerm = () => {
    if (!newTermId.trim() || !newTermEn.trim() || !newTermZh.trim()) {
      alert("新詞語的 ID、英文和中文名稱皆不可為空。");
      return;
    }
    if (editableTerms.find(t => t.id === newTermId.trim())) {
      alert("此 ID 的詞語已存在。請使用唯一的 ID。");
      return;
    }
    const newTerm: PromptTerm = { 
      id: newTermId.trim(), 
      termEn: newTermEn.trim(), 
      termZh: newTermZh.trim(), 
      categoryId: category.id, 
      isCustom: true 
    };
    setEditableTerms(prev => [...prev, newTerm]);
    setNewTermId(''); setNewTermEn(''); setNewTermZh('');
  };

  const handleRemoveTerm = (termIdToRemove: string) => {
    const termToRemove = editableTerms.find(t => t.id === termIdToRemove);
    if (window.confirm(`您確定要刪除詞語 "${termToRemove?.termEn || termIdToRemove}" 嗎？`)) {
      setEditableTerms(currentTerms => currentTerms.filter(term => term.id !== termIdToRemove));
    }
  };

  const handleStartEditTerm = (term: PromptTerm) => setEditingTerm({...term, idBeforeEdit: term.id});

  const handleSaveEditedTerm = () => {
    if (!editingTerm) return;
    if (!editingTerm.id.trim() || !editingTerm.termEn.trim() || !editingTerm.termZh.trim()) {
      alert("詞語 ID、英文和中文名稱不可為空。");
      return;
    }
    
    setEditableTerms(prev => prev.map(t => {
      if (t.id === (editingTerm.idBeforeEdit || editingTerm.id)) {
          const { idBeforeEdit, ...termToSave } = editingTerm;
          return termToSave as PromptTerm;
      }
      return t;
    }));
    setEditingTerm(null);
  };
  
  const handleUpdateAndClose = () => {
    onUpdateCategory({ ...category, terms: editableTerms });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center p-4 z-[90]">
      <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-xl max-h-[85vh] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">管理詞語於 "{category.nameZh}"</h3>
        <div className="mb-4 p-3 border border-gray-200 rounded-md space-y-2 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700">新增詞語</h4>
          <input type="text" placeholder="詞語 ID (唯一)" value={newTermId} onChange={e => setNewTermId(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
          <input type="text" placeholder="英文詞語" value={newTermEn} onChange={e => setNewTermEn(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
          <input type="text" placeholder="中文詞語" value={newTermZh} onChange={e => setNewTermZh(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
          <button onClick={handleAddTerm} className="px-3 py-1.5 text-xs bg-black text-white rounded-md hover:bg-gray-800">新增</button>
        </div>
        {editingTerm && (
          <div className="mb-4 p-3 border border-blue-300 rounded-md space-y-2 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-700">編輯詞語: {editingTerm.idBeforeEdit || editingTerm.id}</h4>
            <input type="text" placeholder="詞語 ID" value={editingTerm.id} onChange={e => setEditingTerm(prev => prev ? {...prev, id: e.target.value} : null)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
            <input type="text" placeholder="英文詞語" value={editingTerm.termEn} onChange={e => setEditingTerm(prev => prev ? {...prev, termEn: e.target.value} : null)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
            <input type="text" placeholder="中文詞語" value={editingTerm.termZh} onChange={e => setEditingTerm(prev => prev ? {...prev, termZh: e.target.value} : null)} className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"/>
            <div className="flex space-x-2">
              <button onClick={handleSaveEditedTerm} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">儲存變更</button>
              <button onClick={() => setEditingTerm(null)} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">取消</button>
            </div>
          </div>
        )}
        <div className="space-y-1.5 overflow-y-auto apple-scroll flex-grow mb-4 pr-1">
          {editableTerms.length === 0 && <p className="text-xs text-gray-500 text-center py-2">此分類尚無詞語。</p>}
          {editableTerms.map(term => (
            <div key={term.id} className="flex items-center justify-between p-2 border border-gray-200 rounded text-xs">
              <div><span className="font-semibold">{term.id}</span>: {term.termEn} / {term.termZh} {term.isCustom && <span className="text-purple-600">(自訂)</span>}</div>
              <div className="space-x-1">
                <button onClick={() => handleStartEditTerm(term)} className="text-blue-600 hover:text-blue-800"><PencilSquareIcon className="w-3.5 h-3.5"/></button>
                <button onClick={() => handleRemoveTerm(term.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-3 border-t border-gray-200 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">關閉 (不儲存詞語)</button>
          <button onClick={handleUpdateAndClose} className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800">完成並儲存詞語</button>
        </div>
      </div>
    </div>
  );
};

interface EditableCustomPromptCategorySetting extends CustomPromptCategorySetting {
  originalId?: string;
}

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

type ActiveSettingsTab = 'localProfiles' | 'fileManagement' | 'imageGen' | 'systemPrompts' | 'uiTexts' | 'categoryManagement' | 'coreContent';

const downloadJson = (data: any, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const readUploadedJsonFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (e) {
        reject(new Error('檔案格式無效或非 JSON 格式。'));
      }
    };
    reader.onerror = () => {
      reject(new Error('讀取檔案時發生錯誤。'));
    };
    reader.readAsText(file);
  });
};


export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  ai, 
  fillPromptTemplate: processTemplateFunction, 
  imageHistory 
}) => {
  const settingsContext = useContext(SettingsContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingCategoryTerms, setEditingCategoryTerms] = useState<CustomPromptCategorySetting | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditableCustomPromptCategorySetting | null>(null);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
  const [newCategoryNameZh, setNewCategoryNameZh] = useState('');
  const [newCategoryIsOpen, setNewCategoryIsOpen] = useState(false);

  const [localIndustryContext, setLocalIndustryContext] = useState('');
  
  const [isMetaUpdatingSettings, setIsMetaUpdatingSettings] = useState(false);
  const [metaUpdateError, setMetaUpdateError] = useState<string | null>(null);
  const [metaUpdateThinkingMessages, setMetaUpdateThinkingMessages] = useState<string[]>([]);
  const [currentMetaUpdateThinkingIndex, setCurrentMetaUpdateThinkingIndex] = useState<number>(0);
  const metaUpdateThinkingIntervalRef = useRef<number | null>(null);


  const [newStyleId, setNewStyleId] = useState('');
  const [newStyleNameEn, setNewStyleNameEn] = useState('');
  const [newStyleNameZh, setNewStyleNameZh] = useState('');
  const [newStyleBasePromptEn, setNewStyleBasePromptEn] = useState('');
  const [newStyleBasePromptZh, setNewStyleBasePromptZh] = useState('');
  const [showAddStyleForm, setShowAddStyleForm] = useState(false);

  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomTypeTermEn, setNewRoomTypeTermEn] = useState('');
  const [newRoomTypeTermZh, setNewRoomTypeTermZh] = useState('');
  const [showAddRoomTypeForm, setShowAddRoomTypeForm] = useState(false);

  
  const [profileName, setProfileName] = useState('');
  const [profileThumbnailDataUrl, setProfileThumbnailDataUrl] = useState<string | undefined>(undefined);
  const [showThumbnailSelectorModal, setShowThumbnailSelectorModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null); 
  const [editingProfileIdForName, setEditingProfileIdForName] = useState<string | null>(null); 
  const [editingProfileNewName, setEditingProfileNewName] = useState<string>('');


  if (!settingsContext) {
    console.error("SettingsContext not found. SettingsModal cannot function.");
    return null; 
  }

  const { 
    settings: currentGlobalSettings, 
    updateSettings, 
    resetAllSettingsToDefaults: contextResetAllSettings,
    cachedProfiles,
    addCachedProfile,
    loadCachedProfileIntoModal,
    deleteCachedProfile,
    updateCachedProfileThumbnail,
    updateCachedProfileName,
    clearAllCachedProfiles, 
  } = settingsContext;
  
  const uiTexts = currentGlobalSettings.uiTexts || DEFAULT_UI_TEXTS;

  const [editableSettings, setEditableSettings] = useState<AppSettings>(() => JSON.parse(JSON.stringify(currentGlobalSettings)));
  const [activeTab, setActiveTab] = useState<ActiveSettingsTab>('localProfiles'); 
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [cachedProfileMessage, setCachedProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  useEffect(() => {
    setEditableSettings(JSON.parse(JSON.stringify(currentGlobalSettings)));
    setLocalIndustryContext(currentGlobalSettings.appContextThemeZh || currentGlobalSettings.appContextThemeEn || ''); 
    if (isOpen) {
        if (metaUpdateThinkingIntervalRef.current) clearInterval(metaUpdateThinkingIntervalRef.current);
        setMetaUpdateThinkingMessages([]);
        setCurrentMetaUpdateThinkingIndex(0);
        setIsMetaUpdatingSettings(false); 
        setMetaUpdateError(null);
        setUploadError(null);
        setUploadSuccessMessage(null);
        setCachedProfileMessage(null);
        setProfileName('');
        setProfileThumbnailDataUrl(undefined);
        setEditingProfileId(null);
        setEditingProfileIdForName(null);
        setEditingProfileNewName('');
    }
  }, [currentGlobalSettings, isOpen]); 

  useEffect(() => {
    return () => {
      if (metaUpdateThinkingIntervalRef.current) {
        clearInterval(metaUpdateThinkingIntervalRef.current);
        metaUpdateThinkingIntervalRef.current = null;
      }
    };
  }, []);

  const handleLocalIndustryContextChange = (value: string) => {
    setLocalIndustryContext(value);
  };


  const handleGeminiChange = <K extends keyof GeminiImageConfig>(key: K, value: GeminiImageConfig[K]) => {
    setEditableSettings(prev => ({ ...prev, imageGeneration: { ...prev.imageGeneration, gemini: { ...prev.imageGeneration.gemini, [key]: value } } }));
  };
  const handleBFLAIResolutionChange = (selectedValue: string) => {
    const selectedOption = BFL_AI_RESOLUTION_OPTIONS.find(opt => opt.value === selectedValue);
    if (selectedOption) {
      setEditableSettings(prev => ({ ...prev, imageGeneration: { ...prev.imageGeneration, bfl_ai: { ...prev.imageGeneration.bfl_ai, width: selectedOption.width, height: selectedOption.height }}}));
    }
  };
  const handleBFLAIChange = <K extends keyof Omit<BFLAIImageConfig, 'width' | 'height'>>(key: K, value: Omit<BFLAIImageConfig, 'width' | 'height'>[K]) => {
    setEditableSettings(prev => ({ ...prev, imageGeneration: { ...prev.imageGeneration, bfl_ai: { ...prev.imageGeneration.bfl_ai, [key]: value }}}));
  };
  const handleFluxKontextMaxChange = <K extends keyof FluxKontextMaxImageConfig>(key: K, value: FluxKontextMaxImageConfig[K]) => {
    setEditableSettings(prev => ({ ...prev, imageGeneration: { ...prev.imageGeneration, fluxKontextMax: { ...prev.imageGeneration.fluxKontextMax, [key]: value } } }));
  };

  const handleSystemPromptChange = (promptId: string, newTemplate: string) => {
    setEditableSettings(prev => ({ ...prev, aiSystemPrompts: { ...prev.aiSystemPrompts, [promptId]: { ...prev.aiSystemPrompts[promptId as keyof AISystemPrompts], template: newTemplate }}}));
  };
  const handleUITextChange = (textIdKey: keyof UITexts, lang: 'textEn' | 'textZh', value: string) => {
    setEditableSettings(prev => ({
        ...prev,
        uiTexts: {
            ...prev.uiTexts,
            [textIdKey]: {
                ...(prev.uiTexts[textIdKey] || DEFAULT_UI_TEXTS[textIdKey]), 
                [lang]: value
            }
        }
    }));
  };
  const handleAddNewCategory = () => {
    if (!newCategoryId.trim() || !newCategoryNameEn.trim() || !newCategoryNameZh.trim()) { alert("分類ID、英文名稱和中文名稱為必填項。"); return; }
    if (editableSettings.customPromptCategorySettings[newCategoryId.trim()]) { alert("此分類ID已存在。請使用唯一的ID。"); return; }
    const newCategory: CustomPromptCategorySetting = { id: newCategoryId.trim(), nameEn: newCategoryNameEn.trim(), nameZh: newCategoryNameZh.trim(), isOpenDefault: newCategoryIsOpen, terms: [] };
    setEditableSettings(prev => ({ ...prev, customPromptCategorySettings: { ...prev.customPromptCategorySettings, [newCategory.id]: newCategory }}));
    setNewCategoryId(''); setNewCategoryNameEn(''); setNewCategoryNameZh(''); setNewCategoryIsOpen(false);
  };
  
  const handleRemoveCategory = (categoryIdToRemove: string) => {
    const categoryName = editableSettings.customPromptCategorySettings[categoryIdToRemove]?.nameZh || categoryIdToRemove;
    if (window.confirm(`您確定要刪除分類 "${categoryName}" 嗎？\n此分類下的所有詞語也將被刪除。\n(此操作會影響目前編輯中的設定，儲存後才會套用至全域)`)) {
      setEditableSettings(currentSettings => { 
        const updatedCategories = { ...currentSettings.customPromptCategorySettings }; 
        delete updatedCategories[categoryIdToRemove]; 
        return { ...currentSettings, customPromptCategorySettings: updatedCategories }; 
      });
    }
  };
  const handleStartEditCategory = (category: CustomPromptCategorySetting) => setEditingCategory({...category, originalId: category.id}); 
  const handleSaveEditedCategory = () => {
    if (!editingCategory) return;
    if (!editingCategory.id.trim() || !editingCategory.nameEn.trim() || !editingCategory.nameZh.trim()) { alert("分類ID、英文名稱和中文名稱不可為空。"); return; }
    setEditableSettings(prev => {
      const updatedCategories = { ...prev.customPromptCategorySettings };
      if (editingCategory.originalId && editingCategory.id !== editingCategory.originalId) {
        if (updatedCategories[editingCategory.id]) { alert("新的分類 ID 與現有分類衝突。請選擇唯一的 ID。"); return prev; }
        delete updatedCategories[editingCategory.originalId];
      }
      const { originalId, ...categoryToSave } = editingCategory;
      updatedCategories[categoryToSave.id] = categoryToSave as CustomPromptCategorySetting;
      return { ...prev, customPromptCategorySettings: updatedCategories };
    });
    setEditingCategory(null);
  };
  const handleUpdateCategoryWithTerms = (updatedCategory: CustomPromptCategorySetting) => {
    setEditableSettings(prev => ({ ...prev, customPromptCategorySettings: { ...prev.customPromptCategorySettings, [updatedCategory.id]: updatedCategory }}));
  };

  const handleDesignStyleFieldChange = (styleId: string, field: keyof Pick<DesignStyle, 'id' | 'nameEn' | 'nameZh' | 'descriptionEn' | 'descriptionZh' | 'basePromptEn' | 'basePromptZh' | 'relatedCategories'>, value: any) => {
    setEditableSettings(prev => ({
      ...prev,
      designStyles: (Array.isArray(prev.designStyles) ? prev.designStyles : []).map(style =>
        style.id === styleId ? { ...style, [field]: value, isCustom: true } : style
      )
    }));
  };

  const handleDesignStyleDynamicDetailChange = (styleId: string, detailIndex: 0 | 1, termLang: 'termsEn' | 'termsZh', commaSeparatedValue: string) => {
    setEditableSettings(prev => ({
        ...prev,
        designStyles: (prev.designStyles || []).map(style => {
            if (style.id === styleId) {
                const newDynamicDetails = [...style.dynamicDetails] as [DynamicDetailSet, DynamicDetailSet];
                const termsArray = commaSeparatedValue.split(',').map(s => s.trim());
                newDynamicDetails[detailIndex] = {
                    ...newDynamicDetails[detailIndex],
                    [termLang]: ensureThreeTerms(termsArray)
                };
                return { ...style, dynamicDetails: newDynamicDetails, isCustom: true };
            }
            return style;
        })
    }));
  };

  const handleDesignStyleDynamicDetailLabelChange = (styleId: string, detailIndex: 0 | 1, lang: 'labelEn' | 'labelZh', value: string) => {
      setEditableSettings(prev => ({
          ...prev,
          designStyles: (prev.designStyles || []).map(style => {
              if (style.id === styleId) {
                  const newDynamicDetails = [...style.dynamicDetails] as [DynamicDetailSet, DynamicDetailSet];
                  newDynamicDetails[detailIndex] = {
                      ...newDynamicDetails[detailIndex],
                      [lang]: value
                  };
                  return { ...style, dynamicDetails: newDynamicDetails, isCustom: true };
              }
              return style;
          })
      }));
  };


  const handleAddNewDesignStyle = () => {
    if (!newStyleId.trim() || !newStyleNameEn.trim() || !newStyleNameZh.trim() || !newStyleBasePromptEn.trim() || !newStyleBasePromptZh.trim()) {
        alert("新風格的ID、中英文名稱及中英文基礎提示詞皆不可為空。"); return;
    }
    const currentDesignStyles = Array.isArray(editableSettings.designStyles) ? editableSettings.designStyles : [];
    if (currentDesignStyles.find(s => s.id === newStyleId.trim())) {
        alert("此風格ID已存在。請使用唯一的ID。"); return;
    }
    const newStyle: DesignStyle = {
        id: newStyleId.trim(),
        nameEn: newStyleNameEn.trim(),
        nameZh: newStyleNameZh.trim(),
        basePromptEn: newStyleBasePromptEn.trim(),
        basePromptZh: newStyleBasePromptZh.trim(),
        descriptionEn: '', descriptionZh: '',
        dynamicDetails: [
            { labelEn: "Suggested Details 1", labelZh: "建議細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
            { labelEn: "Suggested Details 2", labelZh: "建議細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
        ] as [DynamicDetailSet, DynamicDetailSet],
        relatedCategories: Object.keys(editableSettings.customPromptCategorySettings), 
        isCustom: true,
    };
    setEditableSettings(prev => ({ ...prev, designStyles: [...currentDesignStyles, newStyle] }));
    setNewStyleId(''); setNewStyleNameEn(''); setNewStyleNameZh(''); setNewStyleBasePromptEn(''); setNewStyleBasePromptZh('');
    setShowAddStyleForm(false);
  };

  const handleRemoveDesignStyle = (styleIdToRemove: string) => {
    const stylesArray = Array.isArray(editableSettings.designStyles) ? editableSettings.designStyles : [];
    const styleName = stylesArray.find(s => s.id === styleIdToRemove)?.nameZh || styleIdToRemove;

    if (window.confirm(`您確定要刪除風格 "${styleName}" 嗎？`)) {
        setEditableSettings(currentSettings => {
            const currentStyles = Array.isArray(currentSettings.designStyles) ? currentSettings.designStyles : [];
            const newStyles = currentStyles.filter(style => style.id !== styleIdToRemove);
            return {
                ...currentSettings,
                designStyles: newStyles
            };
        });
    }
  };
  
  const handleRoomTypeFieldChange = (roomTypeId: string, field: keyof PromptTerm, value: any) => {
    setEditableSettings(prev => ({
      ...prev,
      roomTypes: (Array.isArray(prev.roomTypes) ? prev.roomTypes : []).map(roomType =>
        roomType.id === roomTypeId ? { ...roomType, [field]: value, isCustom: true } : roomType
      )
    }));
  };

  const handleAddNewRoomType = () => {
    if (!newRoomTypeId.trim() || !newRoomTypeTermEn.trim() || !newRoomTypeTermZh.trim()) {
        alert("新空間類型的ID、英文提示詞和中文提示詞皆不可為空。"); return;
    }
    const currentRoomTypes = Array.isArray(editableSettings.roomTypes) ? editableSettings.roomTypes : [];
    if (currentRoomTypes.find(rt => rt.id === newRoomTypeId.trim())) {
        alert("此空間類型ID已存在。請使用唯一的ID。"); return;
    }
    const newRoomType: PromptTerm = {
        id: newRoomTypeId.trim(),
        termEn: newRoomTypeTermEn.trim(),
        termZh: newRoomTypeTermZh.trim(),
        isCustom: true,
    };
    setEditableSettings(prev => ({ ...prev, roomTypes: [...currentRoomTypes, newRoomType] }));
    setNewRoomTypeId(''); setNewRoomTypeTermEn(''); setNewRoomTypeTermZh('');
    setShowAddRoomTypeForm(false);
  };

  const handleRemoveRoomType = (roomTypeIdToRemove: string) => {
    const roomTypesArray = Array.isArray(editableSettings.roomTypes) ? editableSettings.roomTypes : [];
    const roomTypeName = roomTypesArray.find(rt => rt.id === roomTypeIdToRemove)?.termZh || roomTypeIdToRemove;

     if (window.confirm(`您確定要刪除空間類型 "${roomTypeName}" 嗎？`)) {
        setEditableSettings(currentSettings => {
            const currentRoomTypes = Array.isArray(currentSettings.roomTypes) ? currentSettings.roomTypes : [];
            const newRoomTypes = currentRoomTypes.filter(rt => rt.id !== roomTypeIdToRemove);
            return {
                ...currentSettings,
                roomTypes: newRoomTypes
            };
        });
    }
  };


  const handleMetaUpdateAllEditableSettingsInModal = async () => { 
    if (!ai) { setMetaUpdateError("Gemini AI 客戶端未初始化。"); return; }
    const currentTheme = localIndustryContext; 
    if (!currentTheme.trim()) { setMetaUpdateError("請輸入產業類別或生圖需求。"); return; }

    setIsMetaUpdatingSettings(true);
    setMetaUpdateError(null);
    if (metaUpdateThinkingIntervalRef.current) clearInterval(metaUpdateThinkingIntervalRef.current);

    setEditableSettings(JSON.parse(JSON.stringify(globalInitialAppSettings)));
    
    const settingsForAI = JSON.parse(JSON.stringify(globalInitialAppSettings)); 

    const contextPreview = currentTheme.length > 50 ? currentTheme.substring(0, 47) + "..." : currentTheme;
    let baseSteps = [
        `重設編輯器內設定為出廠預設...`,
        `理解產業脈絡: ${contextPreview}`,
        "AI 正在生成應用程式主題 (中/英文)...",
        "分析 AI 系統提示詞結構...",
        "檢閱 UI 文字標籤以進行調整...",
        "評估提示詞分類與詞語的主題一致性...",
        "評估設計風格的適應性 (名稱、基礎提示詞、清空細節)...", 
        "評估空間類型的適應性 (名稱)...",
    ];
    
    const finalSteps = [
        "生成更新後的 JSON 結構草案...",
        "最終化設定調整...",
        "即將完成 AI 設定更新！"
    ];

    let currentVisibleSteps = [...baseSteps, ...finalSteps];
    setMetaUpdateThinkingMessages(currentVisibleSteps);
    setCurrentMetaUpdateThinkingIndex(0); 

    metaUpdateThinkingIntervalRef.current = window.setInterval(() => {
        setCurrentMetaUpdateThinkingIndex(prevIndex => {
            if (prevIndex < currentVisibleSteps.length - 1) {
                return prevIndex + 1;
            }
            return prevIndex; 
        });
    }, 1200);

    setCurrentMetaUpdateThinkingIndex(1); 

    const metaPromptTemplateDetails = DEFAULT_AI_SYSTEM_PROMPTS.metaUpdateAllEditableSettings;
    if (!metaPromptTemplateDetails) {
      setMetaUpdateError("找不到 AI 設定更新的元提示詞模板。");
      setIsMetaUpdatingSettings(false);
      if (metaUpdateThinkingIntervalRef.current) clearInterval(metaUpdateThinkingIntervalRef.current);
      return;
    }
    
    const filledPrompt = processTemplateFunction(metaPromptTemplateDetails.template, {
      industryContext: currentTheme,
      currentAISystemPromptsJSON: JSON.stringify(settingsForAI.aiSystemPrompts),
      currentEditableUITextsJSON: JSON.stringify(settingsForAI.uiTexts),
      currentCustomPromptCategoriesJSON: JSON.stringify(settingsForAI.customPromptCategorySettings),
      currentDesignStylesJSON: JSON.stringify(Array.isArray(settingsForAI.designStyles) ? settingsForAI.designStyles : []), 
      existingStyleNamesJSON: JSON.stringify((editableSettings.designStyles || []).map(s => `${s.nameEn} (${s.nameZh})`)),
      currentRoomTypesJSON: JSON.stringify(Array.isArray(settingsForAI.roomTypes) ? settingsForAI.roomTypes : []),
      existingRoomTypeNamesJSON: JSON.stringify((editableSettings.roomTypes || []).map(rt => `${rt.termEn} (${rt.termZh})`)),
      availableCategoryIdsJSON: JSON.stringify(Object.keys(settingsForAI.customPromptCategorySettings)),
    }); 
    
    try {
      const response: GeminiGenerateContentResponse = await ai.models.generateContent({
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

      if (!parsedResponse) {
        throw new Error("AI 返回的設定更新資料格式不正確或無法解析。");
      }
      
      setEditableSettings(prevModalSettings => {
          let newModalSettings = JSON.parse(JSON.stringify(globalInitialAppSettings)); 
          
          if(parsedResponse.updatedAppContextThemeEn) newModalSettings.appContextThemeEn = parsedResponse.updatedAppContextThemeEn;
          if(parsedResponse.updatedAppContextThemeZh) newModalSettings.appContextThemeZh = parsedResponse.updatedAppContextThemeZh;

          if (parsedResponse.updatedAISystemPrompts) newModalSettings.aiSystemPrompts = deepMerge(newModalSettings.aiSystemPrompts, parsedResponse.updatedAISystemPrompts) as AISystemPrompts;
          if (parsedResponse.updatedUITexts) {
              const originalHeaderTitle = newModalSettings.uiTexts.headerTitle;
              newModalSettings.uiTexts = deepMerge(newModalSettings.uiTexts, parsedResponse.updatedUITexts) as UITexts;
              newModalSettings.uiTexts.headerTitle = originalHeaderTitle;
          }
          if (parsedResponse.updatedCustomPromptCategories) newModalSettings.customPromptCategorySettings = deepMerge(newModalSettings.customPromptCategorySettings, parsedResponse.updatedCustomPromptCategories) as CustomPromptCategorySettings;
          
          if (parsedResponse.updatedRoomTypes && Array.isArray(parsedResponse.updatedRoomTypes)) {
              const defaultRoomTypesSource = settingsForAI.roomTypes || [];
              const rethemedRoomTypes = defaultRoomTypesSource.map(defaultRt => {
                  const aiMatch = parsedResponse.updatedRoomTypes!.find(aiRt => aiRt.id === defaultRt.id);
                  if (aiMatch && typeof aiMatch.termEn === 'string' && aiMatch.termEn.trim() !== '' && typeof aiMatch.termZh === 'string' && aiMatch.termZh.trim() !== '') {
                      return { ...defaultRt, termEn: aiMatch.termEn, termZh: aiMatch.termZh, isCustom: false };
                  }
                  return defaultRt;
              });
              newModalSettings.roomTypes = rethemedRoomTypes;
          } else {
              newModalSettings.roomTypes = JSON.parse(JSON.stringify(settingsForAI.roomTypes));
          }

          if (parsedResponse.updatedDesignStyles && Array.isArray(parsedResponse.updatedDesignStyles)) {
              newModalSettings.designStyles = parsedResponse.updatedDesignStyles.map(styleFromAI => {
                  const originalDefaultStyle = (globalInitialAppSettings.designStyles || []).find(s => s.id === styleFromAI.id);
                  return {
                      ...styleFromAI,
                      descriptionEn: "", 
                      descriptionZh: "", 
                      dynamicDetails: [ 
                          { labelEn: "Details 1", labelZh: "細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                          { labelEn: "Details 2", labelZh: "細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                      ] as [DynamicDetailSet, DynamicDetailSet],
                      isCustom: originalDefaultStyle ? originalDefaultStyle.isCustom : true,
                      relatedCategories: Array.isArray(styleFromAI.relatedCategories) ? styleFromAI.relatedCategories : Object.keys(newModalSettings.customPromptCategorySettings || {}),
                  };
              });
          } else {
              newModalSettings.designStyles = (globalInitialAppSettings.designStyles || []).map(style => ({
                  ...style,
                  descriptionEn: "", descriptionZh: "",
                  dynamicDetails: [ 
                      { labelEn: "Details 1", labelZh: "細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
                      { labelEn: "Details 2", labelZh: "細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
                  ] as [DynamicDetailSet, DynamicDetailSet],
              }));
          }
          
          setLocalIndustryContext(newModalSettings.appContextThemeZh || newModalSettings.appContextThemeEn || '');
          return newModalSettings;
      });
      setCurrentMetaUpdateThinkingIndex(currentVisibleSteps.length - 1);
      if (metaUpdateThinkingIntervalRef.current) clearInterval(metaUpdateThinkingIntervalRef.current);
      setMetaUpdateThinkingMessages(prev => [...prev, "AI 設定更新完成！"]);
    } catch (e: any) {
      console.error("Meta update all settings error:", e);
      setMetaUpdateError(`AI 更新設定失敗: ${e.message || '未知錯誤'}`);
      if (metaUpdateThinkingIntervalRef.current) clearInterval(metaUpdateThinkingIntervalRef.current);
    } finally {
      setIsMetaUpdatingSettings(false);
    }
  };


  const handleSaveChanges = () => {
    const settingsToSave: AppSettings = {
        ...editableSettings,
        appContextThemeEn: localIndustryContext && editableSettings.appContextThemeEn ? editableSettings.appContextThemeEn : globalInitialAppSettings.appContextThemeEn,
        appContextThemeZh: localIndustryContext && editableSettings.appContextThemeZh ? editableSettings.appContextThemeZh : globalInitialAppSettings.appContextThemeZh,
    };
    if (!localIndustryContext.trim()) {
        settingsToSave.appContextThemeEn = globalInitialAppSettings.appContextThemeEn;
        settingsToSave.appContextThemeZh = globalInitialAppSettings.appContextThemeZh;
    }

    updateSettings(settingsToSave);
    settingsContext.saveSettings(); 
    onClose();
  };

  const handleResetCurrentTabToGlobal = () => {
    setEditableSettings(prevEditable => {
      const currentGlobal = JSON.parse(JSON.stringify(currentGlobalSettings));
      switch (activeTab) {
        case 'imageGen': return { ...prevEditable, imageGeneration: currentGlobal.imageGeneration };
        case 'systemPrompts': return { ...prevEditable, aiSystemPrompts: currentGlobal.aiSystemPrompts };
        case 'uiTexts': return { ...prevEditable, uiTexts: currentGlobal.uiTexts };
        case 'categoryManagement': return { ...prevEditable, customPromptCategorySettings: currentGlobal.customPromptCategorySettings };
        case 'coreContent': 
            return { 
                ...prevEditable, 
                designStyles: currentGlobal.designStyles, 
                roomTypes: currentGlobal.roomTypes,
                appContextThemeEn: currentGlobal.appContextThemeEn,
                appContextThemeZh: currentGlobal.appContextThemeZh,
            };
        default: return prevEditable;
      }
    });
  };
  
  const handleResetCurrentTabToFactoryDefault = () => {
    setEditableSettings(prevEditable => {
      const factoryDefaults = JSON.parse(JSON.stringify(globalInitialAppSettings));
      switch (activeTab) {
        case 'imageGen': return { ...prevEditable, imageGeneration: factoryDefaults.imageGeneration };
        case 'systemPrompts': return { ...prevEditable, aiSystemPrompts: factoryDefaults.aiSystemPrompts };
        case 'uiTexts': return { ...prevEditable, uiTexts: factoryDefaults.uiTexts };
        case 'categoryManagement': return { ...prevEditable, customPromptCategorySettings: factoryDefaults.customPromptCategorySettings };
        case 'coreContent': 
            setLocalIndustryContext(factoryDefaults.appContextThemeZh || factoryDefaults.appContextThemeEn || '');
            return { 
                ...prevEditable, 
                designStyles: factoryDefaults.designStyles, 
                roomTypes: factoryDefaults.roomTypes,
                appContextThemeEn: factoryDefaults.appContextThemeEn,
                appContextThemeZh: factoryDefaults.appContextThemeZh,
            };
        default: return prevEditable;
      }
    });
  };

  const handleResetAllToFactoryDefault = () => {
    if (window.confirm("您確定要將所有設定重設為出廠預設值嗎？此操作將清除所有自訂內容。")) {
      const factoryDefaults = JSON.parse(JSON.stringify(globalInitialAppSettings));
      setEditableSettings(factoryDefaults);
      setLocalIndustryContext(factoryDefaults.appContextThemeZh || factoryDefaults.appContextThemeEn || '');
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccessMessage(null);
    const file = event.target.files?.[0];
    if (file) {
      try {
        const uploadedData = await readUploadedJsonFile(file);
        const mergedWithInitial = deepMerge(JSON.parse(JSON.stringify(globalInitialAppSettings)), uploadedData) as AppSettings;
        
        setEditableSettings(mergedWithInitial);
        setLocalIndustryContext(mergedWithInitial.appContextThemeZh || mergedWithInitial.appContextThemeEn || '');
        
        setUploadSuccessMessage(`成功上傳並載入設定檔： ${file.name}`);
      } catch (e: any) {
        setUploadError(e.message || '上傳設定檔失敗。');
        console.error("File upload error:", e);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleDownloadSettings = () => {
    downloadJson(editableSettings, `EchoRoom_Settings_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleSaveCurrentToProfile = () => {
    if (!profileName.trim()) {
      setCachedProfileMessage({ type: 'error', text: '請為設定檔輸入一個名稱。' });
      return;
    }
    addCachedProfile(profileName, JSON.parse(JSON.stringify(editableSettings)), profileThumbnailDataUrl);
    setCachedProfileMessage({ type: 'success', text: `設定檔 "${profileName}" 已成功儲存。` });
    setProfileName('');
    setProfileThumbnailDataUrl(undefined); 
    setTimeout(() => setCachedProfileMessage(null), 3000);
  };

  const handleLoadProfile = (profileId: string) => {
    const settingsToLoad = loadCachedProfileIntoModal(profileId);
    if (settingsToLoad) {
      const merged = deepMerge(JSON.parse(JSON.stringify(globalInitialAppSettings)), settingsToLoad) as AppSettings;
      setEditableSettings(merged);
      setLocalIndustryContext(merged.appContextThemeZh || merged.appContextThemeEn || '');
      const profileDisplayName = profileId === FACTORY_DEFAULT_PROFILE_ID ? "出廠預設" : cachedProfiles.find(p => p.id === profileId)?.name || profileId;
      setCachedProfileMessage({ type: 'success', text: `設定檔「${profileDisplayName}」已載入至編輯器。檢閱後請點擊「儲存並關閉」以套用。`});
    } else {
      setCachedProfileMessage({ type: 'error', text: `無法載入設定檔 ID: ${profileId}。` });
    }
    setTimeout(() => setCachedProfileMessage(null), 4000);
  };

  const handleDeleteProfile = (profileId: string) => {
    const profileToDelete = cachedProfiles.find(p => p.id === profileId);
    if (window.confirm(uiTexts.cachedProfileConfirmDeleteMessage.textZh.replace('{profileName}', profileToDelete?.name || profileId))) {
      deleteCachedProfile(profileId);
      setCachedProfileMessage({ type: 'success', text: uiTexts.cachedProfileDeleteSuccessMessage.textZh.replace('{profileName}', profileToDelete?.name || profileId) });
      setTimeout(() => setCachedProfileMessage(null), 3000);
    }
  };

  const handleEditProfileName = (profileId: string, currentName: string) => {
    setEditingProfileIdForName(profileId);
    setEditingProfileNewName(currentName);
  };

  const handleSaveProfileName = () => {
    if (editingProfileIdForName && editingProfileNewName.trim()) {
        updateCachedProfileName(editingProfileIdForName, editingProfileNewName.trim());
        setCachedProfileMessage({ type: 'success', text: `設定檔名稱已更新為 "${editingProfileNewName.trim()}"。` });
        setEditingProfileIdForName(null);
        setEditingProfileNewName('');
        setTimeout(() => setCachedProfileMessage(null), 3000);
    }
  };

  const handleSelectThumbnail = (dataUrl: string) => {
    setProfileThumbnailDataUrl(dataUrl);
    if (editingProfileId) {
        updateCachedProfileThumbnail(editingProfileId, dataUrl);
        setCachedProfileMessage({ type: 'success', text: `設定檔代表圖已更新。` });
        setEditingProfileId(null); 
        setTimeout(() => setCachedProfileMessage(null), 3000);
    }
    setShowThumbnailSelectorModal(false);
  };

  const handleChangeThumbnailForProfile = (profileId: string) => {
    setEditingProfileId(profileId); 
    setShowThumbnailSelectorModal(true);
  };
  
  const handleClearAllLocalProfiles = () => {
    if (window.confirm(uiTexts.cachedProfileConfirmClearCacheMessage.textZh)) {
        clearAllCachedProfiles();
        setCachedProfileMessage({type: 'success', text: uiTexts.cachedProfileClearCacheSuccessMessage.textZh});
        setTimeout(() => setCachedProfileMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'localProfiles':
        return (
            <div className="space-y-4">
                {cachedProfileMessage && (
                    <div className={`p-2 rounded-md text-xs ${cachedProfileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {cachedProfileMessage.text}
                    </div>
                )}
                <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/80 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">{uiTexts.cachedProfileSaveButtonLabel.textZh}</h4>
                    <input 
                        type="text" 
                        placeholder={uiTexts.cachedProfileNameInputPlaceholder.textZh}
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)} 
                        className="w-full p-1.5 border border-gray-300 rounded-md text-xs bg-white text-black"
                    />
                    <div className="text-xs text-gray-600 mb-1">{uiTexts.cachedProfileThumbnailLabel.textZh}:</div>
                     {profileThumbnailDataUrl && <img src={profileThumbnailDataUrl} alt="縮圖預覽" className="w-24 h-24 object-cover rounded border border-gray-200"/>}
                    <div className="flex space-x-2">
                        <button onClick={() => setShowThumbnailSelectorModal(true)} className="px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 flex items-center">
                            <PhotoIcon className="w-3.5 h-3.5 mr-1"/>{uiTexts.cachedProfileSelectThumbnailButtonLabel.textZh}
                        </button>
                        {profileThumbnailDataUrl && (
                            <button onClick={() => setProfileThumbnailDataUrl(undefined)} className="px-2.5 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50">清除代表圖</button>
                        )}
                    </div>
                    <button onClick={handleSaveCurrentToProfile} className="w-full px-3 py-1.5 text-xs bg-black text-white rounded-md hover:bg-gray-800 flex items-center justify-center">
                        <SaveIcon className="w-3.5 h-3.5 mr-1"/>儲存目前編輯器設定至本機
                    </button>
                </div>
                
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-gray-800">已快取的設定檔 ({cachedProfiles.length + 1})</h4>
                     {cachedProfiles.length > 0 && (
                        <button onClick={handleClearAllLocalProfiles} className="px-2.5 py-1 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center">
                            <TrashIcon className="w-3.5 h-3.5 mr-1"/>{uiTexts.cachedProfileClearCacheButtonLabel.textZh}
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto apple-scroll space-y-2 pr-1 -mr-1">
                    
                    <div className="p-2.5 border border-dashed border-gray-400 rounded-lg bg-gray-100 flex items-center justify-between">
                        <div className="flex-grow">
                            <span className="font-medium text-xs text-gray-700">出廠預設設定</span>
                            <span className="block text-[10px] text-gray-500">應用程式的初始預設值。</span>
                        </div>
                         <button onClick={() => handleLoadProfile(FACTORY_DEFAULT_PROFILE_ID)} className="ml-2 px-2 py-1 text-[10px] border border-gray-300 rounded-md hover:bg-gray-200 flex items-center">
                            <LoadIcon className="w-3 h-3 mr-1"/>載入預設
                        </button>
                    </div>

                    {cachedProfiles.map(profile => (
                        <div key={profile.id} className="p-2.5 border border-gray-200 rounded-lg bg-white flex items-start justify-between space-x-2">
                            <div className="flex-shrink-0">
                                {profile.thumbnailDataUrl ? (
                                    <img src={profile.thumbnailDataUrl} alt={profile.name} className="w-16 h-16 object-cover rounded border border-gray-100"/>
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded border border-gray-100 flex items-center justify-center text-gray-400"><PhotoIcon className="w-8 h-8"/></div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                {editingProfileIdForName === profile.id ? (
                                    <div className="flex items-center space-x-1">
                                        <input 
                                            type="text" 
                                            value={editingProfileNewName} 
                                            onChange={e => setEditingProfileNewName(e.target.value)} 
                                            className="flex-grow p-1 border border-gray-300 rounded-md text-[11px] bg-white"
                                            onKeyDown={e => e.key === 'Enter' && handleSaveProfileName()}
                                        />
                                        <IconButton onClick={handleSaveProfileName} aria-label="儲存名稱" title="儲存名稱" className="text-green-600 hover:bg-green-50"><CheckCircleIcon className="w-4 h-4"/></IconButton>
                                        <IconButton onClick={() => setEditingProfileIdForName(null)} aria-label="取消編輯" title="取消" className="text-gray-500 hover:bg-gray-100"><XCircleIcon className="w-4 h-4"/></IconButton>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <span className="font-medium text-xs text-gray-700 truncate" title={profile.name}>{profile.name}</span>
                                        <IconButton onClick={() => handleEditProfileName(profile.id, profile.name)} aria-label="編輯名稱" title="編輯名稱" className="ml-1 text-gray-500 hover:text-black text-xs p-0.5"><PencilSquareIcon className="w-3 h-3"/></IconButton>
                                    </div>
                                )}
                                <span className="block text-[10px] text-gray-500">建立於: {new Date(profile.createdAt).toLocaleDateString()}</span>
                                <div className="text-[10px] text-gray-500">主題: {profile.settings.appContextThemeZh || profile.settings.appContextThemeEn || '未指定'}</div>
                            </div>
                            <div className="flex flex-col items-end space-y-1 flex-shrink-0 text-[10px]">
                                <button onClick={() => handleLoadProfile(profile.id)} className="px-2 py-0.5 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"><LoadIcon className="w-3 h-3 mr-0.5"/>載入</button>
                                <button onClick={() => handleChangeThumbnailForProfile(profile.id)} className="px-2 py-0.5 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"><PhotoIcon className="w-3 h-3 mr-0.5"/>換圖</button>
                                <button onClick={() => handleDeleteProfile(profile.id)} className="px-2 py-0.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center"><TrashIcon className="w-3 h-3 mr-0.5"/>刪除</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'fileManagement':
        return (
          <div className="space-y-4">
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:text-gray-800 hover:border-gray-400">
              <UploadIcon className="w-5 h-5 mr-2"/> 上傳設定檔 (.json)
            </button>
            <input type="file" accept=".json" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
            {uploadError && <p className="text-xs text-red-500 p-1.5 bg-red-50 border border-red-200 rounded">{uploadError}</p>}
            {uploadSuccessMessage && <p className="text-xs text-green-600 p-1.5 bg-green-50 border border-green-200 rounded">{uploadSuccessMessage}</p>}
            
            <button onClick={handleDownloadSettings} className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100">
              <DownloadIcon className="w-5 h-5 mr-2"/> 下載目前編輯器設定
            </button>
            <hr className="my-4 border-gray-200"/>
             <button onClick={handleResetAllToFactoryDefault} className="w-full px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1.5"/> 將編輯器內所有設定重設為出廠預設值
            </button>
          </div>
        );
      case 'imageGen':
        return (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-sm font-medium mb-1">Gemini (Imagen 3)</h4>
              <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-0.5">長寬比:</label>
                    <select value={editableSettings.imageGeneration.gemini.aspectRatio} onChange={e => handleGeminiChange('aspectRatio', e.target.value as GeminiAspectRatio)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                      {GEMINI_ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-0.5">輸出格式:</label>
                    <select value={editableSettings.imageGeneration.gemini.outputMimeType} onChange={e => handleGeminiChange('outputMimeType', e.target.value as GeminiOutputMimeType)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                      {GEMINI_OUTPUT_MIME_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
              </div>
            </div>
             <div>
              <h4 className="text-sm font-medium mb-1">BFL.ai (FLUX 1.1 Pro)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block mb-0.5">解析度:</label>
                    <select value={`${editableSettings.imageGeneration.bfl_ai.width}x${editableSettings.imageGeneration.bfl_ai.height}`} onChange={e => handleBFLAIResolutionChange(e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                        {BFL_AI_RESOLUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-0.5">輸出格式:</label>
                    <select value={editableSettings.imageGeneration.bfl_ai.output_format} onChange={e => handleBFLAIChange('output_format', e.target.value as BFLAIOutputFormat)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                        {BFL_AI_OUTPUT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="flex items-center">
                        <input type="checkbox" checked={editableSettings.imageGeneration.bfl_ai.prompt_upsampling} onChange={e => handleBFLAIChange('prompt_upsampling', e.target.checked)} className="mr-1.5 h-3.5 w-3.5"/>
                        啟用提示詞放大 (Prompt Upsampling)
                    </label>
                </div>
                 <div>
                    <label className="block mb-0.5">隨機種子 (Seed):</label>
                    <input type="number" value={editableSettings.imageGeneration.bfl_ai.seed} onChange={e => handleBFLAIChange('seed', parseInt(e.target.value))} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                </div>
                 <div>
                    <label className="block mb-0.5">安全容忍度 (Safety Tolerance, 0-6):</label>
                    <input type="number" min="0" max="6" step="1" value={editableSettings.imageGeneration.bfl_ai.safety_tolerance} onChange={e => handleBFLAIChange('safety_tolerance', parseInt(e.target.value))} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                </div>
              </div>
            </div>
             <div>
              <h4 className="text-sm font-medium mb-1">BFL.ai (Flux Kontext Max)</h4>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block mb-0.5">長寬比:</label>
                    <select value={editableSettings.imageGeneration.fluxKontextMax.aspectRatio} onChange={e => handleFluxKontextMaxChange('aspectRatio', e.target.value as FluxKontextMaxAspectRatio)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                      {FLUX_KONTEXT_MAX_ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-0.5">輸出格式:</label>
                    <select value={editableSettings.imageGeneration.fluxKontextMax.output_format} onChange={e => handleFluxKontextMaxChange('output_format', e.target.value as FluxKontextMaxOutputFormat)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black">
                      {FLUX_KONTEXT_MAX_OUTPUT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                 <div className="col-span-2">
                    <label className="flex items-center">
                        <input type="checkbox" checked={editableSettings.imageGeneration.fluxKontextMax.prompt_upsampling} onChange={e => handleFluxKontextMaxChange('prompt_upsampling', e.target.checked)} className="mr-1.5 h-3.5 w-3.5"/>
                        啟用提示詞放大 (Prompt Upsampling)
                    </label>
                </div>
                 <div>
                    <label className="block mb-0.5">隨機種子 (Seed, 可留空):</label>
                    <input type="number" value={editableSettings.imageGeneration.fluxKontextMax.seed ?? ''} onChange={e => handleFluxKontextMaxChange('seed', e.target.value === '' ? null : parseInt(e.target.value))} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                </div>
                 <div>
                    <label className="block mb-0.5">安全容忍度 (Safety Tolerance, 0-6, 圖像編輯上限2):</label>
                    <input type="number" min="0" max="6" step="1" value={editableSettings.imageGeneration.fluxKontextMax.safety_tolerance} onChange={e => handleFluxKontextMaxChange('safety_tolerance', parseInt(e.target.value))} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                </div>
               </div>
            </div>
          </div>
        );
      case 'systemPrompts':
        return (
          <div className="space-y-3 text-xs">
            {Object.entries(editableSettings.aiSystemPrompts).map(([key, prompt]) => (
              <div key={key} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                <label className="block text-sm font-medium mb-1 text-gray-700">{prompt.name}</label>
                <p className="text-[10px] text-gray-500 mb-1">{prompt.description}</p>
                <textarea
                  value={prompt.template}
                  onChange={e => handleSystemPromptChange(key, e.target.value)}
                  rows={4}
                  className="w-full p-1 border border-gray-300 rounded-md bg-white text-black font-mono text-[10px] leading-snug"
                />
              </div>
            ))}
          </div>
        );
      case 'uiTexts':
        return (
          <div className="space-y-3 text-xs">
            {Object.entries(editableSettings.uiTexts).map(([key, uiText]) => (
              <div key={key} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                <label className="block text-sm font-medium mb-0.5 text-gray-700">{uiText.name} <span className="text-gray-400 text-[10px]">({uiText.id})</span></label>
                <p className="text-[10px] text-gray-500 mb-1">{uiText.description}</p>
                <div className="grid grid-cols-2 gap-1.5">
                    <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-0.5">英文 (textEn):</label>
                        <input type="text" value={uiText.textEn} onChange={e => handleUITextChange(key as keyof UITexts, 'textEn', e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-0.5">繁中 (textZh):</label>
                        <input type="text" value={uiText.textZh} onChange={e => handleUITextChange(key as keyof UITexts, 'textZh', e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                    </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'categoryManagement':
        return (
          <div className="space-y-3 text-xs">
             <div className="p-2 border border-blue-300 rounded-md bg-blue-50 space-y-1.5">
                <h4 className="text-sm font-medium text-blue-700">新增分類</h4>
                <input type="text" placeholder="分類ID (英文，唯一)" value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                <input type="text" placeholder="英文名稱" value={newCategoryNameEn} onChange={e => setNewCategoryNameEn(e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                <input type="text" placeholder="中文名稱" value={newCategoryNameZh} onChange={e => setNewCategoryNameZh(e.target.value)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                <label className="flex items-center text-gray-700"><input type="checkbox" checked={newCategoryIsOpen} onChange={e => setNewCategoryIsOpen(e.target.checked)} className="mr-1.5 h-3.5 w-3.5"/>預設展開</label>
                <button onClick={handleAddNewCategory} className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><PlusCircleIcon className="w-3.5 h-3.5 mr-1"/>新增</button>
            </div>
            {editingCategory && (
                <div className="p-2 border border-green-300 rounded-md bg-green-50 space-y-1.5">
                    <h4 className="text-sm font-medium text-green-700">編輯分類: {editingCategory.originalId}</h4>
                    <input type="text" placeholder="分類ID" value={editingCategory.id} onChange={e => setEditingCategory(prev => prev ? {...prev, id: e.target.value} : null)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                    <input type="text" placeholder="英文名稱" value={editingCategory.nameEn} onChange={e => setEditingCategory(prev => prev ? {...prev, nameEn: e.target.value} : null)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                    <input type="text" placeholder="中文名稱" value={editingCategory.nameZh} onChange={e => setEditingCategory(prev => prev ? {...prev, nameZh: e.target.value} : null)} className="w-full p-1 border border-gray-300 rounded-md bg-white text-black"/>
                    <label className="flex items-center text-gray-700"><input type="checkbox" checked={editingCategory.isOpenDefault} onChange={e => setEditingCategory(prev => prev ? {...prev, isOpenDefault: e.target.checked} : null)} className="mr-1.5 h-3.5 w-3.5"/>預設展開</label>
                    <div className="flex space-x-1.5">
                        <button onClick={handleSaveEditedCategory} className="px-2.5 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">儲存</button>
                        <button onClick={() => setEditingCategory(null)} className="px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">取消</button>
                    </div>
                </div>
            )}
            {Object.values(editableSettings.customPromptCategorySettings).map(category => (
              <div key={category.id} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">{category.nameZh} ({category.nameEn}) <span className="text-gray-400 text-[10px]">ID: {category.id}</span></span>
                    <div className="space-x-1">
                        <IconButton onClick={() => setEditingCategoryTerms(category)} aria-label="管理詞語" title="管理詞語" className="text-blue-600 p-0.5"><SlidersIcon className="w-3.5 h-3.5"/></IconButton>
                        <IconButton onClick={() => handleStartEditCategory(category)} aria-label="編輯分類" title="編輯分類" className="text-green-600 p-0.5"><PencilSquareIcon className="w-3.5 h-3.5"/></IconButton>
                        <IconButton onClick={() => handleRemoveCategory(category.id)} aria-label="刪除分類" title="刪除分類" className="text-red-600 p-0.5"><TrashIcon className="w-3.5 h-3.5"/></IconButton>
                    </div>
                </div>
                <p className="text-[10px] text-gray-500">預設展開: {category.isOpenDefault ? '是' : '否'}, 詞語數量: {category.terms.length}</p>
              </div>
            ))}
          </div>
        );
      case 'coreContent':
        return (
          <div className="space-y-4 text-xs">
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/80">
                 <h4 className="text-sm font-semibold text-gray-800 mb-2">應用程式主題與AI設定</h4>
                 <div className="mb-2">
                    <label className="block mb-0.5 text-gray-600">產業類別或生圖需求 (將影響AI為您調整的內容):</label>
                    <input 
                        type="text" 
                        value={localIndustryContext} 
                        onChange={e => handleLocalIndustryContextChange(e.target.value)}
                        className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-black"
                        placeholder="例如：室內設計、科幻遊戲美術、產品攝影..."
                    />
                </div>
                <button 
                    onClick={handleMetaUpdateAllEditableSettingsInModal} 
                    disabled={isMetaUpdatingSettings || !ai || !localIndustryContext.trim()}
                    className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    title={!ai ? "Gemini AI 未設定" : (!localIndustryContext.trim() ? "請先輸入產業類別" : "讓 AI 智慧調整設定")}
                >
                    {isMetaUpdatingSettings ? <LoadingSpinner className="w-3.5 h-3.5 mr-1"/> : <SparklesIcon className="w-3.5 h-3.5 mr-1"/>}
                    {isMetaUpdatingSettings ? "AI 調整中..." : "AI 智慧重設下方內容 (實驗性)"}
                </button>
                 {metaUpdateError && !isMetaUpdatingSettings && (
                    <div className="mt-1.5 p-1.5 bg-red-50 border border-red-200 rounded text-red-700 flex items-center">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1 shrink-0"/>{metaUpdateError}
                    </div>
                 )}
                 {isMetaUpdatingSettings && metaUpdateThinkingMessages.length > 0 && (
                    <div className="mt-1.5 p-1.5 border border-gray-200 rounded bg-white">
                        {metaUpdateThinkingMessages.map((msg, idx) => (
                            <div key={idx} className={`flex items-center transition-opacity duration-300 ${idx <= currentMetaUpdateThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                                {idx < currentMetaUpdateThinkingIndex || (idx === metaUpdateThinkingMessages.length - 1 && (metaUpdateThinkingMessages[metaUpdateThinkingMessages.length - 1] && metaUpdateThinkingMessages[metaUpdateThinkingMessages.length - 1].includes("完成"))) ? <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 shrink-0"/> 
                                 : idx === currentMetaUpdateThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1 text-blue-500 shrink-0"/> 
                                 : <div className="w-3 h-3 mr-1 shrink-0 border border-gray-300 rounded-full"/>}
                                <span className={`${idx === currentMetaUpdateThinkingIndex && !(metaUpdateThinkingMessages[metaUpdateThinkingMessages.length - 1] && metaUpdateThinkingMessages[metaUpdateThinkingMessages.length - 1].includes("完成")) ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{msg}</span>
                            </div>
                        ))}
                    </div>
                 )}
            </div>

            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/80">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">設計風格</h4>
                <button onClick={() => setShowAddStyleForm(true)} className="mb-1.5 px-2.5 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"><PlusCircleIcon className="w-3.5 h-3.5 mr-1"/>新增風格</button>
                {showAddStyleForm && (
                    <div className="p-2 border border-green-200 rounded-md bg-green-50 space-y-1 mb-2">
                         <input type="text" placeholder="ID (英文唯一)" value={newStyleId} onChange={e=>setNewStyleId(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <input type="text" placeholder="英文名稱" value={newStyleNameEn} onChange={e=>setNewStyleNameEn(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <input type="text" placeholder="中文名稱" value={newStyleNameZh} onChange={e=>setNewStyleNameZh(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <textarea placeholder="英文基礎提示詞" value={newStyleBasePromptEn} onChange={e=>setNewStyleBasePromptEn(e.target.value)} rows={2} className="w-full p-1 border rounded bg-white text-[10px]"/>
                         <textarea placeholder="中文基礎提示詞" value={newStyleBasePromptZh} onChange={e=>setNewStyleBasePromptZh(e.target.value)} rows={2} className="w-full p-1 border rounded bg-white text-[10px]"/>
                         <div className="flex gap-1.5">
                            <button onClick={handleAddNewDesignStyle} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">確認新增</button>
                            <button onClick={() => setShowAddStyleForm(false)} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">取消</button>
                         </div>
                    </div>
                )}
                {(Array.isArray(editableSettings.designStyles) ? editableSettings.designStyles : []).map(style => (
                    <div key={style.id} className="p-1.5 border-b border-gray-100 last:border-b-0">
                        <div className="flex justify-between items-center">
                           <span className="font-medium text-gray-700">{style.nameZh} ({style.nameEn})</span>
                           <IconButton onClick={() => handleRemoveDesignStyle(style.id)} aria-label="刪除風格" title="刪除風格" className="text-red-500 p-0.5"><TrashIcon className="w-3 h-3"/></IconButton>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-0.5">
                            <input type="text" placeholder="風格ID" value={style.id} onChange={e => handleDesignStyleFieldChange(style.id, 'id', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                            {/* ... more fields ... */}
                            <input type="text" placeholder="相關分類ID (逗號分隔)" value={(Array.isArray(style.relatedCategories) ? style.relatedCategories : []).join(',')} onChange={e => handleDesignStyleFieldChange(style.id, 'relatedCategories', e.target.value.split(',').map(s=>s.trim()))} className="w-full p-0.5 border rounded bg-white text-[10px] col-span-2"/>
                            <textarea placeholder="英文描述" value={style.descriptionEn} onChange={e => handleDesignStyleFieldChange(style.id, 'descriptionEn', e.target.value)} rows={1} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                            <textarea placeholder="中文描述" value={style.descriptionZh} onChange={e => handleDesignStyleFieldChange(style.id, 'descriptionZh', e.target.value)} rows={1} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                            <textarea placeholder="英文基礎提示詞" value={style.basePromptEn} onChange={e => handleDesignStyleFieldChange(style.id, 'basePromptEn', e.target.value)} rows={1} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                            <textarea placeholder="中文基礎提示詞" value={style.basePromptZh} onChange={e => handleDesignStyleFieldChange(style.id, 'basePromptZh', e.target.value)} rows={1} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                            
                            {style.dynamicDetails.map((detail, index) => (
                                <div key={index} className="col-span-2 mt-0.5 p-1 border-t border-gray-200/50">
                                    <div className="grid grid-cols-2 gap-0.5">
                                        <input type="text" placeholder={`細節${index+1} 英文標籤`} value={detail.labelEn} onChange={e => handleDesignStyleDynamicDetailLabelChange(style.id, index as 0|1, 'labelEn', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                                        <input type="text" placeholder={`細節${index+1} 中文標籤`} value={detail.labelZh} onChange={e => handleDesignStyleDynamicDetailLabelChange(style.id, index as 0|1, 'labelZh', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                                    </div>
                                    <textarea placeholder={`細節${index+1} 英文詞語 (3個,逗號分隔)`} value={detail.termsEn.join(', ')} onChange={e => handleDesignStyleDynamicDetailChange(style.id, index as 0|1, 'termsEn', e.target.value)} rows={1} className="mt-0.5 w-full p-0.5 border rounded bg-white text-[10px]"/>
                                    <textarea placeholder={`細節${index+1} 中文詞語 (3個,逗號分隔)`} value={detail.termsZh.join(', ')} onChange={e => handleDesignStyleDynamicDetailChange(style.id, index as 0|1, 'termsZh', e.target.value)} rows={1} className="mt-0.5 w-full p-0.5 border rounded bg-white text-[10px]"/>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/80">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">{uiTexts.roomTypeSelectorTitle.textZh}</h4>
                <button onClick={() => setShowAddRoomTypeForm(true)} className="mb-1.5 px-2.5 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"><PlusCircleIcon className="w-3.5 h-3.5 mr-1"/>新增類型</button>
                {showAddRoomTypeForm && (
                     <div className="p-2 border border-green-200 rounded-md bg-green-50 space-y-1 mb-2">
                         <input type="text" placeholder="ID (英文唯一)" value={newRoomTypeId} onChange={e=>setNewRoomTypeId(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <input type="text" placeholder="英文提示詞" value={newRoomTypeTermEn} onChange={e=>setNewRoomTypeTermEn(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <input type="text" placeholder="中文提示詞" value={newRoomTypeTermZh} onChange={e=>setNewRoomTypeTermZh(e.target.value)} className="w-full p-1 border rounded bg-white"/>
                         <div className="flex gap-1.5">
                            <button onClick={handleAddNewRoomType} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">確認新增</button>
                            <button onClick={() => setShowAddRoomTypeForm(false)} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">取消</button>
                         </div>
                    </div>
                )}
                {(Array.isArray(editableSettings.roomTypes) ? editableSettings.roomTypes : []).map(rt => (
                     <div key={rt.id} className="p-1.5 border-b border-gray-100 last:border-b-0">
                        <div className="flex justify-between items-center">
                           <span className="font-medium text-gray-700">{rt.termZh} ({rt.termEn})</span>
                           <IconButton onClick={() => handleRemoveRoomType(rt.id)} aria-label="刪除類型" title="刪除類型" className="text-red-500 p-0.5"><TrashIcon className="w-3 h-3"/></IconButton>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-0.5">
                             <input type="text" placeholder="ID" value={rt.id} onChange={e => handleRoomTypeFieldChange(rt.id, 'id', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                             <input type="text" placeholder="英文提示詞" value={rt.termEn} onChange={e => handleRoomTypeFieldChange(rt.id, 'termEn', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                             <input type="text" placeholder="中文提示詞" value={rt.termZh} onChange={e => handleRoomTypeFieldChange(rt.id, 'termZh', e.target.value)} className="w-full p-0.5 border rounded bg-white text-[10px]"/>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        );
      default: return null;
    }
  };
  
  const tabs: {id: ActiveSettingsTab; label: string; icon: React.FC<{className?: string}>}[] = [
    { id: 'localProfiles', label: uiTexts.settingsModalLocalProfilesTabTitle.textZh, icon: SaveIcon },
    { id: 'fileManagement', label: '檔案管理', icon: DownloadIcon },
    { id: 'imageGen', label: '圖像生成參數', icon: PhotoIcon },
    { id: 'systemPrompts', label: 'AI 系統提示詞', icon: SparklesIcon },
    { id: 'uiTexts', label: 'UI 文字標籤', icon: PencilSquareIcon },
    { id: 'categoryManagement', label: '提示詞分類管理', icon: SlidersIcon },
    { id: 'coreContent', label: '核心內容設定', icon: CubeTransparentIcon },
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-[60] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="settings-modal-title" className="text-lg font-semibold text-gray-800">
            {uiTexts.settingsModalTitle.textZh}
          </h2>
          <IconButton onClick={onClose} aria-label="關閉設定" className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-7 h-7" />
          </IconButton>
        </div>
        
        <div className="flex flex-grow overflow-hidden">
          {/* Tabs Navigation */}
          <div className="w-48 border-r border-gray-200 p-3 space-y-1 bg-gray-50/70 overflow-y-auto apple-scroll">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-medium rounded-md text-left transition-colors
                                ${activeTab === tab.id ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                    <Icon className="w-4 h-4 flex-shrink-0"/>
                    <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-grow p-4 overflow-y-auto apple-scroll relative">
            <div className="absolute top-3 right-3 flex space-x-1.5">
                <IconButton onClick={handleResetCurrentTabToGlobal} title="將此分頁重設為目前已套用設定" aria-label="重設此分頁為目前已套用設定" className="text-xs p-1 bg-gray-100 hover:bg-gray-200">
                   <ArrowPathIcon className="w-3.5 h-3.5"/>
                </IconButton>
                <IconButton onClick={handleResetCurrentTabToFactoryDefault} title="將此分頁重設為出廠預設值" aria-label="重設此分頁為出廠預設值" className="text-xs p-1 bg-orange-100 hover:bg-orange-200">
                   <ExclamationTriangleIcon className="w-3.5 h-3.5 text-orange-600"/>
                </IconButton>
            </div>
            {renderTabContent()}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100">
            取消 (不儲存編輯)
          </button>
          <button type="button" onClick={handleSaveChanges} className="px-4 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-800">
            儲存編輯並關閉
          </button>
        </div>
      </div>
      {editingCategoryTerms && (
        <ManageCategoryTermsModal 
            category={editingCategoryTerms}
            onUpdateCategory={handleUpdateCategoryWithTerms}
            onClose={() => setEditingCategoryTerms(null)}
        />
      )}
      {showThumbnailSelectorModal && (
        <ThumbnailSelectorModal
            isOpen={showThumbnailSelectorModal}
            onClose={() => { setShowThumbnailSelectorModal(false); setEditingProfileId(null); }}
            imageHistory={imageHistory}
            onSelectThumbnail={handleSelectThumbnail}
            uiTexts={uiTexts}
        />
      )}
    </div>
  );
};
