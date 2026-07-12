import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { login } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import GlowButton from '../components/common/GlowButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.login);
  const hasOnboarded = useCurrencyStore((s) => s.hasOnboarded);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, token } = await login(form);
      setAuth(user, token);
      navigate(hasOnboarded ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sapphireNeon/10 via-transparent to-emeraldNeon/10" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel relative z-10 w-full max-w-sm p-8"
      >
        <div className="brand-card inline-block px-4 py-2.5 mb-6">
          <img src="/logo-icon.png" alt="METRO AI" className="h-7 w-auto" />
        </div>
        <h1 className="font-display text-2xl text-slate-100 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-400 mb-6">Sign in to METRO AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-sapphireNeon/60"
            />
          </div>

          {error && <p className="text-xs text-amberNeon">{error}</p>}

          <GlowButton type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign in'}
          </GlowButton>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          New to METRO AI?{' '}
          <Link to="/signup" className="text-sapphireNeon hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
