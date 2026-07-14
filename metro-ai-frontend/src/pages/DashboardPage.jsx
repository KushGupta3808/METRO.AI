import NetworkBackground from '../components/dashboard/NetworkBackground';
import NewsFeed from '../components/dashboard/NewsFeed';
import RateGraph from '../components/dashboard/RateGraph';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative">
      <NetworkBackground />
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
