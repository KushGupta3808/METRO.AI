import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Rate alerts are entirely client-side - there's no backend table for
// these, no server-side job scheduler, and no push/email service in this
// project. That means alerts only fire while this app is open in a
// browser tab (see useRateAlerts.js), and they live in this browser's
// localStorage, not synced to your account or across devices. That's an
// honest, real limitation worth stating plainly rather than pretending
// this is server-side push notifications - building that would mean a
// new backend model, a job scheduler, and either a web push or email
// service, which is real infrastructure this project doesn't have yet.
export const useAlertStore = create(
  persist(
    (set, get) => ({
      alerts: [],

      addAlert: ({ base, target, direction, threshold }) => {
        const alert = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          base,
          target,
          direction, // 'above' | 'below'
          threshold: Number(threshold),
          createdAt: new Date().toISOString(),
          triggered: false,
          triggeredAt: null,
        };
        set({ alerts: [...get().alerts, alert] });
        return alert;
      },

      removeAlert: (id) => set({ alerts: get().alerts.filter((a) => a.id !== id) }),

      markTriggered: (id) =>
        set({
          alerts: get().alerts.map((a) =>
            a.id === id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
          ),
        }),

      resetAlert: (id) =>
        set({
          alerts: get().alerts.map((a) => (a.id === id ? { ...a, triggered: false, triggeredAt: null } : a)),
        }),
    }),
    { name: 'metro-ai-rate-alerts' }
  )
);

export default useAlertStore;