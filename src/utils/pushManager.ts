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

// ১. নোটিফিকেশন সাবস্ক্রাইব করার ফাংশন
export async function subscribeUserToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was denied.');
      return false;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not defined.');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

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
      return false;
    }

    console.log('Push subscription successfully saved!');
    return true;
  } catch (err) {
    console.error('Error during push subscription:', err);
    return false;
  }
}

// ২. ইউজার বর্তমানে সাবস্ক্রাইবড কি না চেক করার ফাংশন
export async function isUserSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

// ৩. নোটিফিকেশন আনসাবস্ক্রাইব (বন্ধ) করার ফাংশন
export async function unsubscribeUserFromPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // ব্রাউজার লেভেল থেকে অফ করা
      await subscription.unsubscribe();

      // Supabase ডাটাবেজ থেকেও সাবস্ক্রিপশন মুছে ফেলা
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error during push unsubscription:', err);
    return false;
  }
}
