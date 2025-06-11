// netlify/functions/generateOpenaiImage.js
const OpenAI = require('openai');
// const fetch = require('node-fetch'); // No longer needed as we expect b64_json directly

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Extract all relevant parameters from the frontend request
    const { prompt, size, quality, style } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY_FOR_PROXY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI API key not configured on server (OPENAI_API_KEY_FOR_PROXY).' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    const openai = new OpenAI({ apiKey });

    const modelToUse = "dall-e-3"; // Using DALL-E 3

    console.log(`OpenAI Proxy: Requesting image with model "${modelToUse}", prompt: "${prompt}", size: ${size || "1024x1024"}, quality: ${quality || 'standard'}, style: ${style || 'vivid'}`);

    const response = await openai.images.generate({
      model: modelToUse,
      prompt: prompt,
      n: 1, // DALL-E 3 supports n=1
      size: size || "1024x1024", // Frontend should send a valid DALL-E 3 size
      response_format: "b64_json", // Request Base64 encoded image
      quality: quality || "standard", // Pass quality from frontend or default
      style: style || "vivid",       // Pass style from frontend or default
    });

    console.log("OpenAI Proxy: Raw response from OpenAI API:", JSON.stringify(response, null, 2).substring(0, 500));

    if (response.data && response.data[0] && response.data[0].b64_json) {
      console.log("OpenAI Proxy: Received b64_json directly from API.");
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          b64_json: response.data[0].b64_json, 
          // DALL-E returns PNG when b64_json is requested.
          // https://platform.openai.com/docs/api-reference/images/create#images-create-response_format
          mime_type: 'image/png' 
        }),
      };
    } else {
      console.error("OpenAI Proxy: API response did not contain b64_json.", response.data && response.data[0] ? response.data[0] : response);
      throw new Error('OpenAI API response did not contain expected image data (b64_json).');
    }
  } catch (error) {
    console.error('OpenAI Proxy Error:', error);
    const status = error.status || 500;
    let errorMessage = error.message || `Failed to generate image with OpenAI (${"dall-e-3"}) via proxy.`;
    if (error.error && error.error.message) {
        errorMessage = error.error.message;
    }
    
    return {
      statusCode: status,
      body: JSON.stringify({ error: errorMessage, type: error.type, code: error.code, param: error.param }),
    };
  }
}
