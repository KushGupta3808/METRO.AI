import { create } from 'zustand';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Modern, clean, standard Zustand Auth Store.
 * Supports both named export: import { useAuthStore } from '...'
 * and default export: import useAuthStore from '...'
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  authLoading: false,

  /**
   * Complete signup sequence linking to the FastAPI /auth/signup endpoint.
   * Auto-logs in the user upon successful creation.
   */
  signup: async (email, password, baseCurrency = 'CAD', targetCurrency = 'INR') => {
    console.log('[METRO AI AUTH] Initiating Signup sequence for:', email);
    set({ authLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          base_currency: baseCurrency,
          target_currency: targetCurrency,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('[METRO AI AUTH] Signup rejected by backend:', errData);
        throw new Error(errData.detail || 'Registration failed');
      }

      const createdUser = await response.json();
      console.log('[METRO AI AUTH] Signup successful! User created:', createdUser);

      // Automatically authenticate user upon successful registration
      console.log('[METRO AI AUTH] Triggering auto-login post-signup...');
      return await get().login(email, password);
    } catch (error) {
      console.error('[METRO AI AUTH] Signup exception encountered:', error);
      set({ authLoading: false });
      throw error;
    }
  },

  /**
   * Handles user login, receives JWT access tokens, saves credentials locally,
   * and populates active session parameters.
   */
  login: async (email, password) => {
    console.log('[METRO AI AUTH] Initiating Login request for:', email);
    set({ authLoading: true });
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('[METRO AI AUTH] Login credentials rejected:', errData);
        throw new Error(errData.detail || 'Invalid username or password');
      }

      const data = await response.json();
      const token = data.access_token;
      console.log('[METRO AI AUTH] Login approved! Storing secure JWT access token...');

      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });

      // Fetch profile state directly to restore customized preferences
      await get().checkAuthSession();
      return true;
    } catch (error) {
      console.error('[METRO AI AUTH] Login exception encountered:', error);
      set({ authLoading: false });
      throw error;
    }
  },

  /**
   * Triggers silent sessions checks. Performs token analysis and fetches profiles
   * securely to populate frontend memory.
   */
  checkAuthSession: async () => {
    const token = get().token || localStorage.getItem('token');
    if (!token) {
      console.log('[METRO AI AUTH] Session check skipped: No local token detected.');
      set({ isAuthenticated: false, user: null, authLoading: false });
      return;
    }

    console.log('[METRO AI AUTH] Verifying token validity with secure profile endpoint...');
    set({ authLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        console.log('[METRO AI AUTH] Session check approved! Active User:', user);
        
        set({ user, isAuthenticated: true, authLoading: false });

        // CRITICAL SYNC HOOK: Instantly inform useCurrencyStore of onboarding preferences
        // to automatically bypass the onboarding page router block!
        import('./useCurrencyStore').then((module) => {
          const currencyStore = module.useCurrencyStore || module.default;
          if (currencyStore && typeof currencyStore.getState === 'function') {
            console.log('[METRO AI AUTH] Auto-syncing corridor preferences to Currency Store...');
            currencyStore.getState().syncPreferences(user.base_currency, user.target_currency);
          }
        });

      } else {
        console.warn('[METRO AI AUTH] Token rejected or expired by server. Clearing session parameters...');
        get().logout();
      }
    } catch (error) {
      set({ authLoading: false });
      console.error('[METRO AI AUTH] Session check failed to connect to host:', error);
    }
  },

  /**
   * Destroys active tokens, completely logging out active user context.
   */
  logout: () => {
    console.log('[METRO AI AUTH] Destroying active session token. Logging out...');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authLoading: false });
    
    // Clear onboarding status in sibling store
    import('./useCurrencyStore').then((module) => {
      const currencyStore = module.useCurrencyStore || module.default;
      if (currencyStore && typeof currencyStore.getState === 'function') {
        currencyStore.getState().setOnboarded(false);
      }
    });
  },
}));

export default useAuthStore;