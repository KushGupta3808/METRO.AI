import { create } from 'zustand';
import { useCurrencyStore } from './useCurrencyStore';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Helper to safely extract error strings from FastAPI (handles both standard string details 
 * and Pydantic 422 validation error arrays).
 */
const parseFastAPIError = (errData) => {
  if (!errData) return 'An unexpected error occurred';
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail
      .map((err) => `${err.loc ? err.loc.slice(1).join('.') : 'field'}: ${err.msg}`)
      .join(' | ');
  }
  return typeof errData === 'string' ? errData : JSON.stringify(errData);
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  authLoading: false,
  isInitialized: false,

  /**
   * Complete signup sequence linking to FastAPI /auth/signup.
   */
  signup: async (emailOrObj, passwordArg, baseCurrency = 'CAD', targetCurrency = 'INR') => {
    let email = emailOrObj;
    let password = passwordArg;
    let base = baseCurrency;
    let target = targetCurrency;

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
          email: String(email || '').trim(),
          password: String(password || ''),
          base_currency: base,
          target_currency: target,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        const errorMessage = parseFastAPIError(errData);
        console.error('[METRO AI AUTH] Signup rejected by backend:', errorMessage);
        throw new Error(errorMessage);
      }

      const createdUser = await response.json();
      console.log('[METRO AI AUTH] Signup successful! User created:', createdUser);

      // Auto-login post registration. NOTE: this resolves to `true` (a
      // boolean), not { user, token } - callers should just await this and
      // then read state from the store (get().user / get().token), not
      // destructure the return value.
      return await get().login(email, password);
    } catch (error) {
      console.error('[METRO AI AUTH] Signup exception encountered:', error.message || error);
      set({ authLoading: false });
      throw error;
    }
  },

  /**
   * Handles user login with OAuth2 x-www-form-urlencoded specification.
   */
  login: async (emailOrObj, passwordArg) => {
    let email = emailOrObj;
    let password = passwordArg;

    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email || emailOrObj.username;
      password = emailOrObj.password;
    }

    email = String(email || '').trim();
    password = String(password || '');

    console.log('[METRO AI AUTH] Initiating Login request for email:', email);

    if (!email || !password) {
      const missingErr = `Missing required credentials: ${!email ? 'email ' : ''}${!password ? 'password' : ''}`.trim();
      console.error('[METRO AI AUTH]', missingErr);
      set({ authLoading: false });
      throw new Error(missingErr);
    }

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
        const errorMessage = parseFastAPIError(errData);
        console.error('[METRO AI AUTH] Login credentials rejected:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const token = data.access_token;
      console.log('[METRO AI AUTH] Login approved! Storing secure JWT access token...');

      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });

      await get().checkAuthSession();
      return true;
    } catch (error) {
      console.error('[METRO AI AUTH] Login exception encountered:', error.message || error);
      set({ authLoading: false });
      throw error;
    }
  },

  /**
   * Triggers silent session checks.
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

        // Static import now, not a dynamic one - this used to be a
        // fire-and-forget `.then()` with no `.catch()`, so if
        // useCurrencyStore didn't have a `syncPreferences` method, this
        // threw silently in the background and the onboarding redirect
        // logic just quietly never fired. Calling it directly here means
        // it runs synchronously as part of this same call, and any error
        // surfaces immediately instead of vanishing into an unhandled
        // rejection.
        console.log('[METRO AI AUTH] Auto-syncing corridor preferences to Currency Store...');
        useCurrencyStore.getState().syncPreferences(user.base_currency, user.target_currency);

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
    useCurrencyStore.getState().setOnboarded(false);
  },
}));

export default useAuthStore;