import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LedgerPage() {
  // Resilient session fallbacks for isolated builders
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token')
  });
  
  const [transfers, setTransfers] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic state subscriber ensuring zero import-resolution compiler locks
  useEffect(() => {
    let unsubscribe = null;
    
    import('../store/useAuthStore')
      .then((module) => {
        const store = module.useAuthStore || module.default;
        if (store && typeof store.getState === 'function') {
          const initialState = store.getState();
          setAuth({
            token: initialState.token,
            isAuthenticated: initialState.isAuthenticated
          });

          // Subscribe dynamically to live auth changes
          unsubscribe = store.subscribe((state) => {
            setAuth({
              token: state.token,
              isAuthenticated: state.isAuthenticated
            });
          });
        }
      })
      .catch((err) => {
        console.warn("[METRO AI] Running in standalone preview mode. LocalStorage fallback active.");
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch real SQLite database transfers and recipients to map names in-memory
  useEffect(() => {
    async function fetchLedgerAndRecipients() {
      if (!auth.isAuthenticated || !auth.token) {
        setError("You must be logged in to view your dynamic ledger.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Parallel fetch for transfers and recipients
        const [transfersRes, recipientsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/transfers', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          }),
          fetch('http://127.0.0.1:8000/api/v1/recipients', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          })
        ]);

        if (!transfersRes.ok || !recipientsRes.ok) {
          throw new Error("Failed to sync secure transaction databases.");
        }

        const transfersData = await transfersRes.json();
        const recipientsData = await recipientsRes.json();

        setTransfers(transfersData);
        setRecipients(recipientsData);
      } catch (err) {
        console.error("[METRO AI] Ledger Data Synchronization Exception:", err);
        setError(err.message || "Could not connect to the remote ledger service.");
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerAndRecipients();
  }, [auth.token, auth.isAuthenticated]);

  // Helper helper function to resolve recipient names in-memory
  const getRecipientName = (recipientId) => {
    const found = recipients.find(r => r.id === recipientId);
    return found ? found.name : `Contact #${recipientId}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-8 relative z-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Transfer ledger</h1>
        <p className="text-sm text-slate-400 mt-1">Every transfer you’ve locked into SQLite, audited in one secure terminal.</p>
      </div>

      {/* Connected Success Alert Banner */}
      {!loading && !error && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-emerald-300 font-bold font-mono uppercase tracking-wider">
            Connected to Live SQLite Database Ledger
          </span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/50 p-5 rounded-2xl flex flex-col gap-2 text-rose-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <h4 className="text-sm font-bold uppercase tracking-wider">API Connection Interrupted</h4>
          </div>
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-800 text-transparent">Loading...</div>
            <div className="h-4 bg-slate-800 text-transparent">Loading...</div>
          </div>
        </div>
      ) : transfers.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/20 border border-slate-850 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 font-mono">Date</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6 font-mono">Sent</th>
                  <th className="py-4 px-6 font-mono">Received</th>
                  <th className="py-4 px-6">Provider</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/80 font-mono text-xs text-slate-300">
                {transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/10 transition-all">
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 text-white font-extrabold">
                      {getRecipientName(tx.recipient_id)}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-bold">
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.source_currency}
                    </td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">
                      {tx.total_delivery_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.target_currency}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-sans">{tx.provider_name}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="p-12 text-center bg-slate-900/10 border border-slate-900 rounded-3xl flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="max-w-md">
            <h4 className="text-md font-bold text-white">No transactions recorded yet</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your SQLite database is active, but you haven't sent any funds. Go to the Compare tab, execute a route, and it will log automatically!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}