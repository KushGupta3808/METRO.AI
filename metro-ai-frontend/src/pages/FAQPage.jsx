import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does METRO AI decide SEND vs HOLD?',
    a: 'The routing engine analyzes live market rates and short-term volatility for your corridor, then uses Gemini 2.0 Flash to generate a directive and a plain-language summary of why.',
  },
  {
    q: 'Which countries are supported?',
    a: 'The compare engine currently focuses on a handful of high-volume corridors, with more currencies and payout methods being added as the backend expands.',
  },
  {
    q: 'How long do transfers take?',
    a: 'It depends on the provider and payout method you pick in the Compare tab - anywhere from minutes for mobile wallets to a couple of business days for bank deposits.',
  },
  {
    q: 'Is my money safe?',
    a: 'METRO AI does not hold your funds directly - it routes you to licensed transfer providers and simply tracks the ledger of what you have sent.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-slate-100 mb-1">FAQs</h1>
      <p className="text-sm text-slate-400 mb-6">Quick answers about METRO AI.</p>
      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="glass-panel overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm text-slate-100">{item.q}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-slate-400" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 overflow-hidden"
                  >
                    <p className="text-sm text-slate-400 pb-4">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
