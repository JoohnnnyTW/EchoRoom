
import { GoogleGenAI } from "@google/genai"; // Added import

export interface PromptTerm {
  id: string;
  termEn: string;
  termZh: string;
  isCustom?: boolean;
  categoryId?: string; // Links term to its category, essential for dynamic terms
}

export interface SelectedPromptTerm extends PromptTerm {
  weight: number;
  locked: boolean;
  // categoryId is inherited and crucial
  order: number;
}

// This now represents the full definition of a category, managed within settings
export interface CustomPromptCategorySetting {
  id: string;
  nameEn: string;
  nameZh: string;
  terms: PromptTerm[];
  isOpenDefault: boolean;
}

// This will be a record of categoryId to its full definition
export interface CustomPromptCategorySettings {
  [categoryId: string]: CustomPromptCategorySetting;
}

export interface DynamicDetailSet {
  labelEn: string;
  labelZh: string;
  termsEn: string[]; // Expects 3 terms
  termsZh: string[]; // Expects 3 terms
}

export interface DesignStyle {
  id:string;
  nameEn: string;
  nameZh: string;
  descriptionEn?: string;
  descriptionZh?: string;
  basePromptEn: string;
  basePromptZh: string;
  relatedCategories: string[]; // Array of category IDs
  isCustom?: boolean;
  dynamicDetails: [DynamicDetailSet, DynamicDetailSet]; // Replaces furnitureBrands and decorTips
}

export interface AIStyleDetails {
  descriptionEn: string;
  descriptionZh: string;
  dynamicDetail1: DynamicDetailSet; // First set of dynamic details
  dynamicDetail2: DynamicDetailSet; // Second set of dynamic details
}

export interface AppGeneratedImage { // Renamed from GeneratedImage
  id: string;
  src: string;
  prompt: string;
}


export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface Candidate {
  content?: {
    parts?: Array<{ text?: string; json?: any }>; // Made parts optional
    role: string;
  };
  finishReason?: string;
  index?: number;
  safetyRatings?: any[];
  groundingMetadata?: GroundingMetadata;
}

export interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: any;
  text: string;
}

export type AISuggestedTerm = PromptTerm; // For existing AI keyword suggestions

export interface AISuggestionItem { // For new subject/edit instruction suggestions
  suggestionEn: string;
  suggestionZh: string;
}

export interface PromptStateForHistory {
  selectedStyleId: string | null;
  selectedRoomTypeId: string | null;
  activeTerms: [string, SelectedPromptTerm][];
  subjectInputEn?: string; 
  subjectInputZh?: string; 
  manualPromptEn?: string; // For Request 6: Store manually edited prompt
  manualPromptZh?: string; // For Request 6
}

export type ImageEngine = 'gemini' | 'bfl_ai' | 'fluxKontextMax'; // Added 'fluxKontextMax'

export interface ImageHistoryEntry extends AppGeneratedImage { // Updated to AppGeneratedImage
  timestamp: number;
  promptState: PromptStateForHistory;
  engine: ImageEngine;
  isFavorite?: boolean; // Added for favorite functionality
  editBaseImageId?: string; // ID of the image this was edited from
  editInstruction?: string; // Text instruction used for editing
  fusionParams?: any; // Parameters used for image fusion
}

// Settings for Image Generation
export type GeminiAspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
export type GeminiOutputMimeType = 'image/jpeg' | 'image/png';

export interface GeminiImageConfig {
  aspectRatio: GeminiAspectRatio;
  outputMimeType: GeminiOutputMimeType;
}

export type BFLAIOutputFormat = 'jpeg' | 'png' | 'webp'; // For FLUX 1.1 Pro

export interface BFLAIImageConfig { // For FLUX 1.1 Pro
  width: number;
  height: number;
  prompt_upsampling: boolean;
  seed: number;
  safety_tolerance: number;
  output_format: BFLAIOutputFormat;
}

export type FluxKontextMaxOutputFormat = 'jpeg' | 'png';
export type FluxKontextMaxAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9' | '9:21'; // Add more if needed

export interface FluxKontextMaxImageConfig {
  aspectRatio: FluxKontextMaxAspectRatio;
  output_format: FluxKontextMaxOutputFormat;
  seed: number | null;
  prompt_upsampling: boolean;
  safety_tolerance: number; // 0-6, limit 2 for image-to-image
}

