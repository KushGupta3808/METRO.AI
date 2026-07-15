import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { getRateSeries } from '../../services/marketService';
import { useCurrencyStore } from '../../store/useCurrencyStore';

function RateGraphSkeleton() {
  return (
    <div className="glass-panel p-5 md:p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/5 rounded mb-3" />
      <div className="h-8 w-32 bg-white/5 rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="h-64 md:h-80 w-full bg-white/5 rounded-xl" />
    </div>
  );
}

function StatChip({ label, value, icon, tone }) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emeraldNeon bg-emeraldNeon/10'
      : tone === 'amber'
        ? 'text-amberNeon bg-amberNeon/10'
        : 'text-sapphireNeon bg-sapphireNeon/10';
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <div className={`flex items-center gap-1 text-sm font-mono px-2 py-0.5 rounded-full w-fit ${toneClass}`}>
        {icon} {value}
      </div>
    </div>
  );
}

export default function RateGraph() {
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const [data, setData] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getRateSeries(baseCurrency || 'CAD', targetCurrency || 'INR').then((result) => {
      setData(result.series);
      setIsLive(result.isLive);
      setIsLoading(false);
    });
  }, [baseCurrency, targetCurrency]);

  if (isLoading || !data.length) return <RateGraphSkeleton />;

  const rates = data.map((d) => d.rate);
  const latest = rates[rates.length - 1];
  const prev = rates[rates.length - 2] ?? latest;
  const delta = latest - prev;
  const isUp = delta >= 0;
  const high = Math.max(...rates);
  const low = Math.min(...rates);
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  const changePct = ((latest - rates[0]) / rates[0]) * 100;

  return (
    <div className="glass-panel p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            {baseCurrency || 'CAD'} / {targetCurrency || 'INR'}
          </p>
          <p className="font-display text-3xl text-slate-100">{latest.toFixed(3)}</p>
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-mono px-2.5 py-1 rounded-full ${
            isUp ? 'text-emeraldNeon bg-emeraldNeon/10' : 'text-amberNeon bg-amberNeon/10'
          }`}
        >
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(delta).toFixed(3)}
        </div>
      </div>

      <div className="mb-6">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emeraldNeon">
            <span className="h-1.5 w-1.5 rounded-full bg-emeraldNeon animate-pulse" /> Live rates - Frankfurter (ECB
            data)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Simulated - live data not available for this
            pair
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatChip label="30D High" value={high.toFixed(3)} icon={<ArrowUp size={13} />} tone="emerald" />
        <StatChip label="30D Low" value={low.toFixed(3)} icon={<ArrowDown size={13} />} tone="amber" />
        <StatChip label="30D Avg" value={avg.toFixed(3)} icon={<Activity size={13} />} tone="sapphire" />
        <StatChip
          label="30D Change"
          value={`${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`}
          icon={changePct >= 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          tone={changePct >= 0 ? 'emerald' : 'amber'}
        />
      </div>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4FC3F7" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#4FC3F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#122240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area type="monotone" dataKey="rate" stroke="#4FC3F7" strokeWidth={2} fill="url(#rateFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
