import { useEffect, useState } from 'react';
import { getTransfers } from '../services/transfersService';

const MOCK_TRANSFERS = [
  { id: 'tx_1', date: '2026-07-02', recipient: 'Rajveer Singh', sent: '1,000.00 CAD', received: '61,420 INR', status: 'Completed', provider: 'Wise' },
  { id: 'tx_2', date: '2026-06-18', recipient: 'Simran Kaur', sent: '500.00 CAD', received: '30,710 INR', status: 'Completed', provider: 'Remitly' },
  { id: 'tx_3', date: '2026-06-04', recipient: 'Rajveer Singh', sent: '750.00 CAD', received: '45,980 INR', status: 'Pending', provider: 'Xoom' },
];

const STATUS_STYLES = {
  Completed: 'text-emeraldNeon bg-emeraldNeon/10',
  Pending: 'text-amberNeon bg-amberNeon/10',
};

export default function LedgerPage() {
  const [transfers, setTransfers] = useState([]);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    getTransfers()
      .then((data) => {
        setTransfers(data?.length ? data : MOCK_TRANSFERS);
        setIsDemoData(!data?.length);
      })
      .catch(() => {
        setTransfers(MOCK_TRANSFERS);
        setIsDemoData(true);
      });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-slate-100 mb-1">Transfer ledger</h1>
      <p className="text-sm text-slate-400 mb-6">Every transfer you've locked in, in one place.</p>
      {isDemoData && (
        <p className="text-xs font-mono text-slate-500 mb-4">
          Showing sample data - connect the FastAPI backend to see your real ledger.
        </p>
      )}
      <div className="hidden md:block glass-panel overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-mono uppercase text-slate-500 border-b border-white/5">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Recipient</th>
              <th className="px-5 py-3">Sent</th>
              <th className="px-5 py-3">Received</th>
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.03] last:border-0">
                <td className="px-5 py-3 text-slate-400 font-mono text-xs">{t.date}</td>
                <td className="px-5 py-3 text-slate-100">{t.recipient}</td>
                <td className="px-5 py-3 text-slate-300 font-mono">{t.sent}</td>
                <td className="px-5 py-3 text-slate-100 font-mono">{t.received}</td>
                <td className="px-5 py-3 text-slate-400">{t.provider}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {transfers.map((t) => (
          <div key={t.id} className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-100 text-sm font-medium">{t.recipient}</p>
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[t.status]}`}>{t.status}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>{t.date}</span>
              <span>{t.provider}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-slate-400 font-mono">{t.sent}</span>
              <span className="text-slate-100 font-mono">{t.received}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
