// src/services/chatService.js

// Reads the key from your .env file — never hardcode it here.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 🚀 The active model we are pointing to:
const MODEL_NAME = "gemini-3.5-flash";

/**
 * Sends chat messages directly to Google's Gemini LLM.
 */
export async function sendMessage(userMessage, corridorContext = {}) {
  const { baseCurrency = 'CAD', targetCurrency = 'INR' } = corridorContext;

  // Simple guard clause to prevent running with a missing key
  if (!GEMINI_API_KEY) {
    return {
      role: 'assistant',
      text: "⚠️ CONFIGURATION ERROR: VITE_GEMINI_API_KEY is missing. Add it to your .env file."
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

  const dynamicUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(dynamicUrl, {
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
          maxOutputTokens: 1000,
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