export interface ImageGenerationSettings {
  gemini: GeminiImageConfig;
  bfl_ai: BFLAIImageConfig; // This is for FLUX 1.1 Pro
  fluxKontextMax: FluxKontextMaxImageConfig; // New
}

// AI System Prompts
export interface AIInteractionPrompt {
  id: string;
  name: string;
  description: string;
  template: string;
  placeholders: string[];
}

export interface AISystemPrompts {
  styleDetails: AIInteractionPrompt;
  aiStyleSetSuggestion: AIInteractionPrompt;
  aiRoomTypeSetSuggestion: AIInteractionPrompt; // New
  translateToEnglish: AIInteractionPrompt;
  translateToChinese: AIInteractionPrompt;
  translateStyleNameToEnglish: AIInteractionPrompt;
  polishPromptEn: AIInteractionPrompt;
  polishPromptZh: AIInteractionPrompt;
  aiTermSuggestions: AIInteractionPrompt; // For general term suggestions based on style, room, and potentially seed text
  randomPromptSelection: AIInteractionPrompt;
  imageAnalysisForPrompts: AIInteractionPrompt;
  metaUpdateAllEditableSettings: AIInteractionPrompt;
  describeEditedImageForImagen: AIInteractionPrompt;
  subjectSuggestion: AIInteractionPrompt; // Specifically for "AI 建議主體內容" button, driven by seed text
  editInstructionSuggestion: AIInteractionPrompt;
  ocrImage: AIInteractionPrompt;
  imageFusionInstructionSuggestion: AIInteractionPrompt;
  imageFusionSlotDescription: AIInteractionPrompt; 
  aiGenerateCategoryID: AIInteractionPrompt; 
  aiCategoryTermSuggestions: AIInteractionPrompt; 
}

// UI Texts
export interface UIText {
  id: string;
  name: string;
  description: string;
  textEn: string;
  textZh: string;
}

export interface UITexts {
  headerTitle: UIText;
  styleSelectorTitle: UIText;
  roomTypeSelectorTitle: UIText;
  roomTypeSetAISuggestionButtonLabel: UIText; 
  subjectInputTitle: UIText;
  imageAnalyzerTitle: UIText;
  analyzeImageButton: UIText;
  uploadImageLabel: UIText;
  promptCategoriesMainTitle: UIText;
  promptBuilderTitle: UIText;
  imageGeneratorTitle: UIText;
  imageHistoryDisplayTitle: UIText;
  settingsModalTitle: UIText;
  addStyleModalTitle: UIText;
  addRoomTypeModalTitle: UIText;
  addCustomTermModalTitle: UIText;
  addCustomTermModalQuickAddTitle: UIText;
  saveTermToCategoryModalTitle: UIText;
  saveTermToCategoryButtonTitle: UIText;
  chipSaveTermButtonLabel: UIText;
  chipCopyToQuickAddButtonTitle: UIText;
  aiSuggestionsModalTitle: UIText;
  imageDetailModalTitle: UIText;
  styleEditorFurnitureBrandsLabel: UIText; 
  styleEditorDecorTipsLabel: UIText;     
  clearHistoryButtonLabel: UIText;
  clearHistoryButtonTooltip: UIText;
  favoriteImageButtonTooltip: UIText;
  unfavoriteImageButtonTooltip: UIText;
  viewFavoritesButtonLabel: UIText;
  favoritesPageTitle: UIText;
  backToMainAppButtonLabel: UIText;
  multimodalEditModalTitle: UIText;
  imageAnalyzerEditButtonLabel: UIText; 
  imageAnalyzerAdvancedEditButtonLabel: UIText; 
  imageAnalyzerOpenFusionStudioButtonLabel: UIText; 
  subjectInputAISuggestionButtonLabel: UIText;
  multimodalEditAISuggestionButtonLabel: UIText;
  multimodalEditUseResultButtonLabel: UIText;
  multimodalEditChineseInstructionLabel: UIText;
  multimodalEditEnglishInstructionLabel: UIText;
  multimodalEditTranslateToEnButtonLabel: UIText;
  multimodalEditTranslateToZhButtonLabel: UIText;
  imageFusionStudioModalTitle: UIText;
  imageFusionStudioUploadSecondaryButtonLabel: UIText;
  imageFusionStudioUsageIntentLabel: UIText;
  imageFusionStudioGenerateButtonLabel: UIText;
  imageFusionStudioUseResultButtonLabel: UIText;
  imageFusionStudioAISuggestionButtonLabel: UIText;
  imageFusionStudioOpenButtonTooltip: UIText;
  imageFusionStudioSwapInstructionsButtonTooltip: UIText;
  imageFusionStudioImportFromGalleryButtonLabel: UIText; 
  // New UI Texts for ImageFusionStudioModal instruction inputs
  imageFusionStudioChineseInstructionLabel: UIText;
  imageFusionStudioEnglishInstructionLabel: UIText;
  imageFusionStudioTranslateToEnButtonLabel: UIText;
  imageFusionStudioTranslateToZhButtonLabel: UIText;
  imageSelectorModalTitle: UIText; 
  imageSelectorModalAllTab: UIText; 
  imageSelectorModalFavoritesTab: UIText; 
  imageSelectorModalNoImages: UIText; 
  imageSelectorModalNoFavorites: UIText; 

