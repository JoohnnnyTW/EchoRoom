
import { GeminiAspectRatio, GeminiOutputMimeType, BFLAIOutputFormat, GeminiImageConfig, BFLAIImageConfig, ImageGenerationSettings } from '../types';

export const GEMINI_ASPECT_RATIOS: GeminiAspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '3:4', '3:2', '2:3'];
export const GEMINI_OUTPUT_MIME_TYPES: GeminiOutputMimeType[] = ['image/jpeg', 'image/png'];

export const BFL_AI_OUTPUT_FORMATS: BFLAIOutputFormat[] = ['jpeg', 'png', 'webp'];

// Define the new BFL.ai resolution options
export const BFL_AI_RESOLUTION_OPTIONS: Array<{ label: string; width: number; height: number; value: string }> = [
  { label: '16:9 (1440x806)', width: 1440, height: 806, value: '1440x806' },
  { label: '9:16 (806x1440)', width: 806, height: 1440, value: '806x1440' },
  { label: '1:1 (1440x1440)', width: 1440, height: 1440, value: '1440x1440' },
  { label: '4:3 (1408x1056)', width: 1408, height: 1056, value: '1408x1056' },
  { label: '3:4 (1056x1408)', width: 1056, height: 1408, value: '1056x1408' },
  { label: '3:2 (1440x960)', width: 1440, height: 960, value: '1440x960' },
  { label: '2:3 (960x1440)', width: 960, height: 1440, value: '960x1440' },
];

export const DEFAULT_GEMINI_CONFIG: GeminiImageConfig = {
  aspectRatio: '16:9',
  outputMimeType: 'image/jpeg',
};

// Updated DEFAULT_BFL_AI_CONFIG to use one of the new standard options
export const DEFAULT_BFL_AI_CONFIG: BFLAIImageConfig = {
  width: 1440, // Changed from 1440
  height: 806, // Changed from 80668 to match 16:9 (1440x806)
  prompt_upsampling: false,
  seed: 42,
  safety_tolerance: 2,
  output_format: 'jpeg',
};

export const DEFAULT_IMAGE_GENERATION_SETTINGS: ImageGenerationSettings = {
  gemini: DEFAULT_GEMINI_CONFIG,
  bfl_ai: DEFAULT_BFL_AI_CONFIG,
};
