// src/hooks/useSession.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useSession = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event); // ডিবাগের জন্য (পরে রিমুভ করতে পারো)
      
      setSession(session);
      
      // শুধুমাত্র প্রথমবার loading false করো
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loading]);   // ← loading dependency যোগ করা হয়েছে

  return { session, loading };
};