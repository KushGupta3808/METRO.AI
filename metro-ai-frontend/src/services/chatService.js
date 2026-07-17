// src/services/chatService.js

// 🔴 PASTE YOUR NEW 'AQ.' KEY DIRECTLY INSIDE THESE QUOTES:
const GEMINI_API_KEY = "REMOVED_SECRET"; 

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Sends chat messages directly to Google's Gemini LLM.
 */
export async function sendMessage(userMessage, corridorContext = {}) {
  const { baseCurrency = 'CAD', targetCurrency = 'INR' } = corridorContext;

  // Simple, unconfusing guard clause
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return {
      role: 'assistant',
      text: "⚠️ CONFIGURATION ERROR: You still need to paste your API key inside the quotes at the very top of 'src/services/chatService.js'!"
    };
  }

  const systemInstruction = `
    You are Metro AI, a warm, highly empathetic human financial advisor and remittance expert. 
    Your job is to help the user navigate sending money from ${baseCurrency} to ${targetCurrency}.
    
    CRITICAL RULES:
    1. NEVER sound like a robot, system log, or machine.
    2. Speak like a helpful, grounded peer. Use phrases like "If I were you...", "I'd suggest waiting...", or "Honestly, it looks like...".
    3. Keep answers concise and conversational (max 2-3 short paragraphs).
  `;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiMessage = errorData.error?.message || `HTTP Status ${response.status}`;
      throw new Error(`Google API rejected: ${apiMessage}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      role: 'assistant',
      text: aiText || "I received an empty response. Try rephrasing!"
    };

  } catch (error) {
    console.error("Gemini API Error details:", error);
    return {
      role: 'assistant',
      text: `❌ CONNECTION ERROR: ${error.message}`
    };
  }
}