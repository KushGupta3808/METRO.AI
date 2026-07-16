import CompareEngine from '../components/compare/CompareEngine';

export default function ComparePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-100">Compare routes</h1>
        <p className="text-sm text-slate-400">Real-time provider comparison plus the AI send-or-hold call.</p>
      </div>
      <CompareEngine />
    </div>
  );
}