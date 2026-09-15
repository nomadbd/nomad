import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BackIcon, NotificationIcon, CloseIcon, CheckIcon } from '../icons';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ORDER' | 'PROMO' | 'SYSTEM' | 'ALERT';
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

  // টাইপ অনুযায়ী ব্যাজ ও কালার
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ORDER':
        return { label: 'ORDER', bg: '#0F172A', color: '#38BDF8', border: '#1E293B' };
      case 'PROMO':
        return { label: 'OFFER', bg: '#1C102B', color: '#C084FC', border: '#3B0764' };
      case 'ALERT':
        return { label: 'ALERT', bg: '#2A0808', color: '#F87171', border: '#450A0A' };
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

  // একক নোটিফিকেশন Read চিহ্নিত করা
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

  // সব নোটিফিকেশন একসাথে Read চিহ্নিত করা
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

  // নোটিফিকেশন মুছে ফেলা
  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(item => item.id !== id));

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
  };

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 12px', color: '#FFF' }}>
      
      {/* ১. হেডার ও ব্যাক বাটন */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.2px', color: '#FFFFFF' }}>
              Notifications
            </h2>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: '400' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #27272A',
              borderRadius: '20px',
              padding: '6px 12px',
              color: '#A1A1AA',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <CheckIcon width={13} height={13} stroke="#A1A1AA" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* ২. ফিল্টার ট্যাব */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #18181B', paddingBottom: '14px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '7px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: filter === 'all' ? '1px solid #FFFFFF' : '1px solid #27272A',
            background: filter === 'all' ? '#FFFFFF' : '#121212',
            color: filter === 'all' ? '#000000' : '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          All ({notifications.length})
        </button>
        
        <button
          onClick={() => setFilter('unread')}
          style={{
            padding: '7px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: filter === 'unread' ? '1px solid #FFFFFF' : '1px solid #27272A',
            background: filter === 'unread' ? '#FFFFFF' : '#121212',
            color: filter === 'unread' ? '#000000' : '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ৩. নোটিফিকেশন কন্টেন্ট / লিস্ট */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#71717A', fontSize: '13px' }}>
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* প্রিমিয়াম Empty State */
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px', 
          background: '#09090B', 
          borderRadius: '16px', 
          border: '1px solid #18181B',
          textAlign: 'center' 
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#121212',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <NotificationIcon width={24} height={24} stroke="#A1A1AA" />
          </div>
          
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>
            No notifications found
          </h3>
          
          <p style={{ margin: 0, fontSize: '13px', color: '#71717A', maxWidth: '280px', lineHeight: '1.4' }}>
            You're all up to date. We'll notify you when something comes up!
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
                {/* Unread নীল ডট */}
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

                  {/* ডিলিট বাটন (CloseIcon ব্যবহার করা হয়েছে) */}
                  <button
                    onClick={(e) => deleteNotification(e, item.id)}
                    title="Delete notification"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52525B',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    <CloseIcon width={14} height={14} stroke="#71717A" />
                  </button>
                </div>

                <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '0.1px' }}>
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
