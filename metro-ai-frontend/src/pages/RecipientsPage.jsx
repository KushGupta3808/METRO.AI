import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Wifi, AlertTriangle, Users } from 'lucide-react';
import { getRecipients, createRecipient } from '../services/recipientsService';
import { ALL_CURRENCIES } from '../constants/currencies';
import { useAuthStore } from '../store/useAuthStore';

// Payout method values match what CompareEngine and the rest of the app
// use everywhere else ('Bank Deposit', not 'bank') - keeping these
// consistent matters since they're compared/displayed side by side.
const PAYOUT_METHODS = ['Bank Deposit', 'Cash Pickup', 'Mobile Wallet'];

export default function RecipientsPage() {
  // useAuthStore() is a simple selector hook - no need to manually
  // dynamic-import the store and hand-roll a subscription, which is a
  // fragile pattern that already caused a real bug earlier in this app
  // (a dynamic import with no .catch() failing silently in the
  // background). The hook re-renders this component automatically
  // whenever auth state changes - that's what it's for.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [recipients, setRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    currency: ALL_CURRENCIES[0].code,
    payout_method: PAYOUT_METHODS[0],
    bank_name: '',
    account_number: '',
  });

  async function loadRecipients() {
    if (!isAuthenticated) {
      setError('You must be logged in to view your recipient directory.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRecipients();
      setRecipients(data || []);
    } catch (err) {
      // A 401 means the session expired - log out cleanly and let the
      // route guard redirect to /login, rather than force a full page
      // reload (which throws away any other app state unnecessarily).
      if (err.message.includes('401')) {
        logout();
        return;
      }
      setError(err.message || 'Failed to reach the recipients service.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createRecipient({
        name: form.name,
        currency: form.currency,
        payout_method: form.payout_method,
        bank_name: form.bank_name || null,
        account_number: form.account_number || null,
      });
      setForm({
        name: '',
        currency: ALL_CURRENCIES[0].code,
        payout_method: PAYOUT_METHODS[0],
        bank_name: '',
        account_number: '',
      });
      setIsFormOpen(false);
      await loadRecipients();
    } catch (err) {
      setError(err.message || 'Failed to save this recipient.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-slate-100 mb-1">Recipients</h1>
          <p className="text-sm text-slate-400">Saved contacts for faster transfers.</p>
        </div>
        <button
          onClick={() => setIsFormOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-emeraldNeon/50 hover:text-emeraldNeon transition-colors"
        >
          {isFormOpen ? <X size={16} /> : <UserPlus size={16} />}
          {isFormOpen ? 'Cancel' : 'Add recipient'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass-panel p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end overflow-hidden"
          >
            <div>
              <label className="text-xs font-mono uppercase text-slate-400">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
              >
                {ALL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-obsidian">
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400">Payout method</label>
              <select
                value={form.payout_method}
                onChange={(e) => setForm({ ...form, payout_method: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
              >
                {PAYOUT_METHODS.map((m) => (
                  <option key={m} value={m} className="bg-obsidian">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-slate-400">Bank (optional)</label>
              <input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-mono uppercase text-slate-400">Account (optional)</label>
                <input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 rounded-lg bg-emeraldNeon text-void font-display text-sm font-semibold px-4 py-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!isLoading && !error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emeraldNeon/20 bg-emeraldNeon/5 px-4 py-2.5 mb-6 text-xs font-mono text-emeraldNeon">
          <Wifi size={13} /> Connected to your recipient directory
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amberNeon/30 bg-amberNeon/5 px-4 py-3 mb-6 text-amberNeon">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 glass-panel" />
          ))}
        </div>
      ) : recipients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipients.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sapphireNeon/30 to-emeraldNeon/30 flex items-center justify-center font-display text-slate-100">
                    {r.name?.[0]}
                  </div>
                  <div>
                    <p className="font-display text-slate-100">{r.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{r.payout_method}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px]">
                  {r.currency}
                </span>
              </div>
              {r.account_number && (
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-3 border-t border-white/5">
                  <span className="truncate">{r.bank_name || 'Bank on file'}</span>
                  <span>•••• {String(r.account_number).slice(-4)}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-white/5 text-slate-400">
            <Users size={24} />
          </div>
          <p className="font-display text-slate-100">Your recipient directory is empty</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Add a recipient above to start sending transfers - Compare requires a saved recipient
            before it can log a transfer to your ledger.
          </p>
        </div>
      )}
    </div>
  );
}