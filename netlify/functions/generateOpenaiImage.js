// netlify/functions/generateOpenaiImage.js
const OpenAI = require('openai');
const fetch = require('node-fetch'); // For fetching image from URL

// Helper function to extract MIME type from URL or content type header
function getMimeTypeFromHeadersOrDefault(responseHeaders, fallbackUrl, defaultMimeType = 'image/png') {
  const contentType = responseHeaders.get('content-type');
  if (contentType && contentType.startsWith('image/')) {
    return contentType;
  }
  // Fallback to URL extension if content-type is missing or not an image
  if (fallbackUrl) {
    try {
      const url = new URL(fallbackUrl);
      const extension = url.pathname.split('.').pop()?.toLowerCase();
      if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
      if (extension === 'png') return 'image/png';
      if (extension === 'webp') return 'image/webp';
      if (extension === 'gif') return 'image/gif';
    } catch (e) {
      console.warn("OpenAI Proxy: Could not parse image URL for MIME type. Error:", e.message);
    }
  }
  return defaultMimeType;
}


export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, size } = JSON.parse(event.body); // Removed quality, style as they might not be supported
    const apiKey = process.env.OPENAI_API_KEY_FOR_PROXY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI API key not configured on server (OPENAI_API_KEY_FOR_PROXY).' }) };
    }
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) };
    }

    const openai = new OpenAI({ apiKey });

    console.log(`OpenAI Proxy: Requesting image with model "gpt-image-1", prompt: "${prompt}", size: ${size || "1024x1024"}`);

    const response = await openai.images.generate({
      model: "gpt-image-1", // User requested model
      prompt: prompt,
      n: 1,
      size: size || "1024x1024", // Default size, ensure this is valid for "gpt-image-1"
      // response_format: "b64_json", // Removed as it caused errors with "gpt-image-1"
      // quality: quality, // Removed
      // style: style,     // Removed
    });

    console.log("OpenAI Proxy: Raw response from OpenAI API:", JSON.stringify(response, null, 2).substring(0, 500));

    if (response.data && response.data[0]) {
      if (response.data[0].b64_json) {
        // If API directly returns b64_json (unexpected for default but good to handle)
        console.log("OpenAI Proxy: Received b64_json directly from API.");
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ b64_json: response.data[0].b64_json, mime_type: 'image/png' }), // Assuming PNG if b64
        };
      } else if (response.data[0].url) {
        // If API returns a URL, fetch the image and convert to Base64
        const imageUrl = response.data[0].url;
        console.log(`OpenAI Proxy: Received image URL: ${imageUrl}. Fetching image...`);

        const imageFetchResponse = await fetch(imageUrl);
        if (!imageFetchResponse.ok) {
          console.error(`OpenAI Proxy: Failed to fetch image from URL: ${imageUrl}. Status: ${imageFetchResponse.status}`);
          throw new Error(`Failed to fetch image from OpenAI URL (Status: ${imageFetchResponse.status})`);
        }

        const imageBuffer = await imageFetchResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = getMimeTypeFromHeadersOrDefault(imageFetchResponse.headers, imageUrl);
        
        console.log(`OpenAI Proxy: Successfully fetched and converted image from URL. MimeType: ${mimeType}`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ b64_json: imageBase64, mime_type: mimeType }),
        };
      } else {
        console.error("OpenAI Proxy: API response did not contain b64_json or url.", response.data[0]);
        throw new Error('OpenAI API response did not contain expected image data (b64_json or url).');
      }
    } else {
      console.error("OpenAI Proxy: Unexpected response structure from OpenAI API. No data or data[0] found.", response);
      throw new Error('Failed to get image data from OpenAI via proxy (unexpected response structure).');
    }
  } catch (error) {
    console.error('OpenAI Proxy Error:', error);
    // Attempt to return a more structured error if possible
    const status = error.status || 500;
    let errorMessage = error.message || 'Failed to generate image with OpenAI (gpt-image-1) via proxy.';
    if (error.error && error.error.message) { // OpenAI SDK often nests error details
        errorMessage = error.error.message;
    }
    
    return {
      statusCode: status,
      body: JSON.stringify({ error: errorMessage, type: error.type, code: error.code, param: error.param }),
    };
  }
}
