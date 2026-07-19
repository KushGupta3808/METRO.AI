/**
 * Initiates a secure multi-turn chat stream via the backend proxy.
 * Mimics the original SDK response structure to prevent breaking the UI component.
 * 
 * @param {string} text - The latest user message text.
 * @param {Object} options - Contains live dashboard context: baseCurrency, targetCurrency, currentRate, rateTrend, newsFeed, history.
 * @returns {Promise<AsyncIterable<{text: () => string}>>} An async iterable mimicking the SDK stream.
 */
export async function sendMessageStream(text, options = {}) {
  // 💡 Update this URL if your backend runs on a different port or domain
  const BACKEND_URL = 'http://localhost:8000/api/v1/chat/stream';

  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, options }),
  });

  if (!response.ok) {
    throw new Error(`Server returned error status: ${response.status}`);
  }

  // Grab the raw readable stream from the HTTP response body
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // Return a custom async generator that duck-types the SDK's structure
  return (async function* () {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the binary stream chunk back into readable string tokens
      const textChunk = decoder.decode(value, { stream: true });
      
      // Yield an object with a .text() method matching what ChatWidget.jsx expects
      yield {
        text: () => textChunk
      };
    }
  })();
}