  // Cached Profiles
  settingsModalLocalProfilesTabTitle: UIText;
  cachedProfileCardTitle: UIText;
  cachedProfileNameInputLabel: UIText;
  cachedProfileNameInputPlaceholder: UIText;
  cachedProfileUploadThumbnailButtonLabel: UIText;
  cachedProfileSelectThumbnailButtonLabel: UIText;
  cachedProfileSaveButtonLabel: UIText;
  cachedProfileLoadButtonLabel: UIText;
  cachedProfileDeleteButtonLabel: UIText;
  cachedProfileEditNameButtonLabel: UIText;
  cachedProfileChangeThumbnailButtonLabel: UIText;
  cachedProfileConfirmDeleteTitle: UIText;
  cachedProfileConfirmDeleteMessage: UIText;
  cachedProfileLoadSuccessMessage: UIText;
  cachedProfileSaveSuccessMessage: UIText;
  cachedProfileDeleteSuccessMessage: UIText;
  cachedProfileEditNamePrompt: UIText;
  cachedProfileThumbnailLabel: UIText;
  thumbnailSelectorModalTitleLabel: UIText;
  subjectPhraseSuggestionsModalTitle: UIText;
  cachedProfileClearCacheButtonLabel: UIText; 
  cachedProfileConfirmClearCacheMessage: UIText; 
  cachedProfileClearCacheSuccessMessage: UIText; 
  addCategoryModalTitle: UIText; 
  aiSuggestedCategoryTermsModalTitle: UIText; 
}

export interface AddCustomTermModalInitialData {
  termId?: string; 
  termEn?: string;
  termZh?: string;
  preselectCategoryId?: string; 
  categoryNameForDisplay?: string; 
}

export interface AddCustomTermModalOnSaveData {
  termEn: string;
  termZh: string;
  selectedCategoryId: string;
  termIdToUpdate?: string; 
}

export interface AddCustomTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddCustomTermModalOnSaveData) => void;
  onTranslate: (text: string, targetLanguage: 'en' | 'zh') => Promise<string | null>;
  initialData?: AddCustomTermModalInitialData;
  showCategorySelector: boolean;
  allCategories?: PromptCategoryDisplay[];
  geminiApiKeySet: boolean;
  modalTitleKey: keyof Pick<UITexts, 'addCustomTermModalTitle' | 'addCustomTermModalQuickAddTitle' | 'saveTermToCategoryModalTitle'>;
  onShowAISuggestions: (categoryInfo: {id: string, nameEn: string, nameZh: string}, currentTermEn?: string, currentTermZh?: string) => void; // New prop
}


// Combined App Settings
export interface AppSettings {
  imageGeneration: ImageGenerationSettings;
  aiSystemPrompts: AISystemPrompts;
  uiTexts: UITexts;
  customPromptCategorySettings: CustomPromptCategorySettings;
  designStyles: DesignStyle[];
  roomTypes: PromptTerm[];
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
}

