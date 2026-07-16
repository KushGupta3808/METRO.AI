import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { getCompare } from '../../services/compareService';
import { getLatestRate } from '../../services/marketService';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import AIRecommendationBanner from './AIRecommendationBanner';
import RouteCard from './RouteCard';
import { createTransfer } from '../../services/transfersService';

const CURRENCIES = ['CAD', 'USD', 'GBP', 'EUR', 'AUD'];
const TARGET_CURRENCIES = ['INR', 'PKR', 'PHP', 'MXN', 'NGN', 'CNY'];
const PAYOUT_METHODS = ['Bank Deposit', 'Cash Pickup', 'Mobile Wallet'];

// ➡️ Map providers strictly to their official homepages to prevent relative/broken path redirection errors
const PROVIDER_HOMEPAGES = {
  wise: 'https://wise.com',
  remitly: 'https://www.remitly.com',
  xoom: 'https://www.xoom.com',
  worldremit: 'https://www.worldremit.com',
  'western union': 'https://www.westernunion.com',
};

async function buildMockResponse({ source, target, amount }) {
  const { rate: baseRate, isLive } = await getLatestRate(source, target);
  const numericAmount = Number(amount) || 1000;
  const providers = ['Wise', 'Remitly', 'Xoom', 'WorldRemit'];
  const routes = providers.map((provider_name, i) => {
    const rate = baseRate * (1 - i * 0.006 - Math.random() * 0.003);
    return {
      provider_name,
      exchange_rate: rate.toFixed(3),
      total_delivery_amount: (numericAmount * rate * (0.995 - i * 0.004)).toFixed(2),
      delivery_time: ['Minutes', 'Within hours', '1 business day', '1-2 business days'][i],
    };
  });

  return {
    routes: routes.sort((a, b) => b.total_delivery_amount - a.total_delivery_amount),
    ai_recommendation: Math.random() > 0.4 ? 'SEND' : 'HOLD',
    ai_analysis_summary: isLive
      ? `Sample routing - ${source} to ${target} is priced off today's real mid-market rate, with providers modeled at a small margin below it. Connect the FastAPI backend for real Gemini-generated analysis.`
      : `Sample data - ${source} to ${target} isn't covered by our live rate feed, so this is fully simulated. Connect the FastAPI backend to see live Gemini-generated analysis.`,
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

  // ➡️ UPDATED REDIRECTION HANDLER (Uses clean, absolute homepages)
  const handleSendRedirect = async (route) => {
    const providerKey = route.provider_name.toLowerCase().trim();
    
    // Always resolve to the clean homepage URL mapping (guarantees no relative path "not found" errors)
    const targetUrl = PROVIDER_HOMEPAGES[providerKey] || `https://www.${providerKey}.com`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    // Record transaction details silently to PostgreSQL in the background
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const origin = window.location.origin;
      const baseUrl = origin.includes('localhost') && !origin.includes('8000')
        ? 'http://localhost:8000'
        : '';

      let recipientId = null;

      // Look up existing directory recipient profile
      try {
        const recRes = await fetch(`${baseUrl}/api/v1/recipients`, { headers });
        if (recRes.ok) {
          const recipients = await recRes.json();
          if (recipients && recipients.length > 0) {
            recipientId = recipients[0].id;
          }
        }
      } catch (err) {
        console.warn("Could not retrieve existing recipient contacts, fallback pending...", err);
      }

      // Automatically spin up a silent fallback recipient if one doesn't exist
      if (!recipientId) {
        try {
          const createRes = await fetch(`${baseUrl}/api/v1/recipients`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: 'Default Ledger Recipient',
              currency: form.target || 'INR',
              payout_method: form.payoutMethod || 'Bank Deposit'
            })
          });
          if (createRes.ok) {
            const newRecipient = await createRes.json();
            recipientId = newRecipient.id;
          }
        } catch (err) {
          console.error("Auto-creation of default recipient directory contact failed:", err);
        }
      }

      if (!recipientId) {
        recipientId = 1;
      }

      // Audit writing safely in snake_case directly to database backend
      await createTransfer({
        recipient_id: Number(recipientId),
        source_currency: form.source,  
        target_currency: form.target,  
        amount: Number(form.amount),                   
        provider_name: route.provider_name,
        exchange_rate: Number(route.exchange_rate),
        fee: Number(route.fee || route.fixed_fee || 0),
        total_delivery_amount: Number(route.total_delivery_amount),
        ai_recommendation_at_time: result?.ai_recommendation || 'SEND'
      });

      console.log("Success: Transfer logged securely to database!");
    } catch (error) {
      console.error("Background auto-logging failed:", error);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setSelectedRoute(null);
    try {
      const data = await getCompare(form);
      setResult(data);
      setIsDemoData(false);
    } catch (err) {
      setResult(await buildMockResponse(form));
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
              Showing sample routing - connect the FastAPI backend for real provider offers.
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

          {/* DYNAMIC CALL TO ACTION PANEL */}
          {selectedRoute && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-panel p-6 border border-emeraldNeon/20 flex flex-col md:flex-row items-center justify-between gap-4 mt-4"
            >
              <div>
                <h4 className="font-display text-lg text-slate-100">Proceed with your transfer</h4>
                <p className="text-sm text-slate-400">
                  Click below to finalize sending via <span className="text-emeraldNeon font-semibold">{selectedRoute.provider_name}</span>. This audit will log automatically.
                </p>
              </div>
              <button
                onClick={() => handleSendRedirect(selectedRoute)}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>Send with {selectedRoute.provider_name}</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}