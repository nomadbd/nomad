import { supabase } from '../supabaseClient';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushActionResult {
  ok: boolean;
  message?: string;
}

export async function subscribeUserToPush(): Promise<PushActionResult> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      return { ok: false, message: 'This browser does not support push notifications.' };
    }

    if (Notification.permission === 'denied') {
      return {
        ok: false,
        message: 'Notification permission is blocked in browser site settings.'
      };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        ok: false,
        message: permission === 'denied'
          ? 'Notification permission was blocked.'
          : 'Notification permission was not granted.'
      };
    }

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return { ok: false, message: 'VITE_VAPID_PUBLIC_KEY is missing.' };
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, message: 'User session not found.' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return { ok: false, message: `Database error: ${error.message}` };
    }

    return { ok: true, message: 'Real-time sales alerts enabled.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to enable push notifications.' };
  }
}

export async function isUserSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
    return false;
  }
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

export async function unsubscribeUserFromPush(): Promise<PushActionResult> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, message: 'Push notifications are not supported.' };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { ok: false, message: 'Service worker registration not found.' };
    }

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          return { ok: false, message: `Database error: ${error.message}` };
        }
      }
      return { ok: true, message: 'Real-time sales alerts disabled.' };
    }

    return { ok: true, message: 'Real-time sales alerts disabled.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to disable push notifications.' };
  }
}
