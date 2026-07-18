import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function sendMessage(text, options = {}) {
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
    4. Use brief, bulleted lists for clear structural breakdowns.
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: systemInstruction,
    });

    // 💡 FIX: Find where the user actually starts talking so we don't send an assistant message first
    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    
    // Slice from the first user message up until (but excluding) the current input
    const historyToFormat = firstUserIndex !== -1 ? history.slice(firstUserIndex, -1) : [];

    const formattedHistory = historyToFormat.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(text);
    const responseText = result.response.text();

    return {
      role: 'assistant',
      text: responseText,
    };
  } catch (error) {
    console.error('Gemini API Error inside chatService:', error);
    throw error;
  }
}