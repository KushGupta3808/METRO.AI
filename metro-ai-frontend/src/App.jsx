import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/common/ErrorBoundary';
import IntroVideo from './components/intro/IntroVideo';
import Loader3D from './components/loader/Loader3D';
import AppRouter from './router/AppRouter';
import { useAuthStore } from './store/useAuthStore'; // 👈 Adjust path if in ./store/useAuthStore

const BOOT_KEY = 'metro-ai-boot-seen';

function getInitialStage() {
  if (typeof window === 'undefined') return 'intro';
  return sessionStorage.getItem(BOOT_KEY) ? 'app' : 'intro';
}

export default function App() {
  // 'intro' -> 'loading' -> 'app'. Gated by sessionStorage so returning
  // users within the same tab session land straight on the app.
  const [stage, setStage] = useState(getInitialStage);
  const checkAuthSession = useAuthStore((state) => state.checkAuthSession);

  // 🔒 Run token verification as soon as the app mounts
  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  function finishBoot() {
    sessionStorage.setItem(BOOT_KEY, '1');
    setStage('app');
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div key="intro" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <IntroVideo onComplete={() => setStage('loading')} />
          </motion.div>
        )}
        {stage === 'loading' && (
          <motion.div key="loader" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
            <Loader3D onComplete={finishBoot} />
          </motion.div>
        )}
        {stage === 'app' && (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}