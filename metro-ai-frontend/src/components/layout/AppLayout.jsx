import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import ChatWidget from '../chatbot/ChatWidget';
import { useRateAlerts } from '../../hooks/useRateAlerts';

export default function AppLayout() {
  // Lives here rather than in DashboardPage so alerts get checked while
  // you're on Compare, Ledger, or Recipients too - not just while the
  // Dashboard specifically happens to be mounted. If you still have a
  // `useRateAlerts()` call in DashboardPage.jsx from before, remove it -
  // having both mounted at once would run two independent interval
  // timers checking the same alerts twice as often as intended.
  useRateAlerts();

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}