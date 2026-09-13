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

export async function subscribeUserToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was denied.');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not defined.');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('Failed to save push subscription to Supabase:', error);
    } else {
      console.log('Push subscription successfully saved!');
    }
  } catch (err) {
    console.error('Error during push subscription:', err);
  }
}
