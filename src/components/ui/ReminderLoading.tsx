import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface Reminder {
  content: string;
  reference?: string;
}

interface ReminderLoadingProps {
  label?: string;
  position?: 'top' | 'center' | 'bottom';
}

export const ReminderLoading: React.FC<ReminderLoadingProps> = ({ 
  position = 'center' 
}) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchRandomReminder = async () => {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .select('content, reference')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setReminder(data[randomIndex]);
        }
      } catch (err) {
        console.error('Error loading ethical reminder:', err);
      }
    };

    fetchRandomReminder();

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 9400);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  const getJustifyContent = () => {
    if (position === 'top') return 'flex-start';
    if (position === 'bottom') return 'flex-end';
    return 'center';
  };

  return (
    <div style={{
      backgroundColor: '#0f0f12', // সম্পূর্ণ কুচকুচে কালো না হয়ে চোখের জন্য অত্যন্ত আরামদায়ক সফট ডার্ক গ্রে/চারকোল
      color: '#e2e8f0',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: getJustifyContent(),
      padding: '40px 28px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {reminder && (
        <div 
          className={isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}
          style={{
            maxWidth: '520px',
            width: '100%',
            borderLeft: '2px solid rgba(226, 232, 240, 0.25)', // মার্জিত ও হালকা সফট সাইড বর্ডার
            paddingLeft: '18px',
            margin: '0 auto',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
        >
          <p style={{
            fontSize: '16px',
            lineHeight: '1.7',
            color: '#f1f5f9', // একদম কড়া সাদা নয়, চোখের শান্তি রক্ষার্থে সফট প্রিমিয়াম অফ-হোয়াইট
            margin: '0 0 10px 0',
            fontWeight: 500, // সামান্য বোল্ড ও জোরালো ফন্ট বিন্যাস
            letterSpacing: '0.2px'
          }}>
            "{reminder.content}"
          </p>
          {reminder.reference && (
            <span style={{
              fontSize: '12px',
              color: '#94a3b8', // চোখের আরামদায়ক মিউটেড গ্রে কালার (কোনো ফিক্সড হাইফেন ছাড়াই)
              letterSpacing: '0.5px',
              fontWeight: 400
            }}>
              {reminder.reference}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderLoading;
