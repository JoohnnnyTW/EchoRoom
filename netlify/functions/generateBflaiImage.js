
// netlify/functions/generateBflaiImage.js
const fetch = require('node-fetch'); // Using CommonJS require

const POLLING_INTERVAL = 3000; // 3 秒輪詢一次
const MAX_POLLING_ATTEMPTS = 5; // 最多輪詢5次 (總共約 10-12.5 秒，需在 Netlify Function 10秒限制附近)
                               // Netlify Functions on the free tier have a 10-second execution limit.
                               // Paid tiers can go up to 26 seconds for background functions.
                               // Adjust attempts if your BFL.ai generation is consistently slow.

async function pollForResult(pollingUrl, apiKey, attempt = 1) {
  if (attempt > MAX_POLLING_ATTEMPTS) {
    console.error(`BFL.ai Proxy: Polling timed out or max attempts reached for URL: ${pollingUrl}`);
    throw new Error('Polling timed out or max attempts reached.');
  }

  console.log(`BFL.ai Proxy: Polling attempt ${attempt} for URL: ${pollingUrl}`);
  const pollResponse = await fetch(pollingUrl, {
    method: 'GET',
    headers: { 'x-key': apiKey },
  });

  const responseText = await pollResponse.text(); // Get raw text first
  console.log(`BFL.ai Proxy: Polling attempt ${attempt}. Status from polling URL: ${pollResponse.status}, Raw Text: ${responseText.substring(0, 200)}...`);


  if (!pollResponse.ok) {
     // Try to parse error if it's JSON, otherwise use statusText
    let errorDetail = `BFL.ai API Polling Error: ${pollResponse.statusText}`;
    try {
        const errorJson = JSON.parse(responseText);
        if (errorJson && errorJson.message) {
            errorDetail = errorJson.message;
        } else if (errorJson && errorJson.error && errorJson.error.message) {
            errorDetail = errorJson.error.message;
        }
    } catch (e) {
        // Not a JSON error, stick with statusText or raw response
        console.warn("BFL.ai Proxy: Polling response was not JSON, status:", pollResponse.status);
    }
    console.error(`BFL.ai Proxy: Polling attempt ${attempt} failed. Status: ${pollResponse.status}, Detail: ${errorDetail}`);
    throw new Error(`Polling failed with status ${pollResponse.status}: ${errorDetail}`);
  }

  try {
    const pollData = JSON.parse(responseText);
    console.log(`BFL.ai Proxy: Polling attempt ${attempt}. Response data:`, JSON.stringify(pollData, null, 2).substring(0, 500));


    // Check common success indicators for image data
    // BFL.ai might change their response structure for polling, common patterns are:
    // 1. `status: "completed"` or `status: "succeeded"` and image data present
    // 2. Direct image data fields like `image_b64` or `images` array
    // 3. Absence of further `polling_url` or `status: "processing"`

    if (pollData.image_b64 || (pollData.images && pollData.images.length > 0 && pollData.images[0].image_b64)) {
      console.log(`BFL.ai Proxy: Image ready from polling URL (attempt ${attempt}).`);
      return pollData; // Image is ready
    } else if (pollData.status && (pollData.status.toLowerCase() === 'processing' || pollData.status.toLowerCase() === 'pending')) {
      // Still processing, continue polling
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      return pollForResult(pollingUrl, apiKey, attempt + 1);
    } else if (pollData.status && pollData.status.toLowerCase() === 'failed') {
      console.error('BFL.ai Proxy: Image generation failed according to polling API.', pollData);
      throw new Error(pollData.error_message || pollData.error || 'Image generation failed during polling.');
    } else {
      // If no clear image data and no clear "processing" status, it might be an unexpected successful structure
      // or a subtle failure. Let's assume for now if it's not processing and no image, it's an issue.
      console.warn(`BFL.ai Proxy: Polling attempt ${attempt} - Image not ready, but no clear "processing" status. Response:`, pollData);
      // Depending on BFL.ai's specific polling responses, you might need to adjust this logic.
      // For now, if not explicitly processing and no image, we continue polling up to max attempts.
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      return pollForResult(pollingUrl, apiKey, attempt + 1);
    }
  } catch (e) {
    console.error(`BFL.ai Proxy: Error parsing JSON from polling URL or during polling logic (attempt ${attempt}). Raw text: "${responseText}". Error:`, e);
    // If JSON parsing fails, but it was a 200 OK, it's an unexpected format.
    // It's safer to retry polling a few times if the format is just temporarily weird.
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    return pollForResult(pollingUrl, apiKey, attempt + 1);
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

    const requestBody = { prompt, width, height, prompt_upsampling, seed, safety_tolerance, output_format, async: true }; // Added async: true
    const fetchOptions = {
      method: 'POST',
      headers: { 'x-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    };

    console.log("BFL.ai Proxy: Sending initial request to BFL.ai API with body:", JSON.stringify(requestBody));
    const initialBflResponse = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', fetchOptions);
    const initialResponseText = await initialBflResponse.text(); // Get raw text first
    console.log(`BFL.ai Proxy: Initial response status: ${initialBflResponse.status}, Raw text: ${initialResponseText.substring(0, 500)}`);


    if (!initialBflResponse.ok) {
      let errorDetail = `BFL.ai API Initial Request Error: ${initialBflResponse.statusText}`;
      try {
        const errorJson = JSON.parse(initialResponseText);
         if (errorJson && errorJson.message) {
            errorDetail = errorJson.message;
        } else if (errorJson && errorJson.error && errorJson.error.message) {
            errorDetail = errorJson.error.message;
        }
      } catch (e) {
          console.warn("BFL.ai Proxy: Initial error response was not JSON, status:", initialBflResponse.status);
      }
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
      const finalData = await pollForResult(initialData.polling_url, apiKey);
      // Assuming pollForResult returns data in the same structure as an immediate successful response
       if (finalData.image_b64 || (finalData.images && finalData.images[0] && finalData.images[0].image_b64)) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              image_b64: finalData.image_b64 || finalData.images[0].image_b64,
              mime_type: finalData.mime_type || `image/${output_format || 'jpeg'}`
          }),
        };
      } else {
         console.error("BFL.ai Proxy: Polling finished, but final data did not contain expected image fields.", finalData);
        throw new Error("Polling completed but image data was not found in the final response.");
      }
    } else if (initialData.image_b64 || (initialData.images && initialData.images[0] && initialData.images[0].image_b64)) {
      // Immediate response with image (less likely now, but handle just in case)
      console.log("BFL.ai Proxy: Received image data in initial response (unexpected for polling API).");
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image_b64: initialData.image_b64 || initialData.images[0].image_b64,
            mime_type: initialData.mime_type || `image/${output_format || 'jpeg'}`
        }),
      };
    } else {
      console.error("BFL.ai Proxy: Unexpected initial response structure from BFL.ai API. No polling_url and no image_b64.", initialData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get image data or polling URL from BFL.ai via proxy.', details: initialData }) };
    }

  } catch (error) {
    console.error('BFL.ai Proxy: Unhandled error in main handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate image with BFL.ai via proxy due to an internal error.' }),
    };
  }
}
