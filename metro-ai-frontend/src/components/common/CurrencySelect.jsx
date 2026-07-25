import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { ALL_CURRENCIES } from '../../constants/currencies';

// A chip-grid of buttons (the original pattern for ~10 currencies) breaks
// down completely at 154 options - it becomes an unusable wall of buttons.
// This is a searchable combobox instead: type to filter by code or name,
// click/tap to select. `live` currencies (real Frankfurter rate data) show
// a small green dot; the rest still work, they'll just show simulated rate
// data elsewhere in the app - never hidden, just honestly marked.
export default function CurrencySelect({ value, onChange, accentClass = 'text-sapphireNeon' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selected = ALL_CURRENCIES.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(code) {
    onChange(code);
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 hover:border-white/20 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.live && <span className="h-1.5 w-1.5 rounded-full bg-emeraldNeon shrink-0" />}
          <span className="font-mono">{selected?.code || value}</span>
          <span className="text-slate-500 truncate hidden sm:inline">{selected?.name}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-72 max-w-[90vw] glass-panel border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currency or code..."
                className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sapphireNeon/50"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-xs text-slate-500 text-center">No currency matches "{query}"</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                  c.code === value ? `${accentClass} bg-white/[0.03]` : 'text-slate-300'
                }`}
              >
                {c.live ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-emeraldNeon shrink-0" title="Live rate data" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" title="Simulated rate data" />
                )}
                <span className="font-mono text-xs w-10 shrink-0">{c.code}</span>
                <span className="truncate flex-1">{c.name}</span>
                {c.code === value && <Check size={13} className="shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}