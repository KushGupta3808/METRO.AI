import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function RouteCard({ route, isBest, isSelected, onSelect }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`glass-panel p-5 relative cursor-pointer transition-shadow ${
        isSelected ? 'border-emeraldNeon/50 shadow-glow-emerald' : isBest ? 'border-sapphireNeon/40 shadow-glow-sapphire' : ''
      }`}
      onClick={() => onSelect?.(route)}
    >
      {isBest && !isSelected && (
        <span className="absolute -top-2.5 left-5 text-[10px] font-mono uppercase tracking-wider bg-sapphireNeon text-void px-2 py-0.5 rounded-full">
          Best Value
        </span>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center font-display text-sm text-slate-200">
          {route.provider_name?.[0] ?? '?'}
        </div>
        <p className="font-display text-slate-100">{route.provider_name}</p>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Exchange rate</span>
          <span className="font-mono text-slate-200">{route.exchange_rate}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Recipient gets</span>
          <span className="font-mono text-slate-100">{route.total_delivery_amount}</span>
        </div>
        {route.delivery_time && (
          <div className="flex justify-between text-slate-400">
            <span>Delivery time</span>
            <span className="font-mono text-slate-200">{route.delivery_time}</span>
          </div>
        )}
      </div>
      <button
        className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl border py-2 text-sm transition-colors ${
          isSelected
            ? 'border-emeraldNeon/60 text-emeraldNeon bg-emeraldNeon/10'
            : 'border-white/10 text-slate-200 hover:border-sapphireNeon/50 hover:text-sapphireNeon'
        }`}
      >
        <Check size={14} /> {isSelected ? 'Selected' : 'Select route'}
      </button>
    </motion.div>
  );
}
