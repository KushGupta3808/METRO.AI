import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Compare', to: '/compare' },
      { label: 'Ledger', to: '/ledger' },
      { label: 'Recipients', to: '/recipients' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '#' },
      { label: 'Careers', to: '#' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="brand-card p-1.5 w-fit mb-3">
            <img src="/logo-icon.png" alt="METRO AI" className="h-5 w-auto" />
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            AI-powered cross-border transfers, with a routing engine that tells you when to send
            and when to wait.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-400 hover:text-slate-100 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} METRO AI. All rights reserved.</span>
          <span>Built for cross-border transfers, everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
