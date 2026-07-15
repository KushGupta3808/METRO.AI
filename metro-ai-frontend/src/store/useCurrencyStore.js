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
    const hasOnboarded = !!(base && target);
    console.log(`[METRO AI CURRENCY] Synchronizing state parameters. Corridor: ${base} -> ${target}. Onboarded: ${hasOnboarded}`);
    set({
      baseCurrency: base || 'CAD',
      targetCurrency: target || 'INR',
      hasOnboarded: hasOnboarded,
    });
  },

  /**
   * Helper action to manually set the onboarded state on the frontend
   */
  setOnboarded: (onboarded) => {
    console.log('[METRO AI CURRENCY] Setting manual Onboarded flag state to:', onboarded);
    set({ hasOnboarded: onboarded });
  },

  /**
   * Triggers onboarding updates. Saves choices to local memory and
   * synchronizes preferences with the secure profile PATCH endpoint.
   */
  setOnboardingPreferences: async (base, target) => {
    console.log(`[METRO AI CURRENCY] Committing onboarding corridor choice: ${base} -> ${target}`);
    const token = useAuthStore.getState().token;
    
    // Save state locally first for snappy UI transitions
    set({ baseCurrency: base, targetCurrency: target, hasOnboarded: true });

    if (!token) {
      console.warn('[METRO AI CURRENCY] No active token detected. Bypassing remote profile PATCH sync.');
      return;
    }

    try {
      console.log('[METRO AI CURRENCY] Patching remote user profile preferences...');
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
        console.log('[METRO AI CURRENCY] Remote profile synchronization completed successfully:', updatedUser);
        
        // Update User profile configuration context directly in main auth store
        useAuthStore.setState({ user: updatedUser });
      } else {
        console.error('[METRO AI CURRENCY] Failed to synchronize currency choices to the remote profile.');
      }
    } catch (error) {
      console.error('[METRO AI CURRENCY] Connection exception during preference synchronization:', error);
    }
  },

  /**
   * Backward-compatible alias matching old onboarding component calls.
   */
  setPreferences: async (base, target) => {
    console.log(`[METRO AI CURRENCY] Legacy setPreferences call captured. Redirecting internally...`);
    return await get().setOnboardingPreferences(base, target);
  }
}));

export default useCurrencyStore;