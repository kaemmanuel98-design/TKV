import { useEffect, useRef } from 'react';
import { fetchCompanionCrises } from '../lib/companionApi';

/**
 * Alerte navigateur (Notification API) quand une nouvelle crise Confessionnal apparaît.
 * Fonctionne si l’accompagnateur a autorisé les notifications et que l’onglet est ouvert.
 */
export function useCompanionCrisisAlerts(accessToken, enabled, t) {
  const seenRef = useRef(new Set());
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !accessToken) return undefined;

    const poll = async () => {
      try {
        const { crises } = await fetchCompanionCrises(accessToken);
        const list = crises || [];
        if (!bootstrappedRef.current) {
          for (const c of list) {
            if (c.id) seenRef.current.add(c.id);
          }
          bootstrappedRef.current = true;
          return;
        }
        for (const c of list) {
          if (!c.id || seenRef.current.has(c.id)) continue;
          seenRef.current.add(c.id);
          if (seenRef.current.size > 80) {
            const arr = [...seenRef.current];
            seenRef.current = new Set(arr.slice(-40));
            seenRef.current.add(c.id);
          }
          const level = c.crisis_level || 'high';
          if (level !== 'critical' && level !== 'high') continue;
          if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
            continue;
          }
          const title = t('companion_push_crisis_title');
          const body = t('companion_push_crisis_body', {
            level: level === 'critical' ? t('companion_crisis') : level,
          });
          // eslint-disable-next-line no-new
          new Notification(title, { body, tag: `tkv-crisis-${c.id}` });
        }
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    const id = setInterval(poll, 45_000);
    return () => clearInterval(id);
  }, [accessToken, enabled, t]);
}

export async function requestCompanionNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}
