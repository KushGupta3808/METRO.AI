import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Landmark, AlertTriangle, Globe2, ArrowUpRight } from 'lucide-react';
import { getNewsFeed } from '../../services/marketService';
import { useCurrencyStore } from '../../store/useCurrencyStore';

const ICONS = { trend: TrendingUp, bank: Landmark, alert: AlertTriangle, globe: Globe2 };

const TONE_STYLES = {
  positive: { text: 'text-emeraldNeon', bg: 'from-emeraldNeon/25 to-emeraldDeep/10', border: 'border-emeraldNeon/20' },
  warning: { text: 'text-amberNeon', bg: 'from-amberNeon/25 to-amberNeon/5', border: 'border-amberNeon/20' },
  neutral: { text: 'text-sapphireNeon', bg: 'from-sapphireNeon/25 to-sapphireNeon/5', border: 'border-sapphireNeon/20' },
};

function NewsCardSkeleton() {
  return (
    <div className="glass-panel overflow-hidden animate-pulse">
      <div className="h-28 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </div>
    </div>
  );
}

function NewsCard({ item, index }) {
  const Icon = ICONS[item.icon] || Globe2;
  const tone = TONE_STYLES[item.tone] || TONE_STYLES.neutral;

  return (
    <motion.a
      href={item.sourceUrl}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="glass-panel overflow-hidden flex flex-col group"
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" className="h-28 w-full object-cover" />
      ) : (
        <div
          className={`h-28 w-full bg-gradient-to-br ${tone.bg} flex items-center justify-center border-b ${tone.border}`}
        >
          <Icon size={32} className={tone.text} strokeWidth={1.5} />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <span className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${tone.text}`}>{item.tag}</span>
        <p className="text-sm text-slate-100 font-medium mb-1.5 line-clamp-2">{item.headline}</p>
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">{item.summary}</p>
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-white/5">
          <span>{item.sourceLabel}</span>
          <span className={`flex items-center gap-1 ${tone.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
            Read more <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function NewsFeed() {
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getNewsFeed(baseCurrency || 'CAD', targetCurrency || 'INR').then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, [baseCurrency, targetCurrency]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wide uppercase text-slate-300">Market Feed</h2>
        <span className="text-xs font-mono text-slate-500">Updated moments ago</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : items.map((item, i) => <NewsCard key={item.id} item={item} index={i} />)}
      </div>
    </div>
  );
}