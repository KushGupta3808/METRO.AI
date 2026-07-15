import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function RecipientsPage() {
  // Resilient session fallbacks for isolated builders
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token')
  });

  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Creation States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCurrency, setFormCurrency] = useState('INR');
  const [formPayout, setFormPayout] = useState('bank');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Hold a reference to the active Zustand store to bypass race-condition sync loops
  const authStoreRef = useRef(null);

  // Dynamic state subscriber ensuring zero import-resolution compiler locks
  useEffect(() => {
    let unsubscribe = null;
    
    import('../store/useAuthStore')
      .then((module) => {
        const store = module.useAuthStore || module.default;
        if (store && typeof store.getState === 'function') {
          authStoreRef.current = store;
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

  // Fetch Saved Recipients List securely from backend
  async function fetchRecipients() {
    if (!auth.isAuthenticated || !auth.token) {
      setError("You must be logged in to view your recipient directory.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://127.0.0.1:8000/api/v1/recipients', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      // Self-Healing Session Reset: Call store logout directly to stop race-condition loops
      if (response.status === 401) {
        console.warn("[METRO AI] Invalid or expired session detected. Triggering deep logout routine...");
        
        if (authStoreRef.current && typeof authStoreRef.current.getState === 'function') {
          authStoreRef.current.getState().logout();
        } else {
          localStorage.removeItem('token');
        }
        
        window.location.reload();
        return;
      }

      if (!response.ok) throw new Error("Failed to load recipient contacts database.");
      const data = await response.json();
      setRecipients(data);
    } catch (err) {
      console.error("[METRO AI] Recipients Fetch Exception:", err);
      setError(err.message || "Failed to reach Recipients directory service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipients();
  }, [auth.token, auth.isAuthenticated]);

  // Handle Form Submission
  async function handleSubmitRecipient(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setFormSubmitting(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/recipients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          currency: formCurrency,
          payout_method: formPayout,
          bank_name: formBankName || null,
          account_number: formAccountNumber || null
        })
      });

      if (!response.ok) throw new Error("Error registering recipient contact.");

      // Reset
      setFormName('');
      setFormBankName('');
      setFormAccountNumber('');
      setShowAddForm(false);
      
      // Sync list state
      await fetchRecipients();
    } catch (err) {
      setError(err.message || "An error occurred while creating this contact.");
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-8 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Recipients</h1>
          <p className="text-sm text-slate-400 mt-1">Saved contact credentials for high-speed multi-tenant remittance.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.15)] flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Close panel' : 'Add Recipient'}
        </button>
      </div>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md flex flex-col gap-4 overflow-hidden"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
            Register New Recipient Contact
          </h3>
          <form onSubmit={handleSubmitRecipient} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Rajveer Singh" 
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Currency</label>
              <select 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payout System</label>
              <select 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                value={formPayout}
                onChange={(e) => setFormPayout(e.target.value)}
              >
                <option value="bank">Bank Deposit</option>
                <option value="cash">Cash Pickup</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bank Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. HDFC Bank" 
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                value={formBankName}
                onChange={(e) => setFormBankName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 50029104859" 
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                value={formAccountNumber}
                onChange={(e) => setFormAccountNumber(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                {formSubmitting ? 'Registering...' : 'Save Member Contact'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Connected Success Alert Banner */}
      {!loading && !error && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-emerald-300 font-bold font-mono uppercase tracking-wider">
            Connected to Live Database
          </span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/50 p-5 rounded-2xl flex flex-col gap-2 text-rose-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <h4 className="text-sm font-bold uppercase tracking-wider">Connection Failure</h4>
          </div>
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/30 border border-slate-900 rounded-2xl"></div>
          ))}
        </div>
      ) : recipients.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {recipients.map((recipient) => (
            <div 
              key={recipient.id} 
              className="p-5 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl flex flex-col justify-between hover:bg-slate-900/40 transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-emerald-400">
                    {recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white group-hover:text-emerald-400 transition-colors">{recipient.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mt-0.5">
                      Delivery: <strong className="text-slate-300">{recipient.payout_method}</strong>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 font-mono text-[10px] font-black uppercase rounded-md shadow-inner">
                  {recipient.currency}
                </span>
              </div>

              {recipient.account_number && (
                <div className="border-t border-slate-900 mt-5 pt-3.5 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span className="truncate max-w-[120px]">{recipient.bank_name || 'Generic Bank'}</span>
                  <span className="text-slate-700">•</span>
                  <span>•••• {recipient.account_number.slice(-4)}</span>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="p-12 text-center bg-slate-900/10 border border-slate-900 rounded-3xl flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="max-w-md">
            <h4 className="text-md font-bold text-white">Your recipient directory is empty</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Register a contact by clicking the "Add Recipient" button above to streamline and lock transactions directly inside your safe user directory!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}