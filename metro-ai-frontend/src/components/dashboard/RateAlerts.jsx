import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, BellOff, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useAlertStore } from '../../store/useAlertStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { ALL_CURRENCIES } from '../../constants/currencies';
import { getNotificationPermission, requestNotificationPermission } from '../../hooks/useRateAlerts';

export default function RateAlerts() {
  const { baseCurrency, targetCurrency } = useCurrencyStore();
  const alerts = useAlertStore((s) => s.alerts);
  const addAlert = useAlertStore((s) => s.addAlert);
  const removeAlert = useAlertStore((s) => s.removeAlert);
  const resetAlert = useAlertStore((s) => s.resetAlert);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());
  const [form, setForm] = useState({
    base: baseCurrency || 'CAD',
    target: targetCurrency || 'INR',
    direction: 'above',
    threshold: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.threshold || Number(form.threshold) <= 0) return;

    // Only prompt for notification permission on a real user action (here),
    // never unprompted on page load - that's the kind of thing that gets a
    // site's notification requests ignored or auto-blocked by browsers.
    if (permission === 'default') {
      const result = await requestNotificationPermission();
      setPermission(result);
    }

    addAlert(form);
    setForm((f) => ({ ...f, threshold: '' }));
    setIsFormOpen(false);
  }

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Bell size={16} />
          <h2 className="font-display text-sm tracking-wide uppercase">Rate Alerts</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-sapphireNeon transition-colors"
        >
          {isFormOpen ? <X size={13} /> : <Plus size={13} />}
          {isFormOpen ? 'Cancel' : 'New alert'}
        </button>
      </div>

      {permission === 'denied' && (
        <p className="text-[11px] font-mono text-amberNeon mb-3">
          Browser notifications are blocked - alerts will still show here in-app, but won't pop
          up as OS notifications until you allow them in your browser's site settings.
        </p>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden mb-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.base}
                onChange={(e) => setForm({ ...form, base: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
              >
                {ALL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-obsidian">
                    {c.code}
                  </option>
                ))}
              </select>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
              >
                {ALL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-obsidian">
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
              >
                <option value="above" className="bg-obsidian">Goes above</option>
                <option value="below" className="bg-obsidian">Goes below</option>
              </select>
              <input
                type="number"
                step="0.0001"
                min="0"
                required
                placeholder="Rate"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sapphireNeon/60"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display text-xs font-semibold py-2"
            >
              Create alert
            </button>
            <p className="text-[10px] font-mono text-slate-500">
              Checked every minute while METRO AI is open in a tab - this doesn't run in the
              background if you close the app.
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      {alerts.length === 0 ? (
        <p className="text-xs text-slate-500">No alerts set. Create one to get notified when a rate moves.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                a.triggered ? 'border-emeraldNeon/30 bg-emeraldNeon/5' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2">
                {a.triggered ? (
                  <BellRing size={13} className="text-emeraldNeon shrink-0" />
                ) : (
                  <BellOff size={13} className="text-slate-500 shrink-0" />
                )}
                <span className="font-mono text-slate-200">
                  {a.base}/{a.target}
                </span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  {a.direction === 'above' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {a.threshold}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {a.triggered && (
                  <button
                    type="button"
                    onClick={() => resetAlert(a.id)}
                    className="text-[10px] font-mono text-emeraldNeon hover:underline"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAlert(a.id)}
                  className="text-slate-500 hover:text-amberNeon transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}