import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getCompare } from '../../services/compareService';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import AIRecommendationBanner from './AIRecommendationBanner';
import RouteCard from './RouteCard';

const CURRENCIES = ['CAD', 'USD', 'GBP', 'EUR', 'AUD'];
const TARGET_CURRENCIES = ['INR', 'PKR', 'PHP', 'MXN', 'NGN', 'CNY'];
const PAYOUT_METHODS = ['Bank Deposit', 'Cash Pickup', 'Mobile Wallet'];

function buildMockResponse({ source, target, amount }) {
  const numericAmount = Number(amount) || 1000;
  const providers = ['Wise', 'Remitly', 'Xoom', 'WorldRemit'];
  const routes = providers.map((provider_name, i) => {
    const rate = 61.5 + i * 0.35 + Math.random() * 0.4;
    return {
      provider_name,
      exchange_rate: rate.toFixed(3),
      total_delivery_amount: (numericAmount * rate * (0.985 - i * 0.004)).toFixed(2),
      delivery_time: ['Minutes', 'Within hours', '1 business day', '1-2 business days'][i],
    };
  });

  return {
    routes: routes.sort((a, b) => b.total_delivery_amount - a.total_delivery_amount),
    ai_recommendation: Math.random() > 0.4 ? 'SEND' : 'HOLD',
    ai_analysis_summary: `Sample data - ${source} to ${target} rates have been range-bound this week. Connect the FastAPI backend to see live Gemini-generated analysis.`,
  };
}

export default function CompareEngine() {
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const [form, setForm] = useState({
    source: baseCurrency || 'CAD',
    target: targetCurrency || 'INR',
    amount: 1000,
    payoutMethod: PAYOUT_METHODS[0],
  });
  const [result, setResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setSelectedRoute(null);
    try {
      const data = await getCompare(form);
      setResult(data);
      setIsDemoData(false);
    } catch (err) {
      // Backend isn't reachable in this environment - fall back to
      // realistic sample data so the UI stays fully demoable.
      setResult(buildMockResponse(form));
      setIsDemoData(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-panel p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">From</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-obsidian">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">To</label>
          <select
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
          >
            {TARGET_CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-obsidian">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">Amount</label>
          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">Payout method</label>
          <select
            value={form.payoutMethod}
            onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
          >
            {PAYOUT_METHODS.map((m) => (
              <option key={m} value={m} className="bg-obsidian">
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="md:col-span-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold py-2.5 disabled:opacity-60"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {isLoading ? 'Analyzing routes...' : 'Compare routes'}
        </button>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {isDemoData && (
            <p className="text-xs font-mono text-slate-500">
              Showing sample data - connect the FastAPI backend to see live rates.
            </p>
          )}
          <AIRecommendationBanner recommendation={result.ai_recommendation} summary={result.ai_analysis_summary} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.routes?.map((route, i) => (
              <RouteCard
                key={route.provider_name}
                route={route}
                isBest={i === 0}
                isSelected={selectedRoute?.provider_name === route.provider_name}
                onSelect={setSelectedRoute}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
