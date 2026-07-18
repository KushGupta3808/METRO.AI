import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // 👈 2. Markdown Parser Installed
import { sendMessage } from '../../services/chatService';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { getRateSeries, getNewsFeed } from '../../services/marketService'; // 👈 1. News Feed Imported

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

  // Pull user preferences from your store
  const { baseCurrency, targetCurrency } = useCurrencyStore();

  // Component States for live dynamic data
  const [currentRate, setCurrentRate] = useState('unknown');
  const [rateTrend, setRateTrend] = useState('stable');
  const [newsFeed, setNewsFeed] = useState([]); // 👈 1. Added State for News Articles

  // Synchronize dynamic financial context
  useEffect(() => {
    const base = baseCurrency || 'CAD';
    const target = targetCurrency || 'INR';

    // Fetch Rate Metrics
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

    // 👈 1. Fetch Related Market Bulletin News
    getNewsFeed(target)
      .then((news) => {
        setNewsFeed(news);
      })
      .catch((err) => console.error("News sync failed:", err));

  }, [baseCurrency, targetCurrency]);

  // Bulletproof smooth scroll to the newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Create the updated message log snapshot
    const newUserMessage = { role: 'user', text };
    const historicalSnapshot = [...messages, newUserMessage]; // 👈 3. Build Full Conversation Thread

    // Push user message directly into UI
    setMessages(historicalSnapshot);
    setInput('');
    setIsTyping(true);

    try {
      // 🚀 1 & 3. Passing complete structural memory and macro text bulletins
      const reply = await sendMessage(text, { 
        baseCurrency, 
        targetCurrency,
        currentRate, 
        rateTrend,
        newsFeed,         // 👈 Sent to LLM Context
        history: historicalSnapshot // 👈 Sent for Conversational Memory
      });
      setMessages((m) => [...m, reply]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((m) => [
        ...m, 
        { 
          role: 'assistant', 
          text: "I'm having a small trouble connecting to the network right now. Could you try sending that message again in a moment?" 
        }
      ]);
    } finally {
      setIsTyping(false);
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
              <div>
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Metro AI Assistant</h3>
                <p className="text-[10px] text-slate-400 font-medium">Your personal remittance co-pilot</p>
              </div>
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
                    
                    <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-gradient-to-br from-sapphireNeon to-sapphireNeon/80 text-void font-semibold rounded-tr-none shadow-md' 
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      {/* 👈 2. Renders plain text for user, sleek structured Markdown layout for AI advice */}
                      {isUser ? (
                        m.text
                      ) : (
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

            {/* Input Footer */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/5 p-4 bg-white/[0.01]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about exchange rates, trends, or when to send..."
                disabled={isTyping}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sapphireNeon/50 focus:ring-1 focus:ring-sapphireNeon/30 transition-all disabled:opacity-50"
              />
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