
export interface PromptTerm {
  id: string;
  termEn: string;
  termZh: string;
  isCustom?: boolean; 
  categoryId?: string; // Added for custom terms to know their category
}

export interface SelectedPromptTerm extends PromptTerm { 
  weight: number;
  locked: boolean;
  categoryId: string; // Already here, good.
  order: number; 
}

export interface PromptCategory {
  id: string;
  nameEn: string;
  nameZh: string;
  terms: PromptTerm[]; 
  isOpen?: boolean; 
}

export interface DesignStyle {
  id:string;
  nameEn: string;
  nameZh: string;
  descriptionEn?: string; 
  descriptionZh?: string; 
  furnitureBrandsEn?: string[]; 
  furnitureBrandsZh?: string[]; 
  decorTipsEn?: string[]; 
  decorTipsZh?: string[]; 
  basePromptEn: string; 
  basePromptZh: string; 
  relatedCategories: string[]; 
  isCustom?: boolean; 
}

export interface AIStyleDetails {
  descriptionEn: string;
  descriptionZh: string;
  furnitureBrandsEn: string[];
  furnitureBrandsZh: string[];
  decorTipsEn: string[];
  decorTipsZh: string[];
}

export interface GeneratedImage {
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
    parts: { text?: string; json?: any }[]; 
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

export type AISuggestedTerm = PromptTerm; 

export interface PromptStateForHistory {
  selectedStyleId: string | null;
  selectedRoomTypeId: string | null;
  activeTerms: [string, SelectedPromptTerm][]; 
}

export type ImageEngine = 'gemini' | 'bfl_ai';

export interface ImageHistoryEntry extends GeneratedImage {
  timestamp: number;
  promptState: PromptStateForHistory;
  engine: ImageEngine;
}

// Settings for Image Generation
export type GeminiAspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
export type GeminiOutputMimeType = 'image/jpeg' | 'image/png';

export interface GeminiImageConfig {
  aspectRatio: GeminiAspectRatio;
  outputMimeType: GeminiOutputMimeType;
}

export type BFLAIOutputFormat = 'jpeg' | 'png' | 'webp';

export interface BFLAIImageConfig {
  width: number;
  height: number;
  prompt_upsampling: boolean;
  seed: number;
  safety_tolerance: number; 
  output_format: BFLAIOutputFormat;
}

export interface ImageGenerationSettings {
  gemini: GeminiImageConfig;
  bfl_ai: BFLAIImageConfig;
}

export interface SettingsContextType {
  settings: ImageGenerationSettings;
  updateSettings: (newSettings: Partial<ImageGenerationSettings>) => void;
  saveSettings: () => void;
}
