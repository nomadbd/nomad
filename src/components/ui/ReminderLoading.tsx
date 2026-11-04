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

  // টেক্সটের শুরু বা শেষে যদি কোনো কোটেশন বা স্পেস থাকে, তা স্বয়ংক্রিয়ভাবে ক্লিন করে নেওয়া
  const cleanContent = reminder?.content
    ? reminder.content.replace(/^["“”'‘’\s]+|["“”'‘’\s]+$/g, '')
    : '';

  return (
    <div style={{
      backgroundColor: '#0f0f12', // চোখের জন্য আরামদায়ক সফট চারকোল ব্যাকগ্রাউন্ড
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
            maxWidth: '560px',
            width: '100%',
            position: 'relative',
            padding: '24px 36px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}
        >
          {/* ওপরের বড় ওপেনিং কোটেশন মার্ক */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '10px',
            fontSize: '60px',
            color: 'rgba(226, 232, 240, 0.12)',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            “
          </div>

          <p style={{
            fontSize: '17px',
            lineHeight: '1.75',
            color: '#f1f5f9', // প্রিমিয়াম সফট অফ-হোয়াইট কালার
            margin: '0 0 16px 0',
            fontWeight: 500,
            letterSpacing: '0.3px'
          }}>
            {cleanContent}
          </p>

          {/* নিচের বড় ক্লোজিং কোটেশন মার্ক */}
          <div style={{
            position: 'absolute',
            bottom: '-35px',
            right: '10px',
            fontSize: '60px',
            color: 'rgba(226, 232, 240, 0.12)',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            ”
          </div>

          {reminder.reference && (
            <div style={{
              marginTop: '14px',
              fontSize: '12px',
              color: '#94a3b8', // চোখের আরামদায়ক মিউটেড গ্রে
              letterSpacing: '0.5px',
              fontWeight: 400
            }}>
              {reminder.reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderLoading;
