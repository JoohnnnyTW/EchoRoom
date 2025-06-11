// 引入 openai 套件
import OpenAI from 'openai';

// Netlify Function 的標準處理函式
// event: 包含請求的資訊 (如請求體、方法等)
// context: 包含執行環境的資訊
export async function handler(event, context) {
  // 1. 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. 從前端請求的 body 中獲取資料
    // event.body 是一個 JSON 字串，需要解析
    const { prompt, size, quality, style } = JSON.parse(event.body);

    // 3. 從 Netlify 的環境變數中安全地獲取您的 OpenAI API 金鑰
    //    這個環境變數需要在 Netlify 網站的 UI 中設定 (見步驟 5)
    const apiKey = process.env.OPENAI_API_KEY_FOR_PROXY; // 注意變數名稱

    // 檢查 API 金鑰和提示詞是否存在
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI API key not configured on server.' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    // 4. 初始化 OpenAI 客戶端
    const openai = new OpenAI({ apiKey });

    // 5. 呼叫 OpenAI API 生成圖像
    const response = await openai.images.generate({
      model: "gpt-image-1", // 您可以根據需要更改模型
      prompt: prompt,
      n: 1, // 生成一張圖像
      size: size || "1024x1024", // 使用前端傳來的尺寸，或預設值
      response_format: "b64_json", // 以 Base64 編碼的 JSON 格式返回圖像
      quality: quality || "standard",
      style: style || "vivid"
    });

    // 6. 處理 OpenAI 的回應
    if (response.data && response.data[0] && response.data[0].b64_json) {
      // 成功：將 Base64 圖像資料返回給前端
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' }, // 告訴瀏覽器這是 JSON
        body: JSON.stringify({ b64_json: response.data[0].b64_json }),
      };
    } else {
      // 如果 OpenAI 回應的格式不符合預期
      console.error("OpenAI Proxy: Unexpected response structure from OpenAI API", response);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get image data from OpenAI via proxy.' }) };
    }
  } catch (error) {
    // 7. 錯誤處理
    console.error('OpenAI Proxy Error:', error);
    // 返回錯誤訊息給前端
    return {
      statusCode: error.status || 500, // 如果 OpenAI SDK 有 status，就用它
      body: JSON.stringify({ error: error.message || 'Failed to generate image with OpenAI via proxy.' }),
    };
  }
}