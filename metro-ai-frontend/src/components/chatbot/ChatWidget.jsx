import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, X, Send } from 'lucide-react';
import { sendMessage } from '../../services/chatService';
import { useCurrencyStore } from '../../store/useCurrencyStore';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'METRO AI online. Ask me about your corridor, rates, or whether to send now.' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const { baseCurrency, targetCurrency } = useCurrencyStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    const reply = await sendMessage(text, { baseCurrency, targetCurrency });
    setIsTyping(false);
    setMessages((m) => [...m, reply]);
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-sapphireNeon to-emeraldNeon shadow-glow-sapphire flex items-center justify-center text-void"
      >
        {isOpen ? <X size={22} /> : <Terminal size={22} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-sapphireNeon/20 bg-obsidian/90 backdrop-blur-xl shadow-glow-sapphire overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 font-mono text-xs text-sapphireNeon">
              <span className="h-2 w-2 rounded-full bg-emeraldNeon animate-pulse" />
              metro-ai:// assistant
            </div>

            <div ref={scrollRef} className="flex-1 max-h-80 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3 font-mono text-xs">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-slate-300' : 'text-emeraldNeon'}>
                  <span className="opacity-60">{m.role === 'user' ? '> you: ' : '> ai: '}</span>
                  {m.text}
                </div>
              ))}
              {isTyping && <div className="text-emeraldNeon opacity-60">&gt; ai: thinking...</div>}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/5 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your corridor..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sapphireNeon/50"
              />
              <button type="submit" className="p-2 rounded-lg bg-sapphireNeon/10 text-sapphireNeon hover:bg-sapphireNeon/20">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