// Stored settings for download/upload AND for cached profiles
export interface StoredAppSettings {
  imageGeneration?: Partial<ImageGenerationSettings>;
  aiSystemPrompts?: Partial<AISystemPrompts>; 
  uiTexts?: Partial<UITexts>;
  customPromptCategorySettings?: Partial<CustomPromptCategorySettings>;
  designStyles?: DesignStyle[];
  roomTypes?: PromptTerm[];
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
}


export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettingsOrUpdater: Partial<AppSettings> | ((prevState: AppSettings) => AppSettings)) => void;
  saveSettings: () => void; // Saves current global settings to localStorage
  resetAISystemPrompts: () => void;
  resetImageGenerationSettings: () => void;
  resetUITexts: () => void;
  resetCustomPromptCategorySettings: () => void;
  resetDesignStyles: () => void;
  resetRoomTypes: () => void;
  resetAllSettingsToDefaults: () => void; // Resets global settings to factory defaults
  
  addPromptCategory: (categoryData: Omit<CustomPromptCategorySetting, 'terms' | 'id'> & { id?: string }) => boolean; // id can be optional if AI generates it
  deletePromptCategory: (categoryId: string) => void;
  updateCategoryTerms: (categoryId: string, newTerms: PromptTerm[]) => void;
  addTermToCategory: (term: PromptTerm, categoryId: string) => void;
  addMultipleTermsToCategory: (categoryId: string, terms: PromptTerm[]) => void; 
  updateTermDefinition: (termIdToUpdate: string, updates: Partial<PromptTerm>, newCategoryIdIfMoving?: string) => string | null; 
  deleteTermFromCategory: (termId: string, categoryId: string) => void;
  
  addDesignStyle: (style: DesignStyle) => void;
  updateDesignStyle: (styleId: string, updates: Partial<DesignStyle>) => void;
  deleteDesignStyle: (styleId: string) => void; // New for deleting a whole style
  deleteTermFromStyleDetail: (styleId: string, detailSetIndex: 0 | 1, termIndex: number) => void;
  
  addRoomType: (roomType: PromptTerm) => void;
  updateRoomTypes: (newRoomTypes: PromptTerm[]) => void;
  deleteRoomType: (roomTypeId: string) => void;
  
  setAppContextTheme: (themeEn: string, themeZh: string) => void; // Modified

  // Cached Profiles Management
  cachedProfiles: CachedProfile[];
  addCachedProfile: (name: string, settingsSnapshot: StoredAppSettings, thumbnailDataUrl?: string) => void;
  loadCachedProfileIntoModal: (profileId: string) => StoredAppSettings | null; // Returns settings for modal to use
  deleteCachedProfile: (profileId: string) => void;
  updateCachedProfileThumbnail: (profileId: string, thumbnailDataUrl: string) => void;
  updateCachedProfileName: (profileId: string, newName: string) => void;
  clearAllCachedProfiles: () => void; 
}

export interface PromptCategoryDisplay {
  id: string;
  nameEn: string;
  nameZh: string;
  terms: PromptTerm[];
  isOpen: boolean;
}

export interface AnalyzedImageKeyword {
  termEn: string;
  termZh: string;
}

export interface SelectedPromptTermForChip extends SelectedPromptTerm {
  isCategorized: boolean; 
}

export interface PromptTermChipProps {
  term: SelectedPromptTermForChip;
  onUpdateWeight: (termId: string, delta: number) => void;
  onToggleLock: (termId: string) => void;
  onRemove: (termId: string) => void;
  onSaveTerm?: (term: SelectedPromptTerm) => void;
  onCopyToQuickAdd?: (termEn: string, termZh: string) => void; 
  uiTexts: {
    saveTermToCategoryButtonTitle: string;
    chipSaveTermButtonLabel: string;
    chipCopyToQuickAddButtonTitle: string; 
  };
}

