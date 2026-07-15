import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Gauge, Compass, ArrowRight } from 'lucide-react';
import Footer from '../components/layout/Footer';

const STEPS = [
  { title: 'Set your corridor', body: 'Pick your base currency and where you are sending, once.' },
  {
    title: 'Compare in real time',
    body: 'See routed offers from major providers side by side, ranked by what actually lands.',
  },
  {
    title: 'Get the AI call',
    body: 'A send-or-hold recommendation, with the reasoning behind it in plain language.',
  },
  {
    title: 'Finish with your provider',
    body: 'Send with whichever offer looks best, on their platform, with the numbers already in hand.',
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Neutral by design',
    body: 'The routing comparison and the AI recommendation are based on rates, not partnerships.',
  },
  {
    icon: Gauge,
    title: 'Built for the wait',
    body: 'Sometimes the best move is doing nothing. We are comfortable telling you to hold.',
  },
  {
    icon: Compass,
    title: 'Clarity over jargon',
    body: 'Every recommendation comes with a plain-language reason, not just a number.',
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/about" className="flex items-center gap-2.5">
            <div className="brand-card p-1.5">
              <img src="/logo-icon.png" alt="METRO AI" className="h-6 w-auto" />
            </div>
            <span className="font-display font-semibold text-sm tracking-[0.15em] text-slate-200 hidden sm:inline">
              METRO AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-300 hover:text-slate-100 transition-colors">
              Sign in
            </Link>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold text-sm py-2 px-4 shadow-glow-sapphire hover:brightness-110 transition"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl text-slate-100 mb-4"
          >
            Send smarter, not just faster.
          </motion.h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            METRO AI compares real routing options across providers and gives you a direct call,
            in plain language, on whether now is a good time to send or worth waiting a day.
          </p>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="glass-panel p-6 sm:p-8">
            <p className="text-slate-300 leading-relaxed">
              Cross-border transfers are expensive to get wrong. A few points of exchange-rate
              movement can be worth more than any provider's fee difference, and most people
              have no way to see it coming. METRO AI watches your corridor continuously and
              turns that into one direct answer: send now, or hold.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="font-display text-sm tracking-wide uppercase text-slate-400 mb-6 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel p-5"
              >
                <span className="font-mono text-xs text-sapphireNeon">0{i + 1}</span>
                <p className="font-display text-slate-100 mt-2 mb-1.5">{step.title}</p>
                <p className="text-sm text-slate-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="glass-panel p-5">
                <v.icon size={22} className="text-emeraldNeon mb-3" strokeWidth={1.5} />
                <p className="font-display text-slate-100 mb-1.5">{v.title}</p>
                <p className="text-sm text-slate-400">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold py-3 px-6 shadow-glow-sapphire hover:brightness-110 transition"
          >
            See your corridor <ArrowRight size={16} />
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
