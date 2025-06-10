
import { GeminiAspectRatio, GeminiOutputMimeType, OpenAISize, OpenAIQuality, OpenAIStyle, BFLAIOutputFormat, GeminiImageConfig, OpenAIImageConfig, BFLAIImageConfig, ImageGenerationSettings } from '../types';

export const GEMINI_ASPECT_RATIOS: GeminiAspectRatio[] = ['16:9', '1:1', '9:16', '4:3', '3:4', '3:2', '2:3'];
export const GEMINI_OUTPUT_MIME_TYPES: GeminiOutputMimeType[] = ['image/jpeg', 'image/png'];

export const OPENAI_SIZES: OpenAISize[] = ["1024x1024", "1792x1024", "1024x1792"];
export const OPENAI_QUALITIES: OpenAIQuality[] = ["standard", "hd"];
export const OPENAI_STYLES: OpenAIStyle[] = ["vivid", "natural"];

export const BFL_AI_OUTPUT_FORMATS: BFLAIOutputFormat[] = ['jpeg', 'png', 'webp'];

export const DEFAULT_GEMINI_CONFIG: GeminiImageConfig = {
  aspectRatio: '16:9',
  outputMimeType: 'image/jpeg',
};

export const DEFAULT_OPENAI_CONFIG: OpenAIImageConfig = {
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
};

export const DEFAULT_BFL_AI_CONFIG: BFLAIImageConfig = {
  width: 1024,
  height: 768,
  prompt_upsampling: false,
  seed: 42,
  safety_tolerance: 2, // Default from snippet, assuming a range like 0-4 might be typical
  output_format: 'jpeg',
};

export const DEFAULT_IMAGE_GENERATION_SETTINGS: ImageGenerationSettings = {
  gemini: DEFAULT_GEMINI_CONFIG,
  openai: DEFAULT_OPENAI_CONFIG,
  bfl_ai: DEFAULT_BFL_AI_CONFIG,
};
