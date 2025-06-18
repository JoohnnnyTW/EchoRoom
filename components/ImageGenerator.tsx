import React, { useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { GoogleGenAI, GenerateImagesResponse } from "@google/genai";
import { AppGeneratedImage, PromptStateForHistory, ImageEngine, GeminiAspectRatio, BFLAIImageConfig, FluxKontextMaxAspectRatio } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { PhotoIcon, ExclamationTriangleIcon } from './Icons';
import { SettingsContext } from '../contexts/SettingsContext';
import { 
  GEMINI_ASPECT_RATIOS, 
  BFL_AI_RESOLUTION_OPTIONS,
  FLUX_KONTEXT_MAX_ASPECT_RATIOS
} from '../constants/imageGenerationOptions';

interface ImageGeneratorProps {
  promptEn: string;
  geminiApiKey?: string;
  onImageGenerated: (image: AppGeneratedImage, engine: ImageEngine) => void;
  onViewImage: (image: AppGeneratedImage) => void;
  currentPromptState: PromptStateForHistory;
  title: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  promptEn,
  geminiApiKey,
  onImageGenerated,
  onViewImage,
  currentPromptState,
  title
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<AppGeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) {
    throw new Error("ImageGenerator must be used within a SettingsProvider");
  }
  const { settings: appSettings, updateSettings } = settingsContext;
  const imageGenSettings = appSettings.imageGeneration;

  // Determine initial selectedEngine based on key availability
  const bflAIApiKey = process.env.BFL_API_KEY;
  const availableEnginesList: ImageEngine[] = useMemo(() => {
    const engines: ImageEngine[] = [];
    if (geminiApiKey) engines.push('gemini');
    if (bflAIApiKey) {
      engines.push('bfl_ai');
      engines.push('fluxKontextMax');
    }
    return engines;
  }, [geminiApiKey, bflAIApiKey]);

  const [selectedEngine, setSelectedEngine] = useState<ImageEngine>(() => availableEnginesList.length > 0 ? availableEnginesList[0] : 'gemini');

  useEffect(() => {
    // If the selected engine becomes unavailable (e.g. API key removed in settings), switch to the first available one
    if (!availableEnginesList.includes(selectedEngine) && availableEnginesList.length > 0) {
      setSelectedEngine(availableEnginesList[0]);
    } else if (availableEnginesList.length === 0 && selectedEngine !== 'gemini') { // Fallback if all keys removed
        setSelectedEngine('gemini');
    }
  }, [availableEnginesList, selectedEngine]);


  const geminiClient = useMemo(() => {
    if (geminiApiKey) return new GoogleGenAI({ apiKey: geminiApiKey });
    return null;
  }, [geminiApiKey]);

  const handleEngineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEngine(event.target.value as ImageEngine);
  };

  const handleAspectRatioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAspectRatio = event.target.value;
    if (selectedEngine === 'gemini') {
      updateSettings(prev => ({
        ...prev,
        imageGeneration: { ...prev.imageGeneration, gemini: { ...prev.imageGeneration.gemini, aspectRatio: newAspectRatio as GeminiAspectRatio } }
      }));
    } else if (selectedEngine === 'fluxKontextMax') {
      updateSettings(prev => ({
        ...prev,
        imageGeneration: { ...prev.imageGeneration, fluxKontextMax: { ...prev.imageGeneration.fluxKontextMax, aspectRatio: newAspectRatio as FluxKontextMaxAspectRatio } }
      }));
    }
  };

  const handleResolutionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = BFL_AI_RESOLUTION_OPTIONS.find(opt => opt.value === event.target.value);
    if (selectedOption && selectedEngine === 'bfl_ai') {
      updateSettings(prev => ({
        ...prev,
        imageGeneration: { ...prev.imageGeneration, bfl_ai: { ...prev.imageGeneration.bfl_ai, width: selectedOption.width, height: selectedOption.height } }
      }));
    }
  };


  const handleGenerateImage = useCallback(async () => {
    if (!promptEn) {
      setError("請先建立提示詞。");
      return;
    }

    if (selectedEngine === 'gemini' && !geminiClient) {
      setError("Gemini API 金鑰未設定。無法使用 Gemini 生成圖像。");
      return;
    }
    if ((selectedEngine === 'bfl_ai' || selectedEngine === 'fluxKontextMax') && !bflAIApiKey) {
      setError("BFL.ai API 金鑰未設定 (BFL_API_KEY)。無法使用此引擎生成圖像。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      let newImage: AppGeneratedImage | null = null;

      if (selectedEngine === 'gemini' && geminiClient) {
        const response: GenerateImagesResponse = await geminiClient.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: promptEn,
          config: {
            numberOfImages: 1,
            outputMimeType: imageGenSettings.gemini.outputMimeType,
            aspectRatio: imageGenSettings.gemini.aspectRatio,
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
          const imageBytes = response.generatedImages[0].image.imageBytes;
          const mimeType = response.generatedImages[0].image.mimeType || imageGenSettings.gemini.outputMimeType;
          newImage = {
            id: `img-${Date.now()}-gemini`,
            src: `data:${mimeType};base64,${imageBytes}`,
            prompt: promptEn,
          };
        } else {
          let detailMessage = "未從 Gemini 回應中找到有效的圖像數據。圖像可能因安全政策或其他原因被阻擋。";
          console.warn("Gemini image generation did not return valid image data. Response:", response);
          throw new Error(detailMessage);
        }
      } else if (selectedEngine === 'bfl_ai' && bflAIApiKey) { // FLUX 1.1 Pro
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
          const errorData = await proxyResponse.json().catch(() => ({ error: `BFL.ai (FLUX 1.1 Pro) 代理錯誤 (${proxyResponse.status})` }));
          throw new Error(errorData.error || `BFL.ai (FLUX 1.1 Pro) 代理請求失敗 (${proxyResponse.status})`);
        }
        const responseData = await proxyResponse.json();

        if (responseData.image_b64 && responseData.mime_type) {
            newImage = {
                id: `img-${Date.now()}-bflai-flux11`,
                src: `data:${responseData.mime_type};base64,${responseData.image_b64}`,
                prompt: promptEn,
            };
        } else {
          console.error("BFL.ai (FLUX 1.1 Pro) proxy response data:", responseData);
          throw new Error("未從 BFL.ai (FLUX 1.1 Pro) 代理回應中找到圖像數據或格式不符。");
        }
      } else if (selectedEngine === 'fluxKontextMax' && bflAIApiKey) {
        const fluxConfig = imageGenSettings.fluxKontextMax;
        const requestBody = {
          prompt: promptEn,
          aspect_ratio: fluxConfig.aspectRatio,
          output_format: fluxConfig.output_format,
          seed: fluxConfig.seed,
          prompt_upsampling: fluxConfig.prompt_upsampling,
          safety_tolerance: fluxConfig.safety_tolerance,
        };
        const proxyResponse = await fetch('/.netlify/functions/generateFluxKontextImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({ error: `Flux Kontext Max 代理錯誤 (${proxyResponse.status})` }));
          throw new Error(errorData.error || `Flux Kontext Max 代理請求失敗 (${proxyResponse.status})`);
        }
        const responseData = await proxyResponse.json();

        if (responseData.image_b64 && responseData.mime_type) {
            newImage = {
                id: `img-${Date.now()}-fluxKontextMax`,
                src: `data:${responseData.mime_type};base64,${responseData.image_b64}`,
                prompt: promptEn,
            };
        } else {
          console.error("Flux Kontext Max proxy response data:", responseData);
          throw new Error("未從 Flux Kontext Max 代理回應中找到圖像數據或格式不符。");
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
      if (e.message && e.message.includes("SAFETY")) {
          message = "圖像生成因安全政策被阻擋。請嘗試修改提示詞。";
      } else if (e.message && e.message.includes("quota")) {
          message = "已超出 API 配額限制。";
      }
      setError(`生成圖像失敗：${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [promptEn, geminiClient, bflAIApiKey, onImageGenerated, selectedEngine, imageGenSettings]);

  const getEngineDisplayName = (engine: ImageEngine) => {
    switch (engine) {
      case 'gemini': return 'Gemini (Imagen 3)';
      case 'bfl_ai': return 'BFL.ai (FLUX 1.1 Pro)';
      case 'fluxKontextMax': return 'BFL.ai (Flux Kontext Max)';
      default: return engine;
    }
  };

  const isEngineOptionAvailable = (engine: ImageEngine) => {
    if (engine === 'gemini') return !!geminiApiKey;
    if (engine === 'bfl_ai' || engine === 'fluxKontextMax') return !!bflAIApiKey;
    return false;
  };
  
  const canGenerate = isEngineOptionAvailable(selectedEngine);

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200 space-y-4">
      <h3 className="text-md font-semibold text-gray-900/90">{title}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="engineSelect" className="block text-sm font-medium text-gray-900/90 mb-1">選擇生成引擎:</label>
          <select
            id="engineSelect"
            value={selectedEngine}
            onChange={handleEngineChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:ring-black focus:border-black"
            disabled={isLoading}
          >
            <option value="gemini" disabled={!isEngineOptionAvailable('gemini')}>
              Gemini (Imagen 3) {!isEngineOptionAvailable('gemini') && "(金鑰未設定)"}
            </option>
            <option value="bfl_ai" disabled={!isEngineOptionAvailable('bfl_ai')}>
              BFL.ai (FLUX 1.1 Pro) {!isEngineOptionAvailable('bfl_ai') && "(金鑰未設定)"}
            </option>
            <option value="fluxKontextMax" disabled={!isEngineOptionAvailable('fluxKontextMax')}>
              BFL.ai (Flux Kontext Max) {!isEngineOptionAvailable('fluxKontextMax') && "(金鑰未設定)"}
            </option>
          </select>
        </div>

        <div>
          {selectedEngine === 'gemini' && (
            <>
              <label htmlFor="geminiAspectRatio" className="block text-sm font-medium text-gray-900/90 mb-1">長寬比 (Gemini):</label>
              <select
                id="geminiAspectRatio"
                value={imageGenSettings.gemini.aspectRatio}
                onChange={handleAspectRatioChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:ring-black focus:border-black"
                disabled={isLoading}
              >
                {GEMINI_ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
          {selectedEngine === 'bfl_ai' && (
            <>
              <label htmlFor="bflResolution" className="block text-sm font-medium text-gray-900/90 mb-1">解析度 (FLUX 1.1 Pro):</label>
              <select
                id="bflResolution"
                value={`${imageGenSettings.bfl_ai.width}x${imageGenSettings.bfl_ai.height}`}
                onChange={handleResolutionChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:ring-black focus:border-black"
                disabled={isLoading}
              >
                {BFL_AI_RESOLUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </>
          )}
          {selectedEngine === 'fluxKontextMax' && (
            <>
              <label htmlFor="fluxAspectRatio" className="block text-sm font-medium text-gray-900/90 mb-1">長寬比 (Flux Kontext Max):</label>
              <select
                id="fluxAspectRatio"
                value={imageGenSettings.fluxKontextMax.aspectRatio}
                onChange={handleAspectRatioChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:ring-black focus:border-black"
                disabled={isLoading}
              >
                {FLUX_KONTEXT_MAX_ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
        </div>
      </div>


      <button
        onClick={handleGenerateImage}
        disabled={isLoading || !promptEn || !canGenerate}
        className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transform transition-transform duration-100"
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
        <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded-md text-sm text-red-700 flex items-start">
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
            {selectedEngine === 'fluxKontextMax' && `, ${imageGenSettings.fluxKontextMax.aspectRatio}`})
          </h4>
          {generatedImages.map((image) => (
            <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => onViewImage(image)}
                className="w-full block focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-md active:scale-95 transform transition-transform duration-100"
                aria-label={`檢視圖像詳情: ${image.prompt.substring(0,50)}...`}
              >
                <img src={image.src} alt={`Generated: ${image.prompt.substring(0,50)}...`} className="w-full h-auto object-contain" />
              </button>
              <p className="p-2 text-xs text-gray-600 bg-gray-50 border-t border-gray-200 truncate" title={image.prompt}>
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
