import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import { getBulletin } from '../../services/marketService';
import { useCurrencyStore } from '../../store/useCurrencyStore';

const TONE_STYLES = {
  positive: 'border-emeraldNeon/30 text-emeraldNeon',
  warning: 'border-amberNeon/30 text-amberNeon',
  neutral: 'border-sapphireNeon/30 text-sapphireNeon',
};

export default function Bulletin() {
  const { targetCurrency } = useCurrencyStore();
  const [items, setItems] = useState([]);

  useEffect(() => {
    getBulletin(targetCurrency || 'INR').then(setItems);
  }, [targetCurrency]);

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 mb-4 text-slate-300">
        <Newspaper size={16} />
        <h2 className="font-display text-sm tracking-wide uppercase">Today's Bulletin</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border bg-white/[0.02] px-4 py-3 text-sm text-slate-200 ${TONE_STYLES[item.tone]}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-80 mr-2">{item.tag}</span>
            {item.headline}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
