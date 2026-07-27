// src/hooks/useSession.ts
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // ১. প্রথমবার বর্তমান সেশন চেক করা
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // ২. লগইন, লগআউট বা টোকেন রিফ্রেশ হলে সেশন আপডেট রাখা
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // 🟢 খালি অ্যারে [] রাখলে useEffect শুধু প্রথমবার কম্পোনেন্ট মাউন্ট হলে রান হবে

  return {
    session,
    user: session?.user ?? null, // সহজে ইউজার অবজেক্ট সরাসরি অ্যাক্সেস করার জন্য
    loading,
  };
};
