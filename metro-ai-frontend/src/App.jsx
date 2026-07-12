import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Loader3D from './components/loader/Loader3D';
import AppRouter from './router/AppRouter';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {isBooting ? (
        <motion.div key="loader" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
          <Loader3D onComplete={() => setIsBooting(false)} />
        </motion.div>
      ) : (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
