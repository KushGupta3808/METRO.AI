import { motion } from 'framer-motion';
import { Check, ExternalLink } from 'lucide-react';
import { getProviderUrl } from '../../utils/providers';

export default function RouteCard({ route, isBest, isSelected, onSelect }) {
  const providerUrl = getProviderUrl(route.provider_name);

  function handleSend(e) {
    e.stopPropagation();
    onSelect?.(route);
    window.open(providerUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onSelect?.(route)}
      className={`glass-panel p-5 relative cursor-pointer transition-shadow ${
        isSelected ? 'border-emeraldNeon/50 shadow-glow-emerald' : isBest ? 'border-sapphireNeon/40 shadow-glow-sapphire' : ''
      }`}
    >
      {isBest && !isSelected && (
        <span className="absolute -top-2.5 left-5 text-[10px] font-mono uppercase tracking-wider bg-sapphireNeon text-void px-2 py-0.5 rounded-full">
          Best Value
        </span>
      )}
      {isSelected && (
        <span className="absolute -top-2.5 left-5 text-[10px] font-mono uppercase tracking-wider bg-emeraldNeon text-void px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
          <Check size={10} /> Selected
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
        onClick={handleSend}
        className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl border py-2 text-sm transition-colors ${
          isSelected
            ? 'border-emeraldNeon/60 text-emeraldNeon bg-emeraldNeon/10'
            : 'border-white/10 text-slate-200 hover:border-sapphireNeon/50 hover:text-sapphireNeon'
        }`}
      >
        <ExternalLink size={14} /> Send with {route.provider_name}
      </button>
      <p className="mt-2 text-[10px] font-mono text-slate-500 text-center">
        Opens {route.provider_name}'s site in a new tab
      </p>
    </motion.div>
  );
}
