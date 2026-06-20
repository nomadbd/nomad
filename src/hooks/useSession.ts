// src/hooks/useSession.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ১. ইনিশিয়াল সেশন চেক করা
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // ২. সেশন বা অথ স্টেট পরিবর্তনের লিসেনার
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // পাসওয়ার্ড রিসেট বা রিকভারি চলাকালীন আমরা সেশন আপডেট করব না, 
      // যাতে অ্যাপটি ভুলবশত লগইন স্টেট ধরে না নেয়।
      if (event === 'PASSWORD_RECOVERY') {
        setLoading(false);
        return;
      }

      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
};
