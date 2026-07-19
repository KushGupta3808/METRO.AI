import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Gemini client safely hidden on the server instance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat/stream', async (req, res) => {
  const { text, options = {} } = req.body;
  const {
    baseCurrency = 'CAD',
    targetCurrency = 'INR',
    currentRate = 'unknown',
    rateTrend = 'stable',
    newsFeed = [],
    history = []
  } = options;

  const systemInstruction = `
    You are Metro AI, an elite remit/FX co-pilot. Anchor responses on live rate (${currentRate}) and vector trend (${rateTrend}). Use clean Markdown formatting.
  `;

  try {
    // 🚀 Set HTTP headers for Chunked Transfer Encoding stream processing
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    const firstUserIndex = history.findIndex(msg => msg.role === 'user');
    const historyToFormat = firstUserIndex !== -1 ? history.slice(firstUserIndex, -1) : [];
    
    const formattedHistory = historyToFormat.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    
    // Request stream from Google's servers
    const result = await chat.sendMessageStream(text);

    // Pump chunks down the server response channel as soon as they hit the server
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    
    res.end();
  } catch (error) {
    console.error("Backend Remittance Chat Proxy Error:", error);
    res.status(500).write("Remittance connection error occurred.");
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔒 Remittance Secure Server active on port ${PORT}`));