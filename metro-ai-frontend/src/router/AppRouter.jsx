import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import ComparePage from '../pages/ComparePage';
import LedgerPage from '../pages/LedgerPage';
import RecipientsPage from '../pages/RecipientsPage';
import FAQPage from '../pages/FAQPage';
import AboutPage from '../pages/AboutPage';

function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireOnboarding({ children }) {
  const hasOnboarded = useCurrencyStore((s) => s.hasOnboarded);
  return hasOnboarded ? children : <Navigate to="/onboarding" replace />;
}

export default function AppRouter() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireOnboarding>
              <AppLayout />
            </RequireOnboarding>
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/recipients" element={<RecipientsPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
