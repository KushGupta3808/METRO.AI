import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getCompare } from '../../services/compareService';
import { getLatestRate } from '../../services/marketService';
import { getRecipients } from '../../services/recipientsService';
import { createTransfer } from '../../services/transfersService';
import { getProviderUrl } from '../../utils/providers';
import { ALL_CURRENCIES } from '../../constants/currencies';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import AIRecommendationBanner from './AIRecommendationBanner';
import RouteCard from './RouteCard';

const PAYOUT_METHODS = ['Bank Deposit', 'Cash Pickup', 'Mobile Wallet'];

// Used only when the real /api/v1/compare backend isn't reachable. Field
// names match the real route schema exactly (mid_market_rate, fixed_fee,
// transfer_time_days, etc.) so RouteCard never has to special-case mock
// vs. real data. redirection_url is left null here on purpose - the send
// handler below falls back to utils/providers.js for demo-mode sends.
//
// 8 real, verified providers spanning different niches - fast digital-
// first (Wise, Remitly, WorldRemit, Xoom, Paysend), wide traditional
// cash-pickup networks (Western Union, MoneyGram, Ria), and a large-
// amount FX specialist (OFX). None of the speed/fee numbers below are
// live quotes from these companies - they're illustrative, clearly
// labeled as sample data by the "Showing sample routing" banner that
// already appears whenever this fallback is in use.
async function buildMockResponse({ source, target, amount }) {
  const { rate: baseRate, isLive } = await getLatestRate(source, target);
  const numericAmount = Number(amount) || 1000;
  const providers = [
    { name: 'Wise', margin: 0.003, fee: 2.99, days: 1 },
    { name: 'Remitly', margin: 0.009, fee: 0, days: 2 },
    { name: 'WorldRemit', margin: 0.008, fee: 3.99, days: 1 },
    { name: 'Xoom', margin: 0.011, fee: 4.99, days: 1 },
    { name: 'Paysend', margin: 0.006, fee: 1.99, days: 1 },
    { name: 'Western Union', margin: 0.015, fee: 4.99, days: 3 },
    { name: 'MoneyGram', margin: 0.014, fee: 3.99, days: 2 },
    { name: 'Ria Money Transfer', margin: 0.012, fee: 2.49, days: 2 },
  ];

  const routes = providers.map((p) => {
    const rate = baseRate * (1 - p.margin);
    return {
      provider_name: p.name,
      payout_method: 'bank',
      exchange_rate: Number(rate.toFixed(4)),
      mid_market_rate: Number(baseRate.toFixed(4)),
      margin_percentage: Number((p.margin * 100).toFixed(2)),
      fixed_fee: p.fee,
      transfer_time_days: p.days,
      total_delivery_amount: Number(((numericAmount - p.fee) * rate).toFixed(2)),
      requires_kyc_verification: false,
      regulatory_warning: null,
      redirection_url: null,
    };
  });

  return {
    routes: routes.sort((a, b) => b.total_delivery_amount - a.total_delivery_amount),
    ai_recommendation: Math.random() > 0.4 ? 'SEND' : 'HOLD',
    ai_analysis_summary: isLive
      ? `Sample routing - ${source} to ${target} is priced off today's real mid-market rate. Your backend is unreachable right now, so this is a local simulation, not its Gemini analysis.`
      : `Sample data - ${source} to ${target} isn't covered by the live rate feed either, so this is fully simulated.`,
  };
}

// Computes which route wins on each axis, so the differences are visible
// at a glance instead of requiring the user to compare raw numbers across
// every card themselves. Badges are derived purely from the numbers
// already in each route - never an asserted claim about a real company
// ("Wise is the fastest") that this app has no way to verify or keep
// current.
function computeBadges(routes) {
  if (!routes?.length) return {};
  const badges = {};

  const fastest = routes.reduce((a, b) =>
    (b.transfer_time_days ?? Infinity) < (a.transfer_time_days ?? Infinity) ? b : a
  );
  badges[fastest.provider_name] = [...(badges[fastest.provider_name] || []), 'Fastest'];

  const noFee = routes.filter((r) => (r.fixed_fee ?? r.fee ?? null) === 0);
  noFee.forEach((r) => {
    badges[r.provider_name] = [...(badges[r.provider_name] || []), 'No fee'];
  });

  const cheapestFee = routes.reduce((a, b) =>
    (b.fixed_fee ?? b.fee ?? Infinity) < (a.fixed_fee ?? a.fee ?? Infinity) ? b : a
  );
  if (!noFee.length) {
    badges[cheapestFee.provider_name] = [...(badges[cheapestFee.provider_name] || []), 'Lowest fee'];
  }

  return badges;
}

