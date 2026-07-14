import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import ChatWidget from '../chatbot/ChatWidget';

export default function AppLayout() {
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
