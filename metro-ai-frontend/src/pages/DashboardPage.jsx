import { lazy, Suspense } from 'react';
import NewsFeed from '../components/dashboard/NewsFeed';
import RateGraph from '../components/dashboard/RateGraph';
import { useAuthStore } from '../store/useAuthStore';

// Lazy-loaded: this is a purely decorative background (opacity-60,
// pointer-events-none) built on React Three Fiber, which pulls in the
// three.js chunk - the single heaviest dependency in the app (~272KB
// gzipped). Statically importing it meant that chunk had to finish loading
// before the actual dashboard content (the rate graph, the news feed)
// could render at all. Suspense with a null fallback means the real
// content shows up immediately, and the background fades in afterward
// whenever its chunk is ready - no visible loading state needed since it's
// just ambient decoration, not something the user is waiting on.
const NetworkBackground = lazy(() => import('../components/dashboard/NetworkBackground'));

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative">
      <Suspense fallback={null}>
        <NetworkBackground />
      </Suspense>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl text-slate-100">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-slate-400">Here's how your corridor is moving today.</p>
      </div>

      <div className="mb-8">
        <RateGraph />
      </div>

      <NewsFeed />
    </div>
  );
}