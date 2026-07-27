import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types/auth';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // ১. বর্তমান অথেন্টিকেটেড ইউজার ফেচ করা
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // ২. profiles টেবিল থেকে ডাটা ফেচ করা
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Profile not found in database, creating temporary profile state:', profileError);
        // ডাটাবেজে সাময়িকভাবে রো না থাকলে সেফ ফলব্যাক
        setUserProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'CYBER_OPERATOR',
          email: user.email || '',
          role: 'MANAGER',
          permissions: { orders: true, products: true, finance: false, settings: false },
          hired_at: user.created_at,
          role_assigned_at: user.created_at,
          created_at: user.created_at,
        });
      } else if (profile) {
        setUserProfile(profile as UserProfile);
      }
    } catch (err: any) {
      console.error('Error in useUserProfile:', err);
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { 
    userProfile, 
    loading, 
    error, 
    refetchProfile: fetchProfile // প্রোফাইল আপডেট হলে ম্যানুয়ালি পুনরায় রিফ্রেশ করার জন্য
  };
};
