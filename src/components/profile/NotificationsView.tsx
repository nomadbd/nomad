import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BackIcon, NotificationIcon, CloseIcon, CheckIcon } from '../icons';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT';
  link?: string | null;
  target_audience: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsViewProps {
  userId: string;
  onBack: () => void;
}

export default function NotificationsView({ userId, onBack }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // স্মার্ট টাইম ফরম্যাটিং
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // নিরপেক্ষ টাইপ ব্যাজ
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PROMO':
        return { label: 'OFFER', bg: '#1C102B', color: '#C084FC', border: '#3B0764' };
      case 'ALERT':
        return { label: 'ALERT', bg: '#2A0808', color: '#F87171', border: '#450A0A' };
      case 'SYSTEM':
        return { label: 'SYSTEM', bg: '#0F172A', color: '#38BDF8', border: '#1E293B' };
      default:
        return { label: 'INFO', bg: '#18181B', color: '#A1A1AA', border: '#27272A' };
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data as NotificationItem[]);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string, currentStatus: boolean) => {
    if (currentStatus) return;

    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
    );

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(item => item.id !== id));

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 12px', color: '#FFF' }}>
      
      {/* ১. হেডার ও ডানের একশন বাটন (ইনলাইন ফিল্টার সহ) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        
        {/* বামপাশে: ব্যাক বাটন ও সাধারণ টাইটেল */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              background: '#121212',
              border: '1px solid #27272A',
              color: '#FFF',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            title="Back"
          >
            <BackIcon width={18} height={18} stroke="#FFFFFF" />
          </button>

          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.2px', color: '#FFFFFF' }}>
            Notifications
          </h2>
        </div>

        {/* ডানপাশে: Mark Read এবং Unread ফিল্টার */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#A1A1AA',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px'
              }}
            >
              <CheckIcon width={13} height={13} stroke="#A1A1AA" />
              <span>Read all</span>
            </button>
          )}

          <button
            onClick={() => setFilter(prev => prev === 'unread' ? 'all' : 'unread')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              border: filter === 'unread' ? '1px solid #FFFFFF' : '1px solid #27272A',
              background: filter === 'unread' ? 'rgba(255, 255, 255, 0.12)' : '#121212',
              color: filter === 'unread' ? '#FFFFFF' : '#71717A',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        </div>
      </div>

      {/* ২. নোটিফিকেশন লিস্ট / নিরিবিলি খালি অবস্থা */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#71717A', fontSize: '13px' }}>
          Loading updates...
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* ফ্লোটিং নিউট্রাল Empty State */
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px', 
          textAlign: 'center' 
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#121212',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <NotificationIcon width={22} height={22} stroke="#52525B" />
          </div>
          
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#FFFFFF', fontWeight: '500', letterSpacing: '0.2px' }}>
            No Notifications
          </h3>
          
          <p style={{ margin: 0, fontSize: '12px', color: '#71717A', maxWidth: '270px', lineHeight: '1.5' }}>
            Important announcements and updates will appear here when available.
          </p>
        </div>
      ) : (
        /* নোটিফিকেশন কার্ডসমূহ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id, item.is_read)}
                style={{
                  background: item.is_read ? '#09090B' : '#121212',
                  border: '1px solid',
                  borderColor: item.is_read ? '#18181B' : '#27272A',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: item.is_read ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {!item.is_read && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '18px',
                      left: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6'
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '3px 7px',
                        borderRadius: '4px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        letterSpacing: '0.6px'
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#71717A' }}>
                      {getRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => deleteNotification(e, item.id)}
                    title="Delete"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52525B',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CloseIcon width={14} height={14} stroke="#71717A" />
                  </button>
                </div>

                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                  {item.title}
                </h3>
                
                <p style={{ margin: 0, fontSize: '13px', color: '#A1A1AA', lineHeight: '1.45' }}>
                  {item.message}
                </p>

                {item.link && (
                  <a
                    href={item.link}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#38BDF8',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    <span>View Details</span>
                    <span style={{ fontSize: '10px' }}>→</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