export interface MultimodalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImage: ImageHistoryEntry;
  ai: GoogleGenAI;
  onImageGenerated: (
    image: AppGeneratedImage, 
    engine: ImageEngine,
    editBaseImageId?: string,
    editInstruction?: string
  ) => void;
  uiTexts: {
    modalTitle: string;
    aiSuggestionButtonLabel: string;
    multimodalEditUseResultButtonLabel: string;
    multimodalEditChineseInstructionLabel: string;
    multimodalEditEnglishInstructionLabel: string;
    multimodalEditTranslateToEnButtonLabel: string;
    multimodalEditTranslateToZhButtonLabel: string;
  };
  systemPromptTemplate: string; 
  fillPromptTemplate: (template: string, values: Record<string, string>) => string;
  imageGenerationSettings: ImageGenerationSettings;
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
  aiSystemPrompts: {
      editInstructionSuggestion: AIInteractionPrompt;
      translateToEnglish: AIInteractionPrompt;
      translateToChinese: AIInteractionPrompt; 
  };
  initialAnalyzedKeywords?: AnalyzedImageKeyword[] | null; 
}

export type ImageUsageIntent =
  | 'reference_object'       
  | 'image_merge_1'          
  | 'image_merge_2'          
  | 'style_transfer_target'  
  | 'object_replacement';    

export const IMAGE_USAGE_INTENTS: { value: ImageUsageIntent; labelEn: string; labelZh: string }[] = [
  { value: 'reference_object', labelEn: 'Reference Object', labelZh: '參考對象' },
  { value: 'image_merge_1', labelEn: 'Image Merge (1)', labelZh: '圖像合併(1)' },
  { value: 'image_merge_2', labelEn: 'Image Merge (2)', labelZh: '圖像合併(2)' },
  { value: 'style_transfer_target', labelEn: 'Style Transfer Target', labelZh: '風格遷移目標' },
  { value: 'object_replacement', labelEn: 'Object Replacement', labelZh: '物件替換' },
];

export interface ImageSlotState {
  id: string; 
  file: File | null;
  src: string | null;
  descriptionKeywords: Array<{ keywordEn: string; keywordZh: string }>;
  intent: ImageUsageIntent;
  isLoadingDescription: boolean;
}

export interface ImageFusionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBaseImage: ImageHistoryEntry;
  ai: GoogleGenAI;
  onImageGenerated: ( 
    image: AppGeneratedImage,
    engine: ImageEngine,
    editBaseImageId?: string,
    editInstruction?: string,
    fusionData?: any 
  ) => void;
  uiTexts: Pick<UITexts,
    | 'imageFusionStudioModalTitle'
    | 'imageFusionStudioUploadSecondaryButtonLabel'
    | 'imageFusionStudioUsageIntentLabel'
    | 'imageFusionStudioGenerateButtonLabel'
    | 'imageFusionStudioUseResultButtonLabel'
    | 'imageFusionStudioAISuggestionButtonLabel'
    | 'imageFusionStudioChineseInstructionLabel' 
    | 'imageFusionStudioEnglishInstructionLabel' 
    | 'imageFusionStudioTranslateToEnButtonLabel' 
    | 'imageFusionStudioTranslateToZhButtonLabel' 
    | 'imageFusionStudioSwapInstructionsButtonTooltip'
    | 'imageFusionStudioImportFromGalleryButtonLabel'
    | 'imageSelectorModalTitle'
    | 'imageSelectorModalAllTab'
    | 'imageSelectorModalFavoritesTab'
    | 'imageSelectorModalNoImages'
    | 'imageSelectorModalNoFavorites'
    | 'favoriteImageButtonTooltip' 
    | 'unfavoriteImageButtonTooltip' 
  >;
  aiSystemPrompts: Pick<AISystemPrompts,
    | 'imageFusionInstructionSuggestion'
    | 'translateToEnglish'
    | 'translateToChinese'
    | 'imageFusionSlotDescription'
  >;
  imageGenerationSettings: ImageGenerationSettings;
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
  fillPromptTemplate: (template: string, values: Record<string, string>) => string;
  imageHistory: ImageHistoryEntry[]; 
}

export interface ImageSelectorModalProps { 
    isOpen: boolean;
    onClose: () => void;
    allImageHistory: ImageHistoryEntry[]; 
    onImageSelect: (image: ImageHistoryEntry) => void;
    uiTexts: Pick<UITexts, 
        | 'imageSelectorModalTitle' 
        | 'imageSelectorModalAllTab' 
        | 'imageSelectorModalFavoritesTab'
        | 'imageSelectorModalNoImages'
        | 'imageSelectorModalNoFavorites'
        | 'favoriteImageButtonTooltip'
        | 'unfavoriteImageButtonTooltip'
    >;
}

