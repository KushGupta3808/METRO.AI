import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMessageStream } from '../../services/chatService';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { getRateSeries, getNewsFeed } from '../../services/marketService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { stripMarkdownForSpeech } from '../../utils/stripMarkdownForSpeech';

const VOICE_PREF_KEY = 'metro-ai-voice-replies-enabled';
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "Hey! I'm your Metro AI advisor. Let me know what corridor you're looking at, and I'll help you figure out if now is the smartest time to make your transfer." 
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  // Pull user preferences from store
  const { baseCurrency, targetCurrency } = useCurrencyStore();

  // Component States for live dynamic data
  const [currentRate, setCurrentRate] = useState('unknown');
  const [rateTrend, setRateTrend] = useState('stable');
  const [newsFeed, setNewsFeed] = useState([]);

  // Voice replies (text-to-speech) - defaults on, remembered per browser.
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(VOICE_PREF_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(VOICE_PREF_KEY, String(isVoiceEnabled));
  }, [isVoiceEnabled]);

  function speak(markdownText) {
    if (!isSpeechSynthesisSupported || !markdownText.trim()) return;
    window.speechSynthesis.cancel(); // don't let replies overlap
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(markdownText));
    window.speechSynthesis.speak(utterance);
  }

  function toggleVoiceReplies() {
    setIsVoiceEnabled((prev) => {
      const next = !prev;
      if (!next && isSpeechSynthesisSupported) window.speechSynthesis.cancel();
      return next;
    });
  }

  // Voice input (speech-to-text). Deliberately populates the input box
  // rather than auto-sending - for a finance app, a misheard amount or
  // currency ("500" heard as "5000") should get a chance to be reviewed
  // before it's sent anywhere, not fired off automatically.
  const {
    isSupported: isVoiceInputSupported,
    isListening,
    error: voiceInputError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onInterimResult: (text) => setInput(text),
    onFinalResult: (text) => setInput(text),
  });

  // Stop any listening/speaking the moment the widget is closed.
  useEffect(() => {
    if (isOpen) return;
    if (isListening) stopListening();
    if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize dynamic financial context
  useEffect(() => {
    const base = baseCurrency || 'CAD';
    const target = targetCurrency || 'INR';

    getRateSeries(base, target)
      .then((result) => {
        if (result?.series && result.series.length > 0) {
          const rates = result.series.map((d) => d.rate);
          const latest = rates[rates.length - 1];
          const prev = rates[rates.length - 2] ?? latest;
          const delta = latest - prev;

          setCurrentRate(latest.toFixed(3));
          setRateTrend(delta > 0 ? 'upward' : delta < 0 ? 'downward' : 'stable');
        }
      })
      .catch((err) => console.error("Rates sync failed:", err));

    getNewsFeed(base, target)
      .then((news) => setNewsFeed(news))
      .catch((err) => console.error("News sync failed:", err));

  }, [baseCurrency, targetCurrency]);

  // Bulletproof smooth scroll to the newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // 💡 Upgraded Core Dispatch Function supporting real-time streaming data chunks
  async function executeSend(textToSend) {
    const text = textToSend.trim();
    if (!text) return;

    // Create the updated message log snapshot
    const newUserMessage = { role: 'user', text };
    const historicalSnapshot = [...messages, newUserMessage];

    // Push user message directly into UI states
    setMessages(historicalSnapshot);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Await the streaming generator interface from Gemini SDK
      const stream = await sendMessageStream(text, { 
        baseCurrency, 
        targetCurrency,
        currentRate, 
        rateTrend,
        newsFeed,         
        history: historicalSnapshot 
      });

      // 2. Shut off the bouncing typing indicator the moment data starts arriving
      setIsTyping(false);

      // 3. Inject a placeholder message into the display state for the upcoming assistant tokens
      setMessages((m) => [...m, { role: 'assistant', text: '' }]);

      // 4. Iterate through the string chunks as they land from Google's servers,
      //    keeping a local accumulator alongside the state updates so the
      //    complete text is available for TTS the moment the stream ends -
      //    reading it back from state here would risk a stale closure.
      let fullText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        
        // Target the final item in the state log array and append text chunks iteratively
        setMessages((prevMessages) => {
          const updated = [...prevMessages];
          const lastIdx = updated.length - 1;
          
          updated[lastIdx] = { 
            ...updated[lastIdx], 
            text: updated[lastIdx].text + chunkText 
          };
          return updated;
        });
      }

      if (isVoiceEnabled) speak(fullText);
    } catch (error) {
      console.error("Chat Streaming API Error:", error);
      setIsTyping(false);
      setMessages((m) => [
        ...m, 
        { 
          role: 'assistant', 
          text: "I'm having a small trouble connecting to the network right now. Could you try sending that message again in a moment?" 
        }
      ]);
    }
  }

  // Handle traditional form button submissions
  function handleFormSubmit(e) {
    e.preventDefault();
    executeSend(input);
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeechSynthesisSupported) window.speechSynthesis.cancel(); // don't listen over a reply
      startListening();
    }
  }

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-sapphireNeon to-emeraldNeon shadow-[0_8px_30px_rgb(0,242,254,0.3)] flex items-center justify-center text-void transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,242,254,0.5)]"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }}>
              <MessageSquare size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* CHAT WINDOW INTERFACE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="fixed bottom-24 right-6 z-50 w-[24rem] h-[500px] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/10 bg-obsidian/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sapphireNeon to-emeraldNeon flex items-center justify-center text-void">
                  <Sparkles size={16} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emeraldNeon border-2 border-obsidian" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Metro AI Assistant</h3>
                <p className="text-[10px] text-slate-400 font-medium">Your personal remittance co-pilot</p>
              </div>
              {isSpeechSynthesisSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceReplies}
                  title={isVoiceEnabled ? 'Voice replies on - click to mute' : 'Voice replies off - click to enable'}
                  className={`shrink-0 p-2 rounded-lg transition-colors ${
                    isVoiceEnabled ? 'text-emeraldNeon bg-emeraldNeon/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              )}
            </div>

            {/* Message View Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-emeraldNeon flex items-center justify-center shrink-0">
                        <Bot size={14} />
                      </div>
                    )}
                    
                    <div className={`group relative max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-gradient-to-br from-sapphireNeon to-sapphireNeon/80 text-void font-semibold rounded-tr-none shadow-md' 
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      {isUser ? (
                        m.text
                      ) : (
                        <>
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1.5 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1.5 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="text-slate-200" {...props} />,
                              strong: ({ node, ...props }) => <strong className="text-emeraldNeon font-semibold" {...props} />,
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                          {isSpeechSynthesisSupported && m.text && (
                            <button
                              type="button"
                              onClick={() => speak(m.text)}
                              title="Read this message aloud"
                              className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-obsidian border border-white/10 text-slate-400 hover:text-emeraldNeon"
                            >
                              <Volume2 size={11} />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {isUser && (
                      <div className="h-7 w-7 rounded-lg bg-sapphireNeon/20 text-sapphireNeon flex items-center justify-center shrink-0 border border-sapphireNeon/20">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-emeraldNeon flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white/5 border border-white/10 text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-1.5">
                    <span>Typing advice</span>
                    <span className="flex gap-1 items-center justify-center">
                      <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* QUICK ACTION SUGGESTION CHIPS (Hidden while bot is actively typing) */}
            {!isTyping && (
              <div className="flex gap-2 overflow-x-auto px-5 pb-2 shrink-0 scrollbar-none custom-scrollbar">
                <button
                  type="button"
                  onClick={() => executeSend(`Is right now an optimal time to make a transfer for ${baseCurrency || 'CAD'} to ${targetCurrency || 'INR'}?`)}
                  className="shrink-0 text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300 rounded-full px-3 py-1.5 hover:bg-sapphireNeon/10 hover:border-sapphireNeon/30 active:scale-95 transition-all duration-200"
                >
                  💡 Should I send now?
                </button>
                <button
                  type="button"
                  onClick={() => executeSend(`Can you break down the current ${rateTrend} market trend for this pair?`)}
                  className="shrink-0 text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300 rounded-full px-3 py-1.5 hover:bg-sapphireNeon/10 hover:border-sapphireNeon/30 active:scale-95 transition-all duration-200"
                >
                  📈 Analyze trend
                </button>
                <button
                  type="button"
                  onClick={() => executeSend("Give me a quick summary of the latest news bulletins affecting my trade.")}
                  className="shrink-0 text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300 rounded-full px-3 py-1.5 hover:bg-sapphireNeon/10 hover:border-sapphireNeon/30 active:scale-95 transition-all duration-200"
                >
                  📰 Summarize news
                </button>
              </div>
            )}

            {voiceInputError && (
              <p className="px-5 pb-1 text-[11px] font-mono text-amberNeon">{voiceInputError}</p>
            )}

            {/* Input Footer */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 border-t border-white/5 p-4 bg-white/[0.01]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask about exchange rates, trends, or when to send...'}
                disabled={isTyping}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sapphireNeon/50 focus:ring-1 focus:ring-sapphireNeon/30 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleMicClick}
                disabled={!isVoiceInputSupported || isTyping}
                title={
                  !isVoiceInputSupported
                    ? "Voice input isn't supported in this browser - try Chrome, Edge, or Safari."
                    : isListening
                      ? 'Stop listening'
                      : 'Speak your message'
                }
                className={`shrink-0 p-3 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-sapphireNeon/40 hover:text-sapphireNeon'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void hover:opacity-90 transition-all disabled:opacity-30 disabled:hover:opacity-30 shrink-0 shadow-md"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}