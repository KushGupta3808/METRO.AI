import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PageTransition from './PageTransition';
import ChatWidget from '../chatbot/ChatWidget';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <ChatWidget />
    </div>
  );
}
