import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCurrencyStore } from '../store/useCurrencyStore';
import GlowButton from '../components/common/GlowButton';

const BASE_OPTIONS = ['CAD', 'USD', 'GBP', 'EUR', 'AUD'];
const TARGET_OPTIONS = ['INR', 'PKR', 'PHP', 'MXN', 'NGN', 'CNY'];

function Chip({ label, isActive, onClick, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-mono transition-all ${
        isActive ? activeClass : 'border-white/10 text-slate-400 hover:border-white/20'
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setPreferences = useCurrencyStore((s) => s.setPreferences);
  const [base, setBase] = useState('CAD');
  const [target, setTarget] = useState('INR');

  function handleContinue() {
    setPreferences(base, target);
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
        <p className="text-sm text-slate-400 mb-6">This decides your dashboard's default rates and bulletin.</p>

        <p className="text-xs font-mono uppercase text-slate-500 mb-2">Base currency</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {BASE_OPTIONS.map((c) => (
            <Chip
              key={c}
              label={c}
              isActive={base === c}
              onClick={() => setBase(c)}
              activeClass="border-sapphireNeon/60 text-sapphireNeon bg-sapphireNeon/10 shadow-glow-sapphire"
            />
          ))}
        </div>

        <p className="text-xs font-mono uppercase text-slate-500 mb-2">Sending to</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {TARGET_OPTIONS.map((c) => (
            <Chip
              key={c}
              label={c}
              isActive={target === c}
              onClick={() => setTarget(c)}
              activeClass="border-emeraldNeon/60 text-emeraldNeon bg-emeraldNeon/10 shadow-glow-emerald"
            />
          ))}
        </div>

        <GlowButton onClick={handleContinue} className="w-full">
          Continue to dashboard
        </GlowButton>
      </motion.div>
    </div>
  );
}
