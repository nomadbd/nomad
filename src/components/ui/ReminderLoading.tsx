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
      backgroundColor: '#0a0a0c', // চোখের প্রশান্তির জন্য আরও ডিপ এবং প্রিমিয়াম ডার্ক টোন
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
      padding: '40px 24px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {reminder && (
        <div 
          className={isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}
          style={{
            maxWidth: '600px',
            width: '100%',
            position: 'relative',
            padding: '40px 44px',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(255, 255, 255, 0.015)', // সফট গ্লাস মরফিজম কার্ড ফিল
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}
        >
          {/* ওপরের বামে একটি প্রিমিয়াম ওয়াটারমার্ক কোটেশন */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '28px',
            fontSize: '52px',
            color: 'rgba(255, 255, 255, 0.05)',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            “
          </div>

          <p style={{
            fontSize: '18px',
            lineHeight: '1.85',
            color: '#f8fafc', // অত্যন্ত পরিষ্কার ও আরামদায়ক অফ-হোয়াইট ফন্ট
            margin: '12px 0 24px 0',
            fontWeight: 400,
            letterSpacing: '0.4px',
            wordSpacing: '1px'
          }}>
            {cleanContent}
          </p>

          {reminder.reference && (
            <div style={{
              display: 'inline-block',
              marginTop: '4px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '13px',
              color: '#94a3b8',
              letterSpacing: '0.8px',
              fontWeight: 500
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
