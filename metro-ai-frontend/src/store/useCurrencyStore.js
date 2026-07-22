import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCurrencyStore = create(
  persist(
    (set) => ({
      baseCurrency: null,
      targetCurrency: null,
      hasOnboarded: false,

      // Called from OnboardingPage when the user actively picks a corridor.
      setPreferences: (baseCurrency, targetCurrency) =>
        set({ baseCurrency, targetCurrency, hasOnboarded: true }),

      // Called by useAuthStore after a successful login/session-check, to
      // pull whatever corridor the backend already has on file for this
      // user. Guards against nulls: a brand-new account with no saved
      // preferences yet should still be sent through onboarding, not
      // marked as already-onboarded with empty currencies.
      syncPreferences: (baseCurrency, targetCurrency) => {
        if (!baseCurrency || !targetCurrency) return;
        set({ baseCurrency, targetCurrency, hasOnboarded: true });
      },

      // Called by useAuthStore.logout() so the next sign-in on this browser
      // goes through onboarding again, rather than silently reusing
      // whichever user was last signed in here.
      setOnboarded: (value) => set({ hasOnboarded: value }),
    }),
    { name: 'metro-ai-currency' }
  )
);

export default useCurrencyStore;