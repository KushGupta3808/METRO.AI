import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Modern, clean, standard Zustand Currency Store.
 * Supports both named export: import { useCurrencyStore } from '...'
 * and default export: import useCurrencyStore from '...'
 */
export const useCurrencyStore = create((set, get) => ({
  baseCurrency: 'CAD',
  targetCurrency: 'INR',
  hasOnboarded: false,

  /**
   * Restores user corridor preferences and active onboarding state.
   */
  syncPreferences: (base, target) => {
    set({
      baseCurrency: base || 'CAD',
      targetCurrency: target || 'INR',
      hasOnboarded: !!(base && target),
    });
  },

  /**
   * Helper action to manually set the onboarded state on the frontend
   */
  setOnboarded: (onboarded) => {
    set({ hasOnboarded: onboarded });
  },

  /**
   * Triggers onboarding updates. Saves choices to local memory and
   * synchronizes preferences with the secure profile PATCH endpoint.
   */
  setOnboardingPreferences: async (base, target) => {
    const token = useAuthStore.getState().token;
    
    // Save state locally first for snappy UI transitions
    set({ baseCurrency: base, targetCurrency: target, hasOnboarded: true });

    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base_currency: base,
          target_currency: target,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update User profile configuration context directly in main auth store
        useAuthStore.setState({ user: updatedUser });
      } else {
        console.error('Failed to synchronize currency choices to the remote profile.');
      }
    } catch (error) {
      console.error('Connection exception during preference synchronization:', error);
    }
  },
}));

export default useCurrencyStore;