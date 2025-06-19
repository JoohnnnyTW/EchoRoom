// netlify/functions/generateFluxKontextImage.js
const fetch = require('node-fetch');

const POLLING_INTERVAL_MS = 2500; // 2.5 seconds
const MAX_POLLING_ATTEMPTS = 10; // Reduced from 20 to 10
const FLUX_KONTEXT_MAX_ENDPOINT = 'https://api.bfl.ai/v1/flux-kontext-max';

function getMimeTypeFromFluxOutputFormat(outputFormat, fallback = 'image/png') {
  if (outputFormat === 'jpeg') return 'image/jpeg';
  if (outputFormat === 'png') return 'image/png';
  return fallback;
}

async function pollForResult(pollingUrl, apiKey, attempt = 1, requestedOutputFormat = 'png') {
  if (attempt > MAX_POLLING_ATTEMPTS) {
    console.error(`Flux Kontext Max Proxy: Polling timed out or max attempts reached for URL: ${pollingUrl}`);
    throw new Error('Polling timed out for Flux Kontext Max image generation.');
  }

  console.log(`Flux Kontext Max Proxy: Polling attempt ${attempt} for URL: ${pollingUrl}`);
  const pollResponse = await fetch(pollingUrl, {
    method: 'GET',
    headers: { 'x-key': apiKey },
  });

  const responseText = await pollResponse.text();
  console.log(`Flux Kontext Max Proxy: Polling attempt ${attempt}. Status: ${pollResponse.status}, Raw Text: ${responseText.substring(0, 300)}...`);

  if (!pollResponse.ok) {
    let errorDetail = `Flux Kontext Max API Polling Error (Status: ${pollResponse.status}): ${pollResponse.statusText}`;
    try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorDetail;
    } catch (e) { /* Ignore if not JSON */ }
    console.error(`Flux Kontext Max Proxy: Polling attempt ${attempt} failed. Detail: ${errorDetail}`);
    throw new Error(errorDetail);
  }

  try {
    const pollData = JSON.parse(responseText);
    
    if (pollData.status && pollData.status.toLowerCase() === 'ready' && pollData.result && pollData.result.sample) {
      console.log(`Flux Kontext Max Proxy: Image URL found (attempt ${attempt}): ${pollData.result.sample}. Fetching...`);
      const imageResponse = await fetch(pollData.result.sample);
      if (!imageResponse.ok) throw new Error(`Failed to fetch image from BFL.ai sample URL (Status: ${imageResponse.status})`);
      const imageBuffer = await imageResponse.buffer();
      return {
        image_b64: imageBuffer.toString('base64'),
        mime_type: getMimeTypeFromFluxOutputFormat(requestedOutputFormat),
      };
    } 
    else if (pollData.image_b64 && pollData.mime_type) { // Direct image data in polling response
       console.log(`Flux Kontext Max Proxy: Direct image data found in polling response (attempt ${attempt}).`);
       return { image_b64: pollData.image_b64, mime_type: pollData.mime_type };
    }
    else if (pollData.status && (pollData.status.toLowerCase() === 'processing' || pollData.status.toLowerCase() === 'pending' || pollData.status.toLowerCase() === 'queued')) {
      console.log(`Flux Kontext Max Proxy: Polling attempt ${attempt} - Image still processing (status: ${pollData.status}). Retrying...`);
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      return pollForResult(pollingUrl, apiKey, attempt + 1, requestedOutputFormat);
    } 
    else if (pollData.status && pollData.status.toLowerCase() === 'failed') {
      console.error('Flux Kontext Max Proxy: Image generation failed via polling.', pollData);
      throw new Error(pollData.error_message || pollData.detail || pollData.error || 'Image generation failed (status: failed).');
    }
    else if (typeof pollData === 'string' && (pollData.startsWith('http://') || pollData.startsWith('https://'))) { 
        console.log(`Flux Kontext Max Proxy: Polling returned direct image URL (attempt ${attempt}): ${pollData}. Fetching...`);
        const imageResponse = await fetch(pollData);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image from direct URL (Status: ${imageResponse.status})`);
        const imageBuffer = await imageResponse.buffer();
        return {
          image_b64: imageBuffer.toString('base64'),
          mime_type: getMimeTypeFromFluxOutputFormat(requestedOutputFormat),
        };
    }
    else {
      console.warn(`Flux Kontext Max Proxy: Polling attempt ${attempt} - Unexpected status or structure. Status: ${pollData.status}. Response:`, pollData, "Retrying...");
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      return pollForResult(pollingUrl, apiKey, attempt + 1, requestedOutputFormat);
    }
  } catch (e) {
    console.error(`Flux Kontext Max Proxy: Error parsing JSON or during polling logic (attempt ${attempt}). Raw: "${responseText}". Error:`, e);
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    return pollForResult(pollingUrl, apiKey, attempt + 1, requestedOutputFormat);
  }
}

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { 
        prompt, 
        input_image_base64, // Renamed from input_image for clarity
        control_images_base64, // New: array of base64 strings
        style_images_base64,   // New: array of base64 strings
        aspect_ratio, 
        output_format, 
        seed, 
        prompt_upsampling, 
        safety_tolerance 
    } = JSON.parse(event.body);

    const apiKey = process.env.BFL_AI_API_KEY_FOR_PROXY;

    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'BFL.ai API key for proxy not configured.' }) };
    if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    if (!input_image_base64 && (!control_images_base64 || control_images_base64.length === 0) && (!style_images_base64 || style_images_base64.length === 0) ) {
        // Requires at least a prompt. For image-to-image or fusion, input_image is primary.
        // If it's text-to-image, input_image_base64 might be undefined.
        // If it's pure text-to-image (no input_image_base64), Flux might have different requirements or endpoint.
        // Assuming for fusion/style transfer, input_image_base64 is the main content.
        // For now, allow text-to-image by not erroring if only prompt is present.
    }


    const requestBody = {
      prompt,
      ...(input_image_base64 && { input_image: input_image_base64 }),
      ...(control_images_base64 && control_images_base64.length > 0 && { control_images: control_images_base64 }),
      ...(style_images_base64 && style_images_base64.length > 0 && { style_images: style_images_base64 }),
      ...(aspect_ratio && { aspect_ratio }),
      output_format: output_format || 'png',
      ...(seed !== null && seed !== undefined && { seed }),
      prompt_upsampling: prompt_upsampling !== undefined ? prompt_upsampling : false,
      safety_tolerance: safety_tolerance !== undefined ? safety_tolerance : 2,
    };

    console.log("Flux Kontext Max Proxy: Sending initial request with body:", JSON.stringify(Object.keys(requestBody))); // Log keys to avoid large base64 strings
    const initialBflResponse = await fetch(FLUX_KONTEXT_MAX_ENDPOINT, {
      method: 'POST',
      headers: { 'x-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const initialResponseText = await initialBflResponse.text();
    console.log(`Flux Kontext Max Proxy: Initial response status: ${initialBflResponse.status}, Raw: ${initialResponseText.substring(0, 500)}`);

    if (!initialBflResponse.ok) {
      let errorDetail = `Flux Kontext Max API Error (Status: ${initialBflResponse.status}): ${initialBflResponse.statusText}`;
      try {
        const errorJson = JSON.parse(initialResponseText);
        errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorDetail;
      } catch (e) { /* Ignore */ }
      console.error("Flux Kontext Max Proxy: Initial API request failed.", { status: initialBflResponse.status, detail: errorDetail });
      return { statusCode: initialBflResponse.status, body: JSON.stringify({ error: errorDetail }) };
    }
    
    let initialData;
    try {
        initialData = JSON.parse(initialResponseText);
    } catch (e) {
        console.error("Flux Kontext Max Proxy: Failed to parse initial JSON. Raw:", initialResponseText, "Error:", e);
        return { statusCode: 500, body: JSON.stringify({ error: 'Flux API returned non-JSON.', details: initialResponseText.substring(0,200) }) };
    }

    if (initialData.polling_url) {
      console.log(`Flux Kontext Max Proxy: Polling URL: ${initialData.polling_url}. Starting poll...`);
      const finalData = await pollForResult(initialData.polling_url, apiKey, 1, requestBody.output_format);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      };
    } 
    else if (initialData.image_b64 && initialData.mime_type) {
      console.log("Flux Kontext Max Proxy: Direct image data in initial response.");
       return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: initialData.image_b64, mime_type: initialData.mime_type }),
      };
    }
    else {
      console.error("Flux Kontext Max Proxy: No polling_url or direct image in initial response.", initialData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to get polling URL or image data from Flux.', details: initialData }) };
    }

  } catch (error) {
    console.error('Flux Kontext Max Proxy: Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error in Flux proxy.' }),
    };
  }
}