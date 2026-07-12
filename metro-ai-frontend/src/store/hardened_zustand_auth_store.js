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
        throw new Error(errData.detail || 'Registration failed');
      }

      // Automatically authenticate user upon successful registration
      return await get().login(email, password);
    } catch (error) {
      set({ authLoading: false });
      throw error;
    }
  },

  /**
   * Handles user login, receives JWT access tokens, saves credentials locally,
   * and populates active session parameters.
   */
  login: async (email, password) => {
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
        throw new Error(errData.detail || 'Invalid username or password');
      }

      const data = await response.json();
      const token = data.access_token;

      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });

      // Fetch profile state directly to restore customized preferences
      await get().checkAuthSession();
      return true;
    } catch (error) {
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
      set({ isAuthenticated: false, user: null, authLoading: false });
      return;
    }

    set({ authLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, authLoading: false });
      } else {
        // Clear corrupt, broken, or expired sessions automatically
        get().logout();
      }
    } catch (error) {
      set({ authLoading: false });
      console.error('Session restoration failed:', error);
    }
  },

  /**
   * Destroys active tokens, completely logging out active user context.
   */
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authLoading: false });
  },
}));

export default useAuthStore;