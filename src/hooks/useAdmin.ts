import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types/auth';

export const useAdmin = (userId?: string) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        // ১. যদি userId বাইরে থেকে না দেওয়া হয়, তবে বর্তমান লগইন করা ইউজারের ID ফেচ করবে
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          targetUserId = user?.id;
        }

        if (!targetUserId) {
          setRole(null);
          setLoading(false);
          return;
        }

        // ২. profiles টেবিল থেকে বর্তমান ইউজারের role আনা
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', targetUserId)
          .single();

        if (!error && data && data.role) {
          setRole(data.role as UserRole);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  // ৩. রোল ভিত্তিক অ্যাক্সেস চেকার (ADMIN সবার বড়)
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER' || role === 'ADMIN';
  const isFinance = role === 'FINANCE' || role === 'ADMIN';

  return { role, isAdmin, isManager, isFinance, loading };
};
