
import { GeminiAspectRatio, GeminiOutputMimeType, BFLAIOutputFormat, FluxKontextMaxOutputFormat, FluxKontextMaxAspectRatio, GeminiImageConfig, BFLAIImageConfig, FluxKontextMaxImageConfig, ImageGenerationSettings } from '../types';

export const GEMINI_ASPECT_RATIOS: GeminiAspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '3:4', '3:2', '2:3'];
export const GEMINI_OUTPUT_MIME_TYPES: GeminiOutputMimeType[] = ['image/jpeg', 'image/png'];

export const BFL_AI_OUTPUT_FORMATS: BFLAIOutputFormat[] = ['jpeg', 'png', 'webp']; // For FLUX 1.1 Pro

// Define the new BFL.ai resolution options (for FLUX 1.1 Pro)
export const BFL_AI_RESOLUTION_OPTIONS: Array<{ label: string; width: number; height: number; value: string }> = [
  { label: '16:9 (1440x832)', width: 1440, height: 832, value: '1440x832' },
  { label: '9:16 (832x1440)', width: 832, height: 1440, value: '832x1440' },
  { label: '1:1 (1440x1440)', width: 1440, height: 1440, value: '1440x1440' },
  { label: '4:3 (1408x1056)', width: 1408, height: 1056, value: '1408x1056' },
  { label: '3:4 (1056x1408)', width: 1056, height: 1408, value: '1056x1408' },
  { label: '3:2 (1440x960)', width: 1440, height: 960, value: '1440x960' },
  { label: '2:3 (960x1440)', width: 960, height: 1440, value: '960x1440' },
];

export const FLUX_KONTEXT_MAX_ASPECT_RATIOS: FluxKontextMaxAspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '9:21'];
export const FLUX_KONTEXT_MAX_OUTPUT_FORMATS: FluxKontextMaxOutputFormat[] = ['jpeg', 'png'];

export const DEFAULT_GEMINI_CONFIG: GeminiImageConfig = {
  aspectRatio: '16:9',
  outputMimeType: 'image/jpeg',
};

export const DEFAULT_BFL_AI_CONFIG: BFLAIImageConfig = { // For FLUX 1.1 Pro
  width: 1440, 
  height: 832, 
  prompt_upsampling: false,
  seed: 42,
  safety_tolerance: 2,
  output_format: 'jpeg',
};

export const DEFAULT_FLUX_KONTEXT_MAX_CONFIG: FluxKontextMaxImageConfig = {
  aspectRatio: '1:1',
  output_format: 'png',
  seed: 42,
  prompt_upsampling: false,
  safety_tolerance: 2,
};

export const DEFAULT_IMAGE_GENERATION_SETTINGS: ImageGenerationSettings = {
  gemini: DEFAULT_GEMINI_CONFIG,
  bfl_ai: DEFAULT_BFL_AI_CONFIG, // For FLUX 1.1 Pro
  fluxKontextMax: DEFAULT_FLUX_KONTEXT_MAX_CONFIG, // New
};
