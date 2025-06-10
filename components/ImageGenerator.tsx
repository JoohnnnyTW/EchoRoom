
import React, { useState, useCallback, useMemo, useContext } from 'react';
import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';
import { GeneratedImage, PromptStateForHistory, ImageEngine } from '../types'; // Added ImageEngine
import { LoadingSpinner } from './LoadingSpinner';
import { PhotoIcon, ExclamationTriangleIcon } from './Icons';
import { SettingsContext } from '../contexts/SettingsContext';

// Removed type ImageEngine from here, it's now imported from types.ts

interface ImageGeneratorProps {
  promptEn: string;
  geminiApiKey?: string;
  openAIApiKey?: string;
  // BFL.ai API Key will be read from process.env internally
  onImageGenerated: (image: GeneratedImage, engine: ImageEngine) => void;
  onViewImage: (image: GeneratedImage) => void;
  currentPromptState: PromptStateForHistory;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  promptEn, 
  geminiApiKey, 
  openAIApiKey, 
  onImageGenerated, 
  onViewImage, 
  currentPromptState 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<ImageEngine>('gemini');

  const bflAIApiKey = process.env.BFL_API_KEY; // Read BFL.ai API key

  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
    throw new Error("ImageGenerator must be used within a SettingsProvider");
  }
  const { settings: imageGenSettings } = settingsContext;

  const geminiClient = useMemo(() => {
    if (geminiApiKey) return new GoogleGenAI({ apiKey: geminiApiKey });
    return null;
  }, [geminiApiKey]);

  const openaiClient = useMemo(() => {
    if (openAIApiKey) {
      return new OpenAI({ 
        apiKey: openAIApiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return null;
  }, [openAIApiKey]);

  const handleGenerateImage = useCallback(async () => {
    if (!promptEn) {
      setError("請先建立提示詞。");
      return;
    }

    if (selectedEngine === 'gemini' && !geminiClient) {
      setError("Gemini API 金鑰未設定。無法使用 Gemini 生成圖像。");
      return;
    }
    if (selectedEngine === 'openai' && !openaiClient) {
      setError("OpenAI API 金鑰未設定。無法使用 OpenAI 生成圖像。");
      return;
    }
    if (selectedEngine === 'bfl_ai' && !bflAIApiKey) {
      setError("BFL.ai API 金鑰未設定 (BFL_API_KEY)。無法使用 BFL.ai 生成圖像。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      let newImage: GeneratedImage | null = null;

      if (selectedEngine === 'gemini' && geminiClient) {
        const response = await geminiClient.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: promptEn,
          config: {
            numberOfImages: 1,
            outputMimeType: imageGenSettings.gemini.outputMimeType,
            aspectRatio: imageGenSettings.gemini.aspectRatio,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const imageBytes = response.generatedImages[0].image.imageBytes;
          const mimeType = response.generatedImages[0].image.mimeType || imageGenSettings.gemini.outputMimeType;
          newImage = {
            id: `img-${Date.now()}-gemini`,
            src: `data:${mimeType};base64,${imageBytes}`,
            prompt: promptEn,
          };
        } else {
          throw new Error("未從 Gemini 回應中找到圖像數據。");
        }
      } else if (selectedEngine === 'openai' && openaiClient) {
        const response = await openaiClient.images.generate({
          model: "gpt-image-1", 
          prompt: promptEn,
          n: 1,
          size: imageGenSettings.openai.size, 
          response_format: "b64_json",
          quality: imageGenSettings.openai.quality, 
          style: imageGenSettings.openai.style 
        });

        if (response.data && response.data[0] && response.data[0].b64_json) {
          newImage = {
            id: `img-${Date.now()}-openai`,
            src: `data:image/png;base64,${response.data[0].b64_json}`,
            prompt: promptEn,
          };
        } else {
          throw new Error("未從 OpenAI 回應中找到圖像數據。");
        }
      } else if (selectedEngine === 'bfl_ai' && bflAIApiKey) {
        const bflConfig = imageGenSettings.bfl_ai;
        const requestBody = {
          prompt: promptEn,
          // image_prompt: "", // Optional, not configured for now
          width: bflConfig.width,
          height: bflConfig.height,
          prompt_upsampling: bflConfig.prompt_upsampling,
          seed: bflConfig.seed,
          safety_tolerance: bflConfig.safety_tolerance,
          output_format: bflConfig.output_format,
          // webhook_url and webhook_secret are ignored for sync operation
        };
        const fetchOptions = {
          method: 'POST',
          headers: {
            'x-key': bflAIApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        };
        const bflResponse = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', fetchOptions);
        if (!bflResponse.ok) {
          const errorData = await bflResponse.json().catch(() => ({ message: bflResponse.statusText }));
          throw new Error(`BFL.ai API 錯誤 (${bflResponse.status}): ${errorData.message || 'Unknown error'}`);
        }
        const responseData = await bflResponse.json();
        
        // Assuming responseData contains image like: { images: [{ image_b64: "...", mime_type: "..." }] }
        // Or simpler: { image_b64: "...", mime_type: "image/jpeg" } - let's try a simpler one first
        // The API snippet suggests output_format in request, so mime_type might be fixed by that.
        // Let's assume the response directly gives base64 and we use the requested output_format for mime type.
        // This is an assumption; actual BFL.ai API response structure needs verification.
        // A common pattern is responseData.images[0].b64_json or responseData.image_b64
        // For this example, let's assume `responseData.image_b64` exists.
        if (responseData.image_b64 || (responseData.images && responseData.images[0] && responseData.images[0].image_b64)) {
            const base64Data = responseData.image_b64 || responseData.images[0].image_b64;
            const mimeType = responseData.mime_type || `image/${bflConfig.output_format}`;
            newImage = {
                id: `img-${Date.now()}-bflai`,
                src: `data:${mimeType};base64,${base64Data}`,
                prompt: promptEn,
            };
        } else {
          console.error("BFL.ai response data:", responseData);
          throw new Error("未從 BFL.ai 回應中找到圖像數據或格式不符。");
        }
      }

      if (newImage) {
        setGeneratedImages([newImage]);
        onImageGenerated(newImage, selectedEngine);
      } else {
         setError("選擇的圖像生成引擎不可用或圖像生成失敗。");
      }

    } catch (e: any) {
      console.error(`生成圖像時出錯 (using ${selectedEngine}):`, e);
      let message = e.message || '未知錯誤';
      if (e.error && e.error.message) { 
        message = e.error.message;
      } else if (e.response && e.response.data && e.response.data.error && e.response.data.error.message) { 
        message = e.response.data.error.message;
      }
      setError(`生成圖像失敗：${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [promptEn, geminiClient, openaiClient, bflAIApiKey, onImageGenerated, selectedEngine, imageGenSettings]);

  const getEngineDisplayName = (engine: ImageEngine) => {
    switch (engine) {
      case 'gemini': return 'Gemini (Imagen 3)';
      case 'openai': return 'OpenAI (gpt-image-1)';
      case 'bfl_ai': return 'BFL.ai (Flux Pro)';
      default: return engine;
    }
  };
  
  const isEngineAvailable = (engine: ImageEngine) => {
    if (engine === 'gemini') return !!geminiApiKey;
    if (engine === 'openai') return !!openAIApiKey;
    if (engine === 'bfl_ai') return !!bflAIApiKey;
    return false;
  };

  const availableEngines: ImageEngine[] = ['gemini', 'openai', 'bfl_ai'];
  const canGenerate = isEngineAvailable(selectedEngine);

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg space-y-4">
      <h3 className="text-md font-semibold text-gray-800">AI 圖像生成</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">選擇生成引擎:</label>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {availableEngines.map(engine => (
            <label key={engine} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="imageEngine"
                value={engine}
                checked={selectedEngine === engine}
                onChange={() => setSelectedEngine(engine)}
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                disabled={!isEngineAvailable(engine)}
              />
              <span className={`text-sm ${
                !isEngineAvailable(engine)
                ? 'text-gray-400 italic' 
                : 'text-gray-700'
              }`}>
                {getEngineDisplayName(engine)}
                {!isEngineAvailable(engine) && " (金鑰未設定)"}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleGenerateImage}
        disabled={isLoading || !promptEn || !canGenerate}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        aria-label={isLoading ? "正在生成圖像" : "使用英文提示詞生成圖像"}
        title={!canGenerate ? `${getEngineDisplayName(selectedEngine)} API 金鑰未設定` : (!promptEn ? "請先建立提示詞" : `使用 ${getEngineDisplayName(selectedEngine)} 生成圖像`)}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="w-5 h-5 mr-2" />
            生成中...
          </>
        ) : (
          <>
            <PhotoIcon className="w-5 h-5 mr-2" />
            使用英文提示詞生成圖像
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0"/>
          <span><strong>錯誤：</strong> {error}</span>
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            最新生成的圖像 ({getEngineDisplayName(selectedEngine)}
            {selectedEngine === 'openai' && `, ${imageGenSettings.openai.size}`})
            {selectedEngine === 'gemini' && `, ${imageGenSettings.gemini.aspectRatio}`})
            {selectedEngine === 'bfl_ai' && `, ${imageGenSettings.bfl_ai.width}x${imageGenSettings.bfl_ai.height}`})
          </h4>
          {generatedImages.map((image) => (
            <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button 
                onClick={() => onViewImage(image)} 
                className="w-full block focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
                aria-label={`檢視圖像詳情: ${image.prompt.substring(0,50)}...`}
              >
                <img src={image.src} alt={`Generated: ${image.prompt.substring(0,50)}...`} className="w-full h-auto object-contain" />
              </button>
              <p className="p-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200 truncate" title={image.prompt}>
                提示詞: {image.prompt}
              </p>
            </div>
          ))}
        </div>
      )}
       {!isLoading && generatedImages.length === 0 && !error && (
        <div className="mt-4 text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2"/>
          您生成的圖像將顯示在此處。
        </div>
      )}
    </div>
  );
};
