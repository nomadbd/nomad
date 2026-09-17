import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export function useEmailCheck(defaultEmail: string, emailInput: string) {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [accountFound, setAccountFound] = useState<boolean | null>(null);

  const checkEmailExistence = async (emailToCheck: string) => {
    const cleanEmail = emailToCheck.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAccountFound(null);
      return null;
    }

    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        setAccountFound(true);
        return true;
      } else {
        setAccountFound(false);
        return false;
      }
    } catch {
      setAccountFound(null);
      return null;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (defaultEmail) {
      checkEmailExistence(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEmail = emailInput.trim() || defaultEmail;
      if (activeEmail.length > 3 && activeEmail.includes('@')) {
        checkEmailExistence(activeEmail);
      } else {
        setAccountFound(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [emailInput, defaultEmail]);

  return { isCheckingEmail, accountFound, checkEmailExistence };
}
