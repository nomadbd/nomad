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

    // ৯.৪ সেকেন্ডের মাথায় Fade Out শুরু হবে
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
      backgroundColor: '#030303',
      color: '#ffffff',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: getJustifyContent(),
      padding: '40px 24px',
      position: 'relative',
      fontFamily: 'monospace, sans-serif'
    }}>
      {/* কুরআনের আয়াত / নীতিবাক্য */}
      {reminder && (
        <div 
          className={isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}
          style={{
            maxWidth: '500px',
            borderLeft: '2px solid #ffffff',
            paddingLeft: '16px',
            margin: '0 12px',
            textAlign: 'left'
          }}
        >
          <p style={{
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#e5e5e5',
            margin: '0 0 8px 0',
            fontWeight: 400
          }}>
            "{reminder.content}"
          </p>
          {reminder.reference && (
            <span style={{
              fontSize: '11px',
              color: '#888888',
              letterSpacing: '1px'
            }}>
              — {reminder.reference}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderLoading;