export default function CompareEngine() {
  const navigate = useNavigate();
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const [form, setForm] = useState({
    source: baseCurrency || 'CAD',
    target: targetCurrency || 'INR',
    amount: 1000,
    payoutMethod: PAYOUT_METHODS[0],
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [sendingProvider, setSendingProvider] = useState(null);
  const [sendError, setSendError] = useState(null);

  const routeBadges = useMemo(() => computeBadges(result?.routes), [result]);

  useEffect(() => {
    getRecipients()
      .then((data) => {
        setRecipients(data || []);
        if (data?.length) setRecipientId(String(data[0].id));
      })
      .catch(() => setRecipients([]));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setSendError(null);
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

  // Deliberately does NOT auto-create a "default" recipient or fall back
  // to a guessed recipient ID if none is selected. For a financial ledger,
  // silently attributing a transfer to the wrong (or a fabricated)
  // recipient is worse than just asking the user to pick one first - see
  // the inline message below when the recipient list is empty.
  async function handleSend(route) {
    setSendError(null);

    // Open the provider's site synchronously, in the same tick as the
    // click - if this waited on the transfer POST first, some browsers
    // (Safari especially) would treat it as a non-user-initiated popup
    // and block it.
    const externalUrl = route.redirection_url || getProviderUrl(route.provider_name);
    window.open(externalUrl, '_blank', 'noopener,noreferrer');

    if (!recipientId) {
      setSendError('Add a recipient to also log this transfer in your ledger.');
      return;
    }

    setSendingProvider(route.provider_name);
    try {
      await createTransfer({
        recipient_id: Number(recipientId),
        source_currency: form.source,
        target_currency: form.target,
        amount: Number(form.amount),
        provider_name: route.provider_name,
        exchange_rate: Number(route.exchange_rate),
        fee: Number(route.fixed_fee ?? route.fee ?? 0),
        total_delivery_amount: Number(route.total_delivery_amount),
        ai_recommendation_at_time: result?.ai_recommendation ?? null,
      });
      navigate('/ledger');
    } catch (err) {
      setSendError("Could not log this transfer to your backend - opened the provider's site anyway.");
    } finally {
      setSendingProvider(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-panel p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">From</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-obsidian">
                {c.code} - {c.name}{c.live ? '' : ' (simulated rate)'}
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
            {ALL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-obsidian">
                {c.code} - {c.name}{c.live ? '' : ' (simulated rate)'}
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
        <div>
          <label className="text-xs font-mono uppercase text-slate-400">Recipient</label>
          {recipients.length ? (
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id} className="bg-obsidian">
                  {r.name}
                </option>
              ))}
            </select>
          ) : (
            <Link
              to="/recipients"
              className="mt-1 flex items-center h-[42px] px-3 rounded-lg border border-amberNeon/30 text-xs text-amberNeon"
            >
              Add a recipient first
            </Link>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="sm:col-span-2 lg:col-span-5 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold py-2.5 disabled:opacity-60"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {isLoading ? 'Analyzing routes...' : 'Compare routes'}
        </button>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {isDemoData && (
            <p className="text-xs font-mono text-slate-500">
              Showing sample routing across 8 providers - connect the FastAPI backend for real,
              live provider offers. The set and count of providers shown when connected depends
              entirely on what your backend's /api/v1/compare endpoint returns.
            </p>
          )}
          <AIRecommendationBanner recommendation={result.ai_recommendation} summary={result.ai_analysis_summary} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.routes?.map((route, i) => (
              <RouteCard
                key={route.provider_name}
                route={route}
                isBest={i === 0}
                badges={routeBadges[route.provider_name]}
                isSending={sendingProvider === route.provider_name}
                onSend={handleSend}
              />
            ))}
          </div>
          {sendError && <p className="text-xs font-mono text-amberNeon">{sendError}</p>}
        </motion.div>
      )}
    </div>
  );
}