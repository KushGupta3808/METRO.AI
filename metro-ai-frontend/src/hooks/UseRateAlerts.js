import { useEffect, useRef, useCallback } from 'react';
import { getLatestRate } from '../services/marketService';
import { useAlertStore } from '../store/useAlertStore';

const CHECK_INTERVAL_MS = 60_000; // once a minute while the app is open

const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

export function getNotificationPermission() {
  return isNotificationSupported ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported) return 'unsupported';
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

function fireNotification(alert, rate) {
  const direction = alert.direction === 'above' ? 'risen above' : 'fallen below';
  const title = `${alert.base}/${alert.target} rate alert`;
  const body = `The rate has ${direction} ${alert.threshold} - it's currently ${rate.toFixed(4)}.`;

  if (isNotificationSupported && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo-icon.png' });
  }
  // If permission was never granted, the alert still gets marked as
  // triggered and shown in-app (see RateAlerts.jsx) - the OS-level popup
  // is a bonus, not the only way to see it fired.
}

// Checks every active (non-triggered) alert against a real current rate,
// once on mount and then on a repeating interval for as long as this
// component tree stays mounted. This is genuinely real - it calls the
// same live Frankfurter-backed getLatestRate() the rest of the app uses,
// not a fake timer - but it only runs while the tab is open, which is
// the honest scope of a client-only implementation.
export function useRateAlerts() {
  const alerts = useAlertStore((s) => s.alerts);
  const markTriggered = useAlertStore((s) => s.markTriggered);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const checkAlerts = useCallback(async () => {
    const active = alertsRef.current.filter((a) => !a.triggered);
    for (const alert of active) {
      try {
        const { rate } = await getLatestRate(alert.base, alert.target);
        const isTriggered = alert.direction === 'above' ? rate >= alert.threshold : rate <= alert.threshold;
        if (isTriggered) {
          markTriggered(alert.id);
          fireNotification(alert, rate);
        }
      } catch {
        // A single alert failing to check shouldn't block the others.
      }
    }
  }, [markTriggered]);

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkAlerts]);
}