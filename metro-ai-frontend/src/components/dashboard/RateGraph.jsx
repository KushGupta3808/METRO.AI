import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getRateSeries } from '../../services/marketService';
import { useCurrencyStore } from '../../store/useCurrencyStore';

export default function RateGraph() {
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const [data, setData] = useState([]);

  useEffect(() => {
    getRateSeries(baseCurrency || 'CAD', targetCurrency || 'INR').then(setData);
  }, [baseCurrency, targetCurrency]);

  if (!data.length) return null;

  const latest = data[data.length - 1].rate;
  const prev = data[data.length - 2]?.rate ?? latest;
  const delta = latest - prev;
  const isUp = delta >= 0;

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            {baseCurrency || 'CAD'} / {targetCurrency || 'INR'}
          </p>
          <p className="font-display text-2xl text-slate-100">{latest.toFixed(3)}</p>
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

      <div className="h-56">
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
