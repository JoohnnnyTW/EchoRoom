// netlify/functions/generateGeminiImage.js
import { GoogleGenAI } from "@google/genai";

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, aspectRatio, outputMimeType } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY_FOR_PROXY; // 從 Netlify 環境變數獲取

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API key not configured on server (GEMINI_API_KEY_FOR_PROXY).' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: outputMimeType || 'image/jpeg', // 使用前端傳來的，或預設
        aspectRatio: aspectRatio || '16:9',       // 使用前端傳來的，或預設
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image) {
      const imageResult = response.generatedImages[0].image;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBytes: imageResult.imageBytes, // Base64 string
          mimeType: imageResult.mimeType || outputMimeType || 'image/jpeg',
        }),
      };
    } else {
      console.error("Gemini Proxy: Unexpected response structure from Imagen API", response);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get image data from Gemini (Imagen) via proxy.' }) };
    }
  } catch (error) {
    console.error('Gemini Proxy Error:', error);
    let errorMessage = 'Failed to generate image with Gemini (Imagen) via proxy.';
    if (error.message) {
      errorMessage = error.message;
    }
    // Gemini API errors often have more details in error.details or error.stack
    // For simplicity, returning the main message. You might want to log error.stack for debugging.
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}