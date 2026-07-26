import { motion } from 'framer-motion';
import { ExternalLink, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

export default function RouteCard({ route, isBest, isSending, onSend }) {
  const days = route.transfer_time_days;
  const timeLabel = days == null ? route.delivery_time : days <= 1 ? '1 day' : `${days} days`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`glass-panel p-5 relative transition-shadow ${
        isBest ? 'border-sapphireNeon/40 shadow-glow-sapphire' : ''
      }`}
    >
      {isBest && (
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
        {(route.fixed_fee != null || route.fee != null) && (
          <div className="flex justify-between text-slate-400">
            <span>Fee</span>
            <span className="font-mono text-slate-200">
              {(route.fixed_fee ?? route.fee) === 0 ? 'Free' : (route.fixed_fee ?? route.fee)}
            </span>
          </div>
        )}
        {timeLabel && (
          <div className="flex justify-between text-slate-400">
            <span>Delivery time</span>
            <span className="font-mono text-slate-200">{timeLabel}</span>
          </div>
        )}
      </div>

      {route.requires_kyc_verification && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-amberNeon">
          <ShieldAlert size={12} /> Requires ID verification
        </p>
      )}
      {route.regulatory_warning && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-mono text-amberNeon">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {route.regulatory_warning}
        </p>
      )}

      <button
        onClick={() => onSend(route)}
        disabled={isSending}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm text-slate-200 hover:border-sapphireNeon/50 hover:text-sapphireNeon transition-colors disabled:opacity-60"
      >
        {isSending ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
        {isSending ? 'Logging...' : `Send with ${route.provider_name}`}
      </button>
      <p className="mt-2 text-[10px] font-mono text-slate-500 text-center">
        Opens {route.provider_name}'s site and logs this to your ledger
      </p>
    </motion.div>
  );
}