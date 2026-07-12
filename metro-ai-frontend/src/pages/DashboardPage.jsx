import NetworkBackground from '../components/dashboard/NetworkBackground';
import Bulletin from '../components/dashboard/Bulletin';
import RateGraph from '../components/dashboard/RateGraph';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative">
      <NetworkBackground />
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-100">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-sm text-slate-400">Here's how your corridor is moving today.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RateGraph />
        </div>
        <div className="lg:col-span-2">
          <Bulletin />
        </div>
      </div>
    </div>
  );
}
