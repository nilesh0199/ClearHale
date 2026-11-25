/**
 * Clearhale Severe Air Notifications
 * Triggers actionable alerts when PM2.5 crosses Very Poor (>120) or Severe (>250).
 * Strictly throttled to an 8-hour cooldown to avoid notification fatigue.
 */

const NOTIFICATION_STORAGE_KEY = 'clearhale_last_severe_alert';
const NOTIFICATION_PROMPTED_KEY = 'clearhale_notifications_prompted';
const NOTIFICATIONS_ENABLED_KEY = 'clearhale_notifications_enabled';
export const NOTIFICATION_NEVER_ASK_KEY = 'clearhale_notifications_never_ask';
export const NOTIFICATION_FIRST_MODAL_DONE_KEY = 'clearhale_notifications_first_modal_done';
export const NOTIFICATION_DAILY_DISMISSED_KEY = 'clearhale_nudge_alerts_dismissed';

// Cooldown interval: 8 hours
export const SEVERE_ALERT_COOLDOWN_MS = 8 * 60 * 60 * 1000;

interface StoredAlertMeta {
  timestamp: number;
  band: 'very_poor' | 'severe';
  pm25: number;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function hasBeenPromptedForNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_PROMPTED_KEY) === 'true';
}

export function markNotificationPrompted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_PROMPTED_KEY, 'true');
}

export function isNeverAskNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_NEVER_ASK_KEY) === 'true';
}

export function setNeverAskNotifications(neverAsk: boolean): void {
  if (typeof window === 'undefined') return;
  if (neverAsk) {
    localStorage.setItem(NOTIFICATION_NEVER_ASK_KEY, 'true');
    markNotificationPrompted();
    markFirstTimeNotificationModalDone();
  } else {
    localStorage.removeItem(NOTIFICATION_NEVER_ASK_KEY);
  }
}

export function isFirstTimeNotificationModalDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_FIRST_MODAL_DONE_KEY) === 'true';
}

export function markFirstTimeNotificationModalDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_FIRST_MODAL_DONE_KEY, 'true');
  markNotificationPrompted();
}

export function isDailyAlertNudgeDismissed(todayStr: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_DAILY_DISMISSED_KEY) === todayStr;
}

export function dismissDailyAlertNudge(todayStr: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_DAILY_DISMISSED_KEY, todayStr);
}

export function isSevereAlertsEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return stored !== 'false';
}

export function setSevereAlertsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  markNotificationPrompted();
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setSevereAlertsEnabled(true);
    }
    return permission;
  } catch (err) {
    console.error('[Notifications] Permission request error:', err);
    return Notification.permission;
  }
}

/**
 * Checks whether PM2.5 crosses into Very Poor or Severe and sends alert if 8h cooldown elapsed.
 */
export async function checkAndTriggerSevereAlert(
  pm25: number,
  cityName: string,
  bandLabel?: string
): Promise<boolean> {
  if (!isSevereAlertsEnabled()) return false;
  if (pm25 <= 120) return false;

  const currentSeverity: 'very_poor' | 'severe' = pm25 > 250 ? 'severe' : 'very_poor';
  const label = bandLabel || (currentSeverity === 'severe' ? 'Severe' : 'Very Poor');

  // Check 8-hour cooldown
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      const meta: StoredAlertMeta = JSON.parse(raw);
      const timeSinceLast = Date.now() - meta.timestamp;
      const isEscalation = meta.band === 'very_poor' && currentSeverity === 'severe';

      // If within 8h and NOT an emergency escalation from Very Poor -> Severe, skip
      if (timeSinceLast < SEVERE_ALERT_COOLDOWN_MS && !isEscalation) {
        return false;
      }
    }

    const title = `⚠️ Severe Air Alert: ${cityName}`;
    const body = `PM2.5 is ${Math.round(pm25)} µg/m³ (${label}). Keep windows closed and wear N95 outdoors.`;

    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'clearhale-severe-alert',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    const newMeta: StoredAlertMeta = {
      timestamp: Date.now(),
      band: currentSeverity,
      pm25: Math.round(pm25),
    };
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newMeta));
    return true;
  } catch (err) {
    console.error('[Notifications] Failed to trigger severe alert:', err);
    return false;
  }
}

/**
 * Sends a lightweight test notification to confirm browser alerts work.
 */
export async function sendTestNotification(cityName = 'Your City'): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  
  let permission: NotificationPermission | 'unsupported' = Notification.permission;
  if (permission !== 'granted') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') return false;

  try {
    const title = `🔔 Clearhale Air Alerts Active`;
    const body = `You will be alerted if ${cityName} PM2.5 crosses Very Poor (>120) or Severe (>250).`;

    const n = new Notification(title, {
      body,
      icon: '/logo.png',
      tag: 'clearhale-test-alert',
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (err) {
    console.error('[Notifications] Test alert failed:', err);
    return false;
  }
}
