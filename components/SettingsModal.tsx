
import React, { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { ImageGenerationSettings, GeminiImageConfig, OpenAIImageConfig, BFLAIImageConfig, GeminiAspectRatio, GeminiOutputMimeType, OpenAISize, OpenAIQuality, OpenAIStyle, BFLAIOutputFormat } from '../types';
import { XCircleIcon } from './Icons';
import { 
  GEMINI_ASPECT_RATIOS, GEMINI_OUTPUT_MIME_TYPES, 
  OPENAI_SIZES, OPENAI_QUALITIES, OPENAI_STYLES,
  BFL_AI_OUTPUT_FORMATS
} from '../constants/imageGenerationOptions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const settingsContext = useContext(SettingsContext);

  if (!settingsContext) {
    console.error("SettingsContext not found. Ensure SettingsModal is rendered within SettingsProvider.");
    return null; 
  }

  const { settings: currentGlobalSettings, updateSettings, saveSettings } = settingsContext;
  const [editableSettings, setEditableSettings] = useState<ImageGenerationSettings>(currentGlobalSettings);

  useEffect(() => {
    setEditableSettings(currentGlobalSettings);
  }, [currentGlobalSettings]);

  const handleGeminiChange = <K extends keyof GeminiImageConfig>(key: K, value: GeminiImageConfig[K]) => {
    setEditableSettings(prev => ({ ...prev, gemini: { ...prev.gemini, [key]: value } }));
  };

  const handleOpenAIChange = <K extends keyof OpenAIImageConfig>(key: K, value: OpenAIImageConfig[K]) => {
    setEditableSettings(prev => ({ ...prev, openai: { ...prev.openai, [key]: value } }));
  };

  const handleBFLAIChange = <K extends keyof BFLAIImageConfig>(key: K, value: BFLAIImageConfig[K]) => {
    setEditableSettings(prev => ({ ...prev, bfl_ai: { ...prev.bfl_ai, [key]: value } }));
  };

  const handleSave = () => {
    updateSettings(editableSettings);
    saveSettings();
    onClose();
  };
  
  const handleCancel = () => {
    setEditableSettings(currentGlobalSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[70] transition-opacity duration-300 ease-in-out"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-modal-title" className="text-xl font-semibold text-gray-800">
            預設圖像生成設定
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉設定"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="overflow-y-auto apple-scroll space-y-6 pr-2 mb-6 flex-grow">
          {/* Gemini Settings */}
          <section className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700">Gemini (Imagen 3) 預設值</h3>
            <div>
              <label htmlFor="geminiAspectRatio" className="block text-sm font-medium text-gray-600 mb-1">長寬比 (Aspect Ratio)</label>
              <select
                id="geminiAspectRatio"
                value={editableSettings.gemini.aspectRatio}
                onChange={(e) => handleGeminiChange('aspectRatio', e.target.value as GeminiAspectRatio)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {GEMINI_ASPECT_RATIOS.map(ratio => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="geminiOutputMimeType" className="block text-sm font-medium text-gray-600 mb-1">輸出格式 (Output Mime Type)</label>
              <select
                id="geminiOutputMimeType"
                value={editableSettings.gemini.outputMimeType}
                onChange={(e) => handleGeminiChange('outputMimeType', e.target.value as GeminiOutputMimeType)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {GEMINI_OUTPUT_MIME_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </section>

          {/* OpenAI Settings */}
          <section className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700">OpenAI (gpt-image-1) 預設值</h3>
            <p className="text-xs text-gray-500 -mt-2">注意：「gpt-image-1」為目前程式碼中使用的模型名稱。下列選項基於標準 DALL-E 模型功能。</p>
            <div>
              <label htmlFor="openaiSize" className="block text-sm font-medium text-gray-600 mb-1">圖像尺寸 (Size)</label>
              <select
                id="openaiSize"
                value={editableSettings.openai.size}
                onChange={(e) => handleOpenAIChange('size', e.target.value as OpenAISize)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {OPENAI_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="openaiQuality" className="block text-sm font-medium text-gray-600 mb-1">品質 (Quality)</label>
              <select
                id="openaiQuality"
                value={editableSettings.openai.quality}
                onChange={(e) => handleOpenAIChange('quality', e.target.value as OpenAIQuality)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {OPENAI_QUALITIES.map(quality => (
                  <option key={quality} value={quality}>{quality.charAt(0).toUpperCase() + quality.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="openaiStyle" className="block text-sm font-medium text-gray-600 mb-1">風格 (Style)</label>
              <select
                id="openaiStyle"
                value={editableSettings.openai.style}
                onChange={(e) => handleOpenAIChange('style', e.target.value as OpenAIStyle)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {OPENAI_STYLES.map(style => (
                  <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                ))}
              </select>
            </div>
          </section>

          {/* BFL.ai Settings */}
          <section className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700">BFL.ai (Flux Pro 1.1) 預設值</h3>
            <div>
              <label htmlFor="bflWidth" className="block text-sm font-medium text-gray-600 mb-1">寬度 (Width)</label>
              <input
                type="number"
                id="bflWidth"
                value={editableSettings.bfl_ai.width}
                onChange={(e) => handleBFLAIChange('width', parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
                placeholder="e.g., 1024"
              />
            </div>
            <div>
              <label htmlFor="bflHeight" className="block text-sm font-medium text-gray-600 mb-1">高度 (Height)</label>
              <input
                type="number"
                id="bflHeight"
                value={editableSettings.bfl_ai.height}
                onChange={(e) => handleBFLAIChange('height', parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
                placeholder="e.g., 768"
              />
            </div>
            <div>
              <label htmlFor="bflSeed" className="block text-sm font-medium text-gray-600 mb-1">種子 (Seed)</label>
              <input
                type="number"
                id="bflSeed"
                value={editableSettings.bfl_ai.seed}
                onChange={(e) => handleBFLAIChange('seed', parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
                placeholder="e.g., 42"
              />
            </div>
            <div>
              <label htmlFor="bflSafetyTolerance" className="block text-sm font-medium text-gray-600 mb-1">安全容忍度 (Safety Tolerance)</label>
              <input
                type="number"
                id="bflSafetyTolerance"
                value={editableSettings.bfl_ai.safety_tolerance}
                onChange={(e) => handleBFLAIChange('safety_tolerance', parseInt(e.target.value, 10))}
                min="0" // Assuming a range, adjust if API has specific values
                max="4" // Assuming a range
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
                placeholder="e.g., 2 (0-4)"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bflPromptUpsampling"
                checked={editableSettings.bfl_ai.prompt_upsampling}
                onChange={(e) => handleBFLAIChange('prompt_upsampling', e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black mr-2"
              />
              <label htmlFor="bflPromptUpsampling" className="text-sm font-medium text-gray-600">啟用提示詞增強 (Prompt Upsampling)</label>
            </div>
            <div>
              <label htmlFor="bflOutputFormat" className="block text-sm font-medium text-gray-600 mb-1">輸出格式 (Output Format)</label>
              <select
                id="bflOutputFormat"
                value={editableSettings.bfl_ai.output_format}
                onChange={(e) => handleBFLAIChange('output_format', e.target.value as BFLAIOutputFormat)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 text-sm bg-white text-black"
              >
                {BFL_AI_OUTPUT_FORMATS.map(format => (
                  <option key={format} value={format}>{format.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </section>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