export interface OCRResult {
    text: string;
    error?: string;
}

export interface ImageAnalyzerProps {
  isEnabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  uiTexts: Pick<UITexts, 
    | 'imageAnalyzerTitle' 
    | 'analyzeImageButton' 
    | 'uploadImageLabel' 
    | 'imageAnalyzerAdvancedEditButtonLabel' 
    | 'imageAnalyzerOpenFusionStudioButtonLabel' 
    | 'imageFusionStudioImportFromGalleryButtonLabel' 
    | 'imageSelectorModalTitle' 
    | 'imageSelectorModalAllTab' 
    | 'imageSelectorModalFavoritesTab'
    | 'imageSelectorModalNoImages'
    | 'imageSelectorModalNoFavorites'
    | 'favoriteImageButtonTooltip'
    | 'unfavoriteImageButtonTooltip'
  >;
  geminiApiKeySet: boolean;
  onOpenMultimodalEditFromAnalyzer: (imageSrc: string, imageFile: File | null, keywords: AnalyzedImageKeyword[] | null) => void; 
  onOpenImageFusionStudioFromAnalyzer: (imageSrc: string, imageFile: File | null) => void; 
  ai: GoogleGenAI | null;
  aiSystemPrompts: Pick<AISystemPrompts, 'imageAnalysisForPrompts' | 'ocrImage'>; // Added ocrImage
  fillPromptTemplate: (template: string, values: Record<string, string>) => string;
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
  onKeywordsExtracted: (keywords: AnalyzedImageKeyword[]) => void;
  onAddAnalyzedKeywordToPrompt: (keyword: AnalyzedImageKeyword) => void;
  imageHistory: ImageHistoryEntry[];
  onImageReadyForContext: (imageSrc: string | null) => void; // Added for SubjectInput OCR context
}

export interface SubjectInputProps {
  subjectEn: string;
  subjectZh: string;
  onSubjectEnChange: (value: string) => void;
  onSubjectZhChange: (value: string) => void;
  aiSuggestionSeedText: string; 
  onAiSuggestionSeedTextChange: (value: string) => void; 
  isEnabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  ai: GoogleGenAI | null;
  geminiApiKeySet: boolean;
  uiTexts: {
    title: string;
    aiSuggestionButtonLabel: string;
    translateToEnglishButton?: string;
    translateToChineseButton?: string;
    enPlaceholder?: string;
    zhPlaceholder?: string;
  };
  fillPromptTemplate: (template: string, values: Record<string, string>) => string;
  aiSystemPrompts: AISystemPrompts; 
  appContextThemeEn?: string; 
  appContextThemeZh?: string; 
  analyzedImageKeywords?: AnalyzedImageKeyword[] | null;
  selectedStyle: DesignStyle | null;
  selectedRoomType: PromptTerm | null;
  isRoomTypeSelectorEnabled: boolean; 
  analyzedImageSrc?: string | null;
  onFetchSubjectPhraseSuggestions: () => void; // New for specific subject phrase suggestions
}

export type AISetupProgressCallback = (
  messages: string[], 
  currentStep: number, 
  totalSteps: number, 
  isError?: boolean, 
  errorMessage?: string
) => void;

export interface LoadingScreenProps {
  onLoadingComplete: (themeEn: string, themeZh: string) => void;
  onInitiateAISetup: (themeInput: string, reportProgress: AISetupProgressCallback) => Promise<{ themeEn: string; themeZh: string } | null>;
}

// SettingsModal related types
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ai: GoogleGenAI | null;
  fillPromptTemplate: (template: string, values: Record<string, string>) => string;
  imageHistory: ImageHistoryEntry[]; // Added for thumbnail selector
}

export interface CachedProfile {
  id: string; // Unique ID for the profile
  name: string; // User-defined name
  settings: StoredAppSettings; // Snapshot of AppSettings
  thumbnailDataUrl?: string; // Base64 data URL for the thumbnail
  createdAt: number; // Timestamp
}

