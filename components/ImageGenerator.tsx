
import React, { useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, PromptStateForHistory, ImageEngine } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { PhotoIcon, ExclamationTriangleIcon } from './Icons';
import { SettingsContext } from '../contexts/SettingsContext';

interface ImageGeneratorProps {
  promptEn: string;
  geminiApiKey?: string;
  onImageGenerated: (image: GeneratedImage, engine: ImageEngine) => void;
  onViewImage: (image: GeneratedImage) => void;
  currentPromptState: PromptStateForHistory;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  promptEn, 
  geminiApiKey, 
  onImageGenerated, 
  onViewImage, 
  currentPromptState 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<ImageEngine>('gemini');

  const bflAIApiKey = process.env.BFL_API_KEY; 

  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
    throw new Error("ImageGenerator must be used within a SettingsProvider");
  }
  const { settings: imageGenSettings } = settingsContext;

  const geminiClient = useMemo(() => {
    if (geminiApiKey) return new GoogleGenAI({ apiKey: geminiApiKey });
    return null;
  }, [geminiApiKey]);

  const handleGenerateImage = useCallback(async () => {
    if (!promptEn) {
      setError("請先建立提示詞。");
      return;
    }

    if (selectedEngine === 'gemini' && !geminiClient) {
      setError("Gemini API 金鑰未設定。無法使用 Gemini 生成圖像。");
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
      } else if (selectedEngine === 'bfl_ai' && bflAIApiKey) { 
        const bflConfig = imageGenSettings.bfl_ai;
        const requestBody = {
          prompt: promptEn,
          width: bflConfig.width,
          height: bflConfig.height,
          prompt_upsampling: bflConfig.prompt_upsampling,
          seed: bflConfig.seed,
          safety_tolerance: bflConfig.safety_tolerance,
          output_format: bflConfig.output_format,
        };
        const proxyResponse = await fetch('/.netlify/functions/generateBflaiImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({ error: `BFL.ai 代理錯誤 (${proxyResponse.status})` }));
          throw new Error(errorData.error || `BFL.ai 代理請求失敗 (${proxyResponse.status})`);
        }
        const responseData = await proxyResponse.json();
        
        if (responseData.image_b64 && responseData.mime_type) {
            newImage = {
                id: `img-${Date.now()}-bflai`,
                src: `data:${responseData.mime_type};base64,${responseData.image_b64}`,
                prompt: promptEn,
            };
        } else {
          console.error("BFL.ai proxy response data:", responseData);
          throw new Error("未從 BFL.ai 代理回應中找到圖像數據或格式不符。");
        }
      }

      if (newImage) {
        setGeneratedImages([newImage]);
        onImageGenerated(newImage, selectedEngine);
      } else {
         setError("選擇的圖像生成引擎不可用或圖像生成失敗。");
      }

    } catch (e: any) {
      console.error(`生成圖像時出錯 (using ${selectedEngine} via proxy):`, e);
      let message = e.message || '未知錯誤';
      setError(`生成圖像失敗：${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [promptEn, geminiClient, bflAIApiKey, onImageGenerated, selectedEngine, imageGenSettings]);

  const getEngineDisplayName = (engine: ImageEngine) => {
    switch (engine) {
      case 'gemini': return 'Gemini';
      case 'bfl_ai': return 'FLUX 1.1 [pro]';
      default: return engine;
    }
  };
  
  const isEngineAvailable = (engine: ImageEngine) => {
    if (engine === 'gemini') return !!geminiApiKey;
    if (engine === 'bfl_ai') return !!bflAIApiKey;
    return false;
  };

  const availableEngines: ImageEngine[] = useMemo(() => ['gemini', 'bfl_ai'], []);
  const canGenerate = isEngineAvailable(selectedEngine);

  // Ensure selectedEngine is valid if the previously selected one is no longer available
  // or if the default engine is not available on load.
  useEffect(() => {
    if (!availableEngines.includes(selectedEngine) || !isEngineAvailable(selectedEngine)) {
        const firstAvailable = availableEngines.find(isEngineAvailable);
        if (firstAvailable) {
            setSelectedEngine(firstAvailable);
        } else if (availableEngines.length > 0) {
             // Fallback to the first listed engine if none are currently "available" (e.g. keys not set)
             // This maintains a selection, though generation might be disabled.
            setSelectedEngine(availableEngines[0]);
        }
    }
  }, [availableEngines, selectedEngine, isEngineAvailable]);


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
