import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeftRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/compare', label: 'Compare' },
  { to: '/ledger', label: 'Ledger' },
  { to: '/recipients', label: 'Recipients' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { baseCurrency, targetCurrency } = useCurrencyStore();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="brand-card p-1.5">
              <img src="/logo-icon.png" alt="METRO AI" className="h-6 w-auto" />
            </div>
            <span className="font-display font-semibold text-sm tracking-[0.15em] text-slate-200 hidden sm:inline">
              METRO AI
            </span>
          </div>
          <nav className="hidden md:flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-sapphireNeon bg-white/5' : 'text-slate-400 hover:text-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border border-white/10 text-slate-300 hover:border-sapphireNeon/50 transition-colors"
          >
            {baseCurrency ?? 'CAD'} <ArrowLeftRight size={12} /> {targetCurrency ?? 'INR'}
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-amberNeon hover:bg-white/5 transition-colors"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
