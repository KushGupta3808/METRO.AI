import React from 'react';

/**
 * RouteCard Component - Renders individual remittance channels with
 * native HTML link navigation to bypass browser popup blockers and overlapping elements.
 */
export default function RouteCard({ route, idx, source, target, onSelect }) {
  // Extract currencies from redirection url as a fallback if props are missing
  let fallbackSource = source || 'CAD';
  let fallbackTarget = target || 'INR';
  
  if (route.redirection_url) {
    try {
      const url = new URL(route.redirection_url);
      const srcParam = url.searchParams.get('sourceCurrency') || url.searchParams.get('source');
      const tgtParam = url.searchParams.get('targetCurrency') || url.searchParams.get('target');
      if (srcParam) fallbackSource = srcParam;
      if (tgtParam) fallbackTarget = tgtParam;
    } catch (e) {
      console.warn("Failed to parse fallback currencies from URL parameters.", e);
    }
  }

  const formattedDelivery = route.total_delivery_amount
    ? route.total_delivery_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  const formattedFee = route.fixed_fee > 0 
    ? `${route.fixed_fee} ${fallbackSource}` 
    : 'FREE';

  const handleAnchorClick = (e) => {
    console.log(`[METRO AI] Direct click registered on: ${route.provider_name}`);
    console.log(`[METRO AI] Target URL: ${route.redirection_url}`);

    if (!route.redirection_url) {
      e.preventDefault();
      console.error("[METRO AI] Redirect failed: redirection_url is missing from route payload.");
      return;
    }

    // Call state-management triggers to queue ledger authorization modal
    if (typeof onSelect === 'function') {
      onSelect(route);
    }
  };

  return (
    <div 
      className={`p-5 rounded-2xl bg-slate-900/40 border transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-slate-900/60 w-full relative z-10 ${
        idx === 0 
          ? 'border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
          : 'border-slate-800 bg-slate-900/20'
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-md font-black text-white">{route.provider_name}</span>
          {idx === 0 && (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wider uppercase rounded-md border border-emerald-500/20">
              Top Value
            </span>
          )}
        </div>
        
        {/* Metric metadata display */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
          <span>Rate: <strong className="text-white font-bold">{route.exchange_rate}</strong></span>
          <span>•</span>
          <span>Fee: <strong className="text-white font-bold">{formattedFee}</strong></span>
          <span>•</span>
          <span>Fulfillment: <strong className="text-white font-bold">{route.transfer_time_days}d</strong></span>
        </div>
      </div>

      {/* Action wrapper & pricing estimates */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-850 sm:border-t-0 pt-3 sm:pt-0">
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">EST. Payout Value</span>
          <span className="text-md font-black text-emerald-400 font-mono">
            {formattedDelivery} {fallbackTarget}
          </span>
        </div>

        {/* 
          Using an explicit anchor link with explicit interactive priority properties (z-30 pointer-events-auto)
          to force the browser to capture click events directly on this target, ignoring sibling elements.
        */}
        <a
          href={route.redirection_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAnchorClick}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center justify-center text-center min-w-[120px] relative z-30 pointer-events-auto shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
        >
          Send Now
        </a>
      </div>
    </div>
  );
}