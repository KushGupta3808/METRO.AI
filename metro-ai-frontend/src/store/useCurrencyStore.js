import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCurrencyStore = create(
  persist(
    (set) => ({
      baseCurrency: null,
      targetCurrency: null,
      hasOnboarded: false,
      setPreferences: (baseCurrency, targetCurrency) =>
        set({ baseCurrency, targetCurrency, hasOnboarded: true }),
    }),
    { name: 'metro-ai-currency' }
  )
);
