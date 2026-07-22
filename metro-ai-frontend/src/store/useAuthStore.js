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
  isInitialized: false, // Prevents router race conditions during initial app load

  /**
   * Complete signup sequence linking to the FastAPI /auth/signup endpoint.
   * Auto-logs in the user upon successful creation.
   * Supports both: signup(email, password, baseCurrency, targetCurrency)
   * AND signup({ email, password, baseCurrency, targetCurrency })
   */
  signup: async (emailOrObj, passwordArg, baseCurrency = 'CAD', targetCurrency = 'INR') => {
    let email = emailOrObj;
    let password = passwordArg;
    let base = baseCurrency;
    let target = targetCurrency;

    // Handle object payload if passed directly from form submit handlers
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email;
      password = emailOrObj.password;
      base = emailOrObj.baseCurrency || emailOrObj.base_currency || 'CAD';
      target = emailOrObj.targetCurrency || emailOrObj.target_currency || 'INR';
    }

    console.log('[METRO AI AUTH] Initiating Signup sequence for email:', email);
    set({ authLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          base_currency: base,
          target_currency: target,
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
   * Supports both: login(email, password) AND login({ email, password })
   */
  login: async (emailOrObj, passwordArg) => {
    let email = emailOrObj;
    let password = passwordArg;

    // Handle object payload if passed directly from form submit handlers
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email || emailOrObj.username;
      password = emailOrObj.password;
    }

    console.log('[METRO AI AUTH] Initiating Login request for email:', email);
    set({ authLoading: true });
    try {
      const formData = new URLSearchParams();
      formData.append('username', String(email || ''));
      formData.append('password', String(password || ''));

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
   * Triggers silent session checks. Performs token analysis and fetches profiles
   * securely to populate frontend memory.
   */
  checkAuthSession: async () => {
    const token = get().token || localStorage.getItem('token');
    
    if (!token) {
      console.log('[METRO AI AUTH] Session check skipped: No local token detected.');
      get().logout();
      set({ isInitialized: true, authLoading: false });
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
        
        set({ user, isAuthenticated: true });

        // CRITICAL SYNC HOOK: Instantly inform useCurrencyStore of onboarding preferences
        import('./useCurrencyStore').then((module) => {
          const currencyStore = module.useCurrencyStore || module.default;
          if (currencyStore && typeof currencyStore.getState === 'function') {
            console.log('[METRO AI AUTH] Auto-syncing corridor preferences to Currency Store...');
            currencyStore.getState().syncPreferences(user.base_currency, user.target_currency);
          }
        });

      } else {
        console.warn('[METRO AI AUTH] Token rejected or expired by server (401/403). Clearing session...');
        get().logout();
      }
    } catch (error) {
      console.error('[METRO AI AUTH] Session check failed to connect to host:', error);
      get().logout();
    } finally {
      set({ isInitialized: true, authLoading: false });
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
        if (typeof currencyStore.getState().setOnboarded === 'function') {
          currencyStore.getState().setOnboarded(false);
        }
      }
    });
  },
}));

export default useAuthStore;