
// netlify/functions/generateBflaiImage.js
const fetch = require('node-fetch'); // Using CommonJS require

const POLLING_INTERVAL = 2500; // 2.5 秒輪詢一次
const MAX_POLLING_ATTEMPTS = 5; // 最多輪詢5次 (Netlify Functions free tier has 10s limit)

// Helper function to extract MIME type from URL if possible
function getMimeTypeFromUrl(url, fallbackMimeType = 'image/jpeg') {
  try {
    const parsedUrl = new URL(url);
    const rsct = parsedUrl.searchParams.get('rsct');
    if (rsct && rsct.startsWith('image/')) {
      return rsct;
    }
  } catch (e) {
    console.warn("BFL.ai Proxy: Could not parse image URL for MIME type, defaulting. Error:", e.message);
  }
  return fallbackMimeType;
}

async function pollForResult(pollingUrl, apiKey, attempt = 1, initialRequestOutputFormat = 'jpeg') {
  if (attempt > MAX_POLLING_ATTEMPTS) {
    console.error(`BFL.ai Proxy: Polling timed out or max attempts reached for URL: ${pollingUrl}`);
    throw new Error('Polling timed out or max attempts reached for BFL.ai image generation.');
  }

  console.log(`BFL.ai Proxy: Polling attempt ${attempt} for URL: ${pollingUrl}`);
  const pollResponse = await fetch(pollingUrl, {
    method: 'GET',
    headers: { 'x-key': apiKey },
  });

  const responseText = await pollResponse.text();
  console.log(`BFL.ai Proxy: Polling attempt ${attempt}. Status from polling URL: ${pollResponse.status}, Raw Text: ${responseText.substring(0, 300)}...`);

  if (!pollResponse.ok) {
    let errorDetail = `BFL.ai API Polling Error (Status: ${pollResponse.status}): ${pollResponse.statusText}`;
    try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.message || errorJson.error?.message || errorDetail;
    } catch (e) { /* Ignore if not JSON */ }
    console.error(`BFL.ai Proxy: Polling attempt ${attempt} failed. Detail: ${errorDetail}`);
    throw new Error(errorDetail);
  }

  try {
    const pollData = JSON.parse(responseText);
    console.log(`BFL.ai Proxy: Polling attempt ${attempt}. Parsed response data:`, JSON.stringify(pollData, null, 2).substring(0, 500));

    if (pollData.status && pollData.status.toLowerCase() === 'ready' && pollData.result && pollData.result.sample) {
      console.log(`BFL.ai Proxy: Image URL found (attempt ${attempt}): ${pollData.result.sample}. Fetching image...`);
      const imageResponse = await fetch(pollData.result.sample);
      if (!imageResponse.ok) {
        console.error(`BFL.ai Proxy: Failed to fetch image from URL: ${pollData.result.sample}. Status: ${imageResponse.status}`);
        throw new Error(`Failed to fetch image from BFL.ai sample URL (Status: ${imageResponse.status})`);
      }
      const imageBuffer = await imageResponse.buffer();
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = getMimeTypeFromUrl(pollData.result.sample, `image/${initialRequestOutputFormat}`);
      
      console.log(`BFL.ai Proxy: Successfully fetched and converted image from URL (attempt ${attempt}). MimeType: ${mimeType}`);
      return {
        image_b64: imageBase64,
        mime_type: mimeType,
        // Include other relevant data if BFL.ai provides it in the "result" object alongside "sample"
        result_details: pollData.result 
      };
    } else if (pollData.status && (pollData.status.toLowerCase() === 'processing' || pollData.status.toLowerCase() === 'pending' || pollData.status.toLowerCase() === 'queued')) {
      console.log(`BFL.ai Proxy: Polling attempt ${attempt} - Image still processing (status: ${pollData.status}). Retrying...`);
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      return pollForResult(pollingUrl, apiKey, attempt + 1, initialRequestOutputFormat);
    } else if (pollData.status && pollData.status.toLowerCase() === 'failed') {
      console.error('BFL.ai Proxy: Image generation failed according to polling API.', pollData);
      throw new Error(pollData.error_message || pollData.details || pollData.error || 'Image generation failed during polling (status: failed).');
    } else {
      console.warn(`BFL.ai Proxy: Polling attempt ${attempt} - Unexpected status or structure. Status: ${pollData.status}. Retrying... Response:`, pollData);
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      return pollForResult(pollingUrl, apiKey, attempt + 1, initialRequestOutputFormat);
    }
  } catch (e) {
    console.error(`BFL.ai Proxy: Error parsing JSON from polling URL or during polling logic (attempt ${attempt}). Raw text: "${responseText}". Error:`, e);
    // If JSON parsing fails, but it was a 200 OK, it's an unexpected format.
    // Retry polling as the API might be temporarily returning non-JSON.
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    return pollForResult(pollingUrl, apiKey, attempt + 1, initialRequestOutputFormat);
  }
}

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, width, height, prompt_upsampling, seed, safety_tolerance, output_format } = JSON.parse(event.body);
    const apiKey = process.env.BFL_AI_API_KEY_FOR_PROXY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'BFL.ai API key not configured on server (BFL_AI_API_KEY_FOR_PROXY).' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    // Explicitly set async to true if BFL.ai supports it for polling
    const requestBody = { prompt, width, height, prompt_upsampling, seed, safety_tolerance, output_format, async: true };
    const fetchOptions = {
      method: 'POST',
      headers: { 'x-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    };

    console.log("BFL.ai Proxy: Sending initial request to BFL.ai API with body:", JSON.stringify(requestBody));
    const initialBflResponse = await fetch('https://api.bfl.ai/v1/flux-pro-1.1-ultra', fetchOptions); // Updated endpoint
    const initialResponseText = await initialBflResponse.text();
    console.log(`BFL.ai Proxy: Initial response status: ${initialBflResponse.status}, Raw text: ${initialResponseText.substring(0, 500)}`);

    if (!initialBflResponse.ok) {
      let errorDetail = `BFL.ai API Initial Request Error (Status: ${initialBflResponse.status}): ${initialBflResponse.statusText}`;
      try {
        const errorJson = JSON.parse(initialResponseText);
        errorDetail = errorJson.message || errorJson.error?.message || errorDetail;
      } catch (e) { /* Ignore if not JSON */ }
      console.error("BFL.ai Proxy: Initial API request failed.", { status: initialBflResponse.status, detail: errorDetail, raw: initialResponseText });
      return { statusCode: initialBflResponse.status, body: JSON.stringify({ error: errorDetail }) };
    }
    
    let initialData;
    try {
        initialData = JSON.parse(initialResponseText);
    } catch (e) {
        console.error("BFL.ai Proxy: Failed to parse JSON from initial BFL.ai response. Raw text:", initialResponseText, "Error:", e);
        return { statusCode: 500, body: JSON.stringify({ error: 'BFL.ai API returned non-JSON response initially.', details: initialResponseText.substring(0,200) }) };
    }
    console.log("BFL.ai Proxy: Initial response data:", JSON.stringify(initialData, null, 2).substring(0, 500));

    if (initialData.polling_url) {
      console.log(`BFL.ai Proxy: Received polling URL: ${initialData.polling_url}. Starting polling...`);
      // Pass the requested output_format to pollForResult to use as a fallback MIME type
      const finalData = await pollForResult(initialData.polling_url, apiKey, 1, output_format || 'jpeg');
      
      if (finalData.image_b64 && finalData.mime_type) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              image_b64: finalData.image_b64,
              mime_type: finalData.mime_type
          }),
        };
      } else {
         console.error("BFL.ai Proxy: Polling finished, but final data did not contain expected image_b64 or mime_type fields.", finalData);
        throw new Error("Polling completed but image data (image_b64/mime_type) was not found in the final response.");
      }
    } else if (initialData.image_b64 || (initialData.images && initialData.images[0] && initialData.images[0].image_b64)) {
      console.log("BFL.ai Proxy: Received image data in initial response (unexpected for a polling-based API).");
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image_b64: initialData.image_b64 || initialData.images[0].image_b64,
            mime_type: initialData.mime_type || `image/${output_format || 'jpeg'}`
        }),
      };
    } else {
      console.error("BFL.ai Proxy: Unexpected initial response structure from BFL.ai API. No polling_url and no direct image data.", initialData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get image data or polling URL from BFL.ai via proxy.', details: initialData }) };
    }

  } catch (error) {
    console.error('BFL.ai Proxy: Unhandled error in main handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate image with BFL.ai via proxy due to an internal server error.' }),
    };
  }
}
