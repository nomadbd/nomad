import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const useAdmin = (userId?: string) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      // profiles টেবিল থেকে বর্তমান ইউজারের role আনা
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setRole(data.role);
      } else {
        setRole('user');
      }
      setLoading(false);
    };

    fetchRole();
  }, [userId]);

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'admin';

  return { role, isAdmin, isManager, loading };
};
