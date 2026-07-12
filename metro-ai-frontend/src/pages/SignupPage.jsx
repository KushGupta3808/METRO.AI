import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { signup } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import GlowButton from '../components/common/GlowButton';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, token } = await signup(form);
      setAuth(user, token);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emeraldNeon/10 via-transparent to-sapphireNeon/10" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel relative z-10 w-full max-w-sm p-8"
      >
        <div className="brand-card inline-block px-4 py-2.5 mb-6">
          <img src="/logo-icon.png" alt="METRO AI" className="h-7 w-auto" />
        </div>
        <h1 className="font-display text-2xl text-slate-100 mb-1">Create your account</h1>
        <p className="text-sm text-slate-400 mb-6">Start routing smarter transfers</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
            />
          </div>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
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
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-emeraldNeon/60"
            />
          </div>

          {error && <p className="text-xs text-amberNeon">{error}</p>}

          <GlowButton type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Creating account...' : 'Create account'}
          </GlowButton>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-emeraldNeon hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
