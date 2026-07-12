import { motion } from 'framer-motion';
import { TrendingUp, PauseCircle } from 'lucide-react';

export default function AIRecommendationBanner({ recommendation, summary }) {
  const isSend = recommendation?.toUpperCase() === 'SEND';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel p-5 flex items-start gap-4 border ${
        isSend ? 'border-emeraldNeon/40 shadow-glow-emerald' : 'border-amberNeon/40 shadow-glow-amber'
      }`}
    >
      <div
        className={`shrink-0 rounded-full p-3 animate-pulse-glow ${
          isSend ? 'bg-emeraldNeon/10 text-emeraldNeon' : 'bg-amberNeon/10 text-amberNeon'
        }`}
      >
        {isSend ? <TrendingUp size={22} /> : <PauseCircle size={22} />}
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">AI Recommendation</p>
        <p className={`font-display text-xl mb-1 ${isSend ? 'text-emeraldNeon' : 'text-amberNeon'}`}>
          {isSend ? 'Send Now' : 'Hold For Now'}
        </p>
        <p className="text-sm text-slate-300">{summary}</p>
      </div>
    </motion.div>
  );
}
