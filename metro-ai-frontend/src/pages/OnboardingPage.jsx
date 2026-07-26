import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { updateCurrencyPreferences } from '../services/authService';
import CurrencySelect from '../components/common/CurrencySelect';
import GlowButton from '../components/common/GlowButton';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setPreferences = useCurrencyStore((s) => s.setPreferences);
  const [base, setBase] = useState('CAD');
  const [target, setTarget] = useState('INR');

  function handleContinue() {
    setPreferences(base, target);
    // Best-effort sync to the backend - local state already applies either way.
    updateCurrencyPreferences({ baseCurrency: base, targetCurrency: target }).catch(() => {});
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-lg p-8"
      >
        <h1 className="font-display text-2xl text-slate-100 mb-1">Set up your corridor</h1>
        <p className="text-sm text-slate-400 mb-6">
          This decides your dashboard's default rates and bulletin. Pick any currency in the
          world - the green dot means we have live rate data for it; the rest still work, just
          with a clearly-marked simulated trend until a live feed covers them.
        </p>

        <p className="text-xs font-mono uppercase text-slate-500 mb-2">Base currency</p>
        <div className="mb-6">
          <CurrencySelect value={base} onChange={setBase} accentClass="text-sapphireNeon" />
        </div>

        <p className="text-xs font-mono uppercase text-slate-500 mb-2">Sending to</p>
        <div className="mb-8">
          <CurrencySelect value={target} onChange={setTarget} accentClass="text-emeraldNeon" />
        </div>

        <GlowButton onClick={handleContinue} className="w-full">
          Continue to dashboard
        </GlowButton>
      </motion.div>
    </div>
  );
}