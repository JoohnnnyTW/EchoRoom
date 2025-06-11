// 引入 node-fetch 套件，用於發送 HTTP 請求
const fetch = require('node-fetch');

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. 從前端請求的 body 中獲取資料
    const { prompt, width, height, prompt_upsampling, seed, safety_tolerance, output_format } = JSON.parse(event.body);

    // 2. 從 Netlify 環境變數中獲取 BFL.ai API 金鑰
    const apiKey = process.env.BFL_AI_API_KEY_FOR_PROXY; // 注意變數名稱

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'BFL.ai API key not configured on server.' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    // 3. 準備請求 BFL.ai API 的資料
    const requestBody = { prompt, width, height, prompt_upsampling, seed, safety_tolerance, output_format };
    const fetchOptions = {
      method: 'POST',
      headers: {
        'x-key': apiKey, // BFL.ai 使用 'x-key' 標頭
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // 4. 呼叫 BFL.ai API
    const bflResponse = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', fetchOptions);

    // 5. 處理 BFL.ai 的回應
    if (!bflResponse.ok) { // 如果 HTTP 狀態碼不是 2xx
      const errorData = await bflResponse.json().catch(() => ({ message: `BFL.ai API Error: ${bflResponse.statusText}` }));
      console.error('BFL.ai Proxy Error - API responded with error:', bflResponse.status, errorData);
      return { statusCode: bflResponse.status, body: JSON.stringify({ error: errorData.message || 'Unknown BFL.ai API error via proxy' }) };
    }

    const responseData = await bflResponse.json();

    // 檢查回應中是否有圖像資料
    if (responseData.image_b64 || (responseData.images && responseData.images[0] && responseData.images[0].image_b64)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image_b64: responseData.image_b64 || responseData.images[0].image_b64,
            mime_type: responseData.mime_type || `image/${output_format || 'jpeg'}` // 使用回應中的 mime_type 或根據請求的 output_format
        }),
      };
    } else {
      console.error("BFL.ai Proxy: Unexpected response structure from BFL.ai API", responseData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get image data from BFL.ai via proxy.' }) };
    }
  } catch (error) {
    // 6. 錯誤處理
    console.error('BFL.ai Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate image with BFL.ai via proxy.' }),
    };
  }
}