import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';
import { getRecipients, createRecipient } from '../services/recipientsService';

const MOCK_RECIPIENTS = [
  { id: 'r1', name: 'Rajveer Singh', country: 'India', account: '•••• 4821' },
  { id: 'r2', name: 'Simran Kaur', country: 'India', account: '•••• 7710' },
];

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState([]);
  const [isDemoData, setIsDemoData] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', account: '' });

  function loadRecipients() {
    getRecipients()
      .then((data) => {
        setRecipients(data?.length ? data : MOCK_RECIPIENTS);
        setIsDemoData(!data?.length);
      })
      .catch(() => {
        setRecipients(MOCK_RECIPIENTS);
        setIsDemoData(true);
      });
  }

  useEffect(() => {
    loadRecipients();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await createRecipient(form);
      loadRecipients();
    } catch {
      // Backend not available yet - reflect the new recipient locally so
      // the flow still feels complete in demo mode.
      setRecipients((prev) => [...prev, { id: `local-${Date.now()}`, ...form }]);
      setIsDemoData(true);
    }
    setForm({ name: '', country: '', account: '' });
    setIsFormOpen(false);
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
            onSubmit={handleAdd}
            className="glass-panel p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end overflow-hidden"
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
              <label className="text-xs font-mono uppercase text-slate-400">Country</label>
              <input
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-mono uppercase text-slate-400">Account (last 4)</label>
                <input
                  required
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
                />
              </div>
              <button type="submit" className="mt-1 rounded-lg bg-emeraldNeon text-void font-display text-sm font-semibold px-4 py-2">
                Save
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isDemoData && (
        <p className="text-xs font-mono text-slate-500 mb-4">
          Showing sample data - connect the FastAPI backend to see your saved recipients.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipients.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-5"
          >
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sapphireNeon/30 to-emeraldNeon/30 flex items-center justify-center font-display text-slate-100 mb-3">
              {r.name?.[0]}
            </div>
            <p className="font-display text-slate-100">{r.name}</p>
            <p className="text-xs text-slate-400 mb-2">{r.country}</p>
            <p className="text-xs font-mono text-slate-500">{r.account}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
