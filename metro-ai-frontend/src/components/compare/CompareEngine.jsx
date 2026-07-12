import React, { useState, useEffect } from 'react';
import RouteCard from './RouteCard';
import { useAuthStore } from '../../store/useAuthStore';

export default function CompareEngine() {
  const [source, setSource] = useState('CAD');
  const [target, setTarget] = useState('INR');
  const [amount, setAmount] = useState(1000);
  const [payoutMethod, setPayoutMethod] = useState('bank');
  
  const [compareData, setCompareData] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparisons = async () => {
    setRatesLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState ? useAuthStore.getState().token : localStorage.getItem('token');
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/compare?source=${source}&target=${target}&amount=${amount}&payout_method=${payoutMethod}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      if (!response.ok) throw new Error('Failed to retrieve active marketplace routing parameters.');
      const data = await response.json();
      setCompareData(data);
    } catch (err) {
      setError(err.message || 'API connection failed. Please ensure your backend is active.');
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, [source, target, payoutMethod]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-8 relative z-10">
      {/* Search Filter Panel */}
      <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6 h-fit backdrop-blur-sm relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">From</label>
            <select
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-3 text-white font-bold focus:outline-none"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="CAD">CAD (Canada)</option>
              <option value="USD">USD (United States)</option>
              <option value="GBP">GBP (United Kingdom)</option>
              <option value="EUR">EUR (Eurozone)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">To</label>
            <select
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-3 text-white font-bold focus:outline-none"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="INR">INR (India)</option>
              <option value="PKR">PKR (Pakistan)</option>
              <option value="NGN">NGN (Nigeria)</option>
              <option value="BDT">BDT (Bangladesh)</option>
              <option value="PHP">PHP (Philippines)</option>
              <option value="EUR">EUR (Europe)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount</label>
            <input
              type="number"
              className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-white font-mono font-bold focus:outline-none w-full"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Payout Method</label>
            <select
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-3 text-white font-bold focus:outline-none"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
            >
              <option value="bank">Bank Deposit</option>
              <option value="cash">Cash Pickup</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchComparisons}
          disabled={ratesLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2"
        >
          {ratesLoading ? 'Re-routing Markets...' : 'Compare routes'}
        </button>
      </div>

      {/* AI recommendation Banner */}
      {compareData && (
        <div className={`p-6 rounded-2xl border backdrop-blur-sm relative overflow-hidden transition-all shadow-xl z-20 ${
          compareData.ai_recommendation === 'SEND' || compareData.ai_recommendation === 'FORCE_SEND'
            ? 'bg-emerald-950/20 border-emerald-800/60 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
            : 'bg-amber-950/20 border-amber-800/60 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]'
        }`}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between relative z-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AI DIRECTIVE</span>
              <h3 className="text-lg font-bold text-white">
                {compareData.ai_recommendation === 'SEND' || compareData.ai_recommendation === 'FORCE_SEND' ? 'Opportunity Detected' : 'Hold For Now'}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{compareData.ai_analysis_summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Channels List Container (Explicitly styled as full-width vertical stack) */}
      <div className="flex flex-col gap-4 w-full relative z-20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Optimized Remittance Channels</h4>
        
        {ratesLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl animate-pulse h-24"></div>
          ))
        ) : compareData && compareData.routes && compareData.routes.length > 0 ? (
          compareData.routes.map((route, idx) => (
            <RouteCard 
              key={route.provider_name} 
              route={route} 
              idx={idx} 
              source={source} 
              target={target}
              onSelect={(selected) => {
                console.log("[METRO AI] Selected transaction route recorded in parent scope: ", selected);
              }}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-slate-900/10 border border-slate-900 rounded-2xl">
            <p className="text-slate-400 text-sm">No pathways found for this corridor.</p>
          </div>
        )}
      </div>
    </div>
  );
}