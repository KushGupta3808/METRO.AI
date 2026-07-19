import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Initiates a multi-turn chat stream with live dashboard metrics.
 * @returns {Promise<AsyncIterable<GenerateContentResponse>>} The live stream object.
 */
export async function sendMessageStream(text, options = {}) {
  const {
    baseCurrency = 'CAD',
    targetCurrency = 'INR',
    currentRate = 'unknown',
    rateTrend = 'stable',
    newsFeed = [],
    history = []
  } = options;

  const systemInstruction = `
    You are Metro AI, an elite, highly intuitive digital remittance and FX co-pilot. Your tone is warm, peer-to-peer, professional, and grounded.

    CURRENT REAL-TIME DASHBOARD CONTEXT:
    - Active Trade Corridor: ${baseCurrency} to ${targetCurrency}
    - Live Mid-Market Rate: ${currentRate} ${targetCurrency} per 1 ${baseCurrency}
    - Current Vector Trend: The rate is moving in a ${rateTrend} direction lately.
    - Local Market News Bulletins: ${JSON.stringify(newsFeed)}

    OPERATIONAL EXECUTION RULES:
    1. Always anchor your answers on the live rate (${currentRate}) and the vector trend (${rateTrend}).
    2. Weave relevant news items naturally into your dialogue.
    3. Format your advice with beautiful, clean Markdown. Use double asterisks (**word**) to emphasize crucial points. 
    4. Use brief, bulleted lists for clear structural breakdowns. Keep everything highly scannable.
  `;

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: systemInstruction,
  });

  // Safe slice to drop assistant items preceding the first user input
  const firstUserIndex = history.findIndex(msg => msg.role === 'user');
  const historyToFormat = firstUserIndex !== -1 ? history.slice(firstUserIndex, -1) : [];

  const formattedHistory = historyToFormat.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({
    history: formattedHistory,
  });

  // 🚀 Change from sendMessage to the live streaming variant
  const result = await chat.sendMessageStream(text);
  
  // Return the raw readable stream object directly to the UI
  return result.stream;
}