export interface ThumbnailSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageHistory: ImageHistoryEntry[];
  onSelectThumbnail: (imageDataUrl: string) => void;
  uiTexts: Pick<UITexts, 
    | 'thumbnailSelectorModalTitleLabel'
    | 'imageSelectorModalAllTab' 
    | 'imageSelectorModalFavoritesTab'
    | 'imageSelectorModalNoImages'
    | 'imageSelectorModalNoFavorites'
    | 'favoriteImageButtonTooltip'
    | 'unfavoriteImageButtonTooltip'
  >;
}

// For new subject phrase suggestions modal
export interface SubjectPhraseSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AISuggestionItem[];
  onApplySuggestion: (suggestion: AISuggestionItem) => void;
  isLoadingSuggestions: boolean;
  title: string;
  thinkingProcessMessages: string[];
  currentThinkingMessageIndex: number;
  error: string | null;
  onRegenerate: () => void; // Allows regenerating suggestions
}

// RoomTypeSelector props (modified from original request)
export interface RoomTypeSelectorProps {
  roomTypes: PromptTerm[];
  selectedRoomType: PromptTerm | null;
  onSelect: (roomType: PromptTerm | null) => void; // Allow null for deselection
  title: string;
  isEnabled: boolean;
  onToggleEnable: (enabled: boolean) => void;
  onShowAddRoomTypeModal: () => void;
  onGenerateNewRoomTypeSet: () => void; // For AI to suggest a new set of room types
  isLoadingAIRoomTypeSet: boolean;
  aiRoomTypeSetError: string | null;
  geminiApiKeySet: boolean;
  thinkingMessages: string[];
  currentThinkingIndex: number;
  buttonLabelFromAI: string; // Dynamically set by AI
  onDeleteRoomType: (roomTypeId: string) => void;
}

// StyleSelector props
export interface StyleSelectorProps {
  styles: DesignStyle[];
  selectedStyle: DesignStyle | null;
  onSelect: (style: DesignStyle) => void;
  onShowAddStyleModal: () => void;
  title: string;
  onGenerateNewStyleSet: () => void; 
  isLoadingAISuggestedStyles: boolean; 
  aiSuggestedStylesError: string | null; 
  geminiApiKeySet: boolean; 
  thinkingMessages: string[]; 
  currentThinkingIndex: number; 
  onDeleteTermFromDetail: (styleId: string, detailSetIndex: 0 | 1, termIndex: number) => void;
  onDeleteStyle: (styleId: string) => void; // New prop for deleting the style itself
}

export interface PromptCategoryAccordionProps {
  category: PromptCategoryDisplay;
  selectedTerms: Map<string, SelectedPromptTerm>;
  onToggleTerm: (term: PromptTerm, categoryId: string) => void; 
  isOpen: boolean;
  onToggle: () => void;
  onShowAddCustomTermModal: (categoryId: string, categoryName: string) => void;
  onDeleteTerm: (termId: string, categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void; // For deleting the whole category
  onSuggestTermsForCategory?: (category: PromptCategoryDisplay) => void; // New for Issue 4
}

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (data: { id: string; nameEn: string; nameZh: string; isOpenDefault: boolean }) => boolean; 
  existingCategoryIds: string[];
  uiTexts: Pick<UITexts, 'addCategoryModalTitle'>; 
  geminiApiKeySet: boolean; 
  ai: GoogleGenAI | null; 
  fillPromptTemplate: (template: string, values: Record<string, string>) => string; 
  aiSystemPrompts: Pick<AISystemPrompts, 'aiGenerateCategoryID' | 'translateToEnglish' | 'translateToChinese'>; 
  onTranslateNameForModal: (text: string, targetLanguage: 'en' | 'zh') => Promise<string | null>; // New
}

export interface AISuggestedCategoryTermsModalProps { // New for Issue 4
  isOpen: boolean;
  onClose: () => void;
  targetCategory: PromptCategoryDisplay | null;
  suggestions: AISuggestedTerm[];
  onAddTerms: (terms: PromptTerm[], categoryId: string) => void; 
  isLoadingSuggestions: boolean;
  title: string; // e.g., "AI 建議用於 {categoryName}"
  thinkingProcessMessages: string[];
  currentThinkingMessageIndex: number;
  error: string | null;
  onRegenerate: (category: PromptCategoryDisplay) => void;
}
