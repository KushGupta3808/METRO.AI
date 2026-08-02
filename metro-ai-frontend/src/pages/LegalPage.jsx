import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Footer from '../components/layout/Footer';

const markdownComponents = {
  h1: ({ node, ...props }) => <h1 className="font-display text-2xl sm:text-3xl text-slate-100 mb-4" {...props} />,
  h2: ({ node, ...props }) => (
    <h2 className="font-display text-lg text-slate-100 mt-8 mb-3 pb-2 border-b border-white/5" {...props} />
  ),
  p: ({ node, ...props }) => <p className="text-sm text-slate-300 leading-relaxed mb-4" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-sm text-slate-300" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node, ...props }) => <strong className="text-slate-100 font-semibold" {...props} />,
  em: ({ node, ...props }) => <em className="text-amberNeon not-italic text-xs font-mono" {...props} />,
  a: ({ node, ...props }) => <a className="text-sapphireNeon hover:underline" {...props} />,
};

export default function LegalPage({ title, content }) {
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
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold text-sm py-2 px-4 shadow-glow-sapphire hover:brightness-110 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">Legal</p>
          <h1 className="font-display text-3xl text-slate-100 mb-8">{title}</h1>
          <div className="glass-panel p-6 sm:p-8">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}