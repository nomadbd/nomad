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

  // টেক্সটের শুরু বা শেষের কোটেশন স্বয়ংক্রিয়ভাবে ক্লিন করার লজিক
  const cleanContent = reminder?.content
    ? reminder.content.replace(/^["“”'‘’\s]+|["“”'‘’\s]+$/g, '')
    : '';

  return (
    <div style={{
      backgroundColor: '#0c0c0e', // চোখের প্রশান্তির জন্য সফট ডার্ক ব্যাকগ্রাউন্ড
      color: '#f1f5f9',
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
      padding: '40px 32px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {reminder && (
        <div 
          className={isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}
          style={{
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            padding: '20px 0',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start', // পুরো ব্লকটি বাম দিক থেকে শুরু হবে
            margin: '0 auto'
          }}
        >
          {/* ওপরে বড় ধূসর ওপেনিং কোটেশন মার্ক */}
          <div style={{
            fontSize: '64px',
            color: '#64748b', // প্রিমিয়াম ধূসর কালার
            fontFamily: 'Georgia, serif',
            lineHeight: '0.5',
            marginBottom: '12px',
            userSelect: 'none',
            pointerEvents: 'none',
            alignSelf: 'flex-start'
          }}>
            “
          </div>

          <p style={{
            fontSize: '18px',
            lineHeight: '1.8',
            color: '#f8fafc', // সফট সাদা ফন্ট
            margin: '0 0 20px 0',
            fontWeight: 600, // বোল্ড ফন্ট বিন্যাস
            letterSpacing: '0.3px',
            textAlign: 'left', // টেক্সট এক লাইন থেকে শুরু হয়ে নিচে নামবে
            width: '100%'
          }}>
            {cleanContent}
          </p>

          {/* নিচে বড় ধূসর ক্লোজিং কোটেশন মার্ক */}
          <div style={{
            fontSize: '64px',
            color: '#64748b', // প্রিমিয়াম ধূসর কালার
            fontFamily: 'Georgia, serif',
            lineHeight: '0.5',
            marginTop: '4px',
            marginBottom: '20px',
            userSelect: 'none',
            pointerEvents: 'none',
            alignSelf: 'flex-end' // ডান কোণায় ক্লোজিং কোটেশন
          }}>
            ”
          </div>

          {reminder.reference && (
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              letterSpacing: '0.8px',
              fontWeight: 700, // পোস্টের চেয়ে ছোট কিন্তু বোল্ড রেফারেন্স
              textTransform: 'uppercase',
              textAlign: 'left', // বাম দিক বরাবর সোজা নিচে থাকবে
              width: '100%'
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
