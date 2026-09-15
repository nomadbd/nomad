import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

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
        return { label: 'ORDER', bg: '#1E293B', color: '#38BDF8', border: '#0284C7' };
      case 'PROMO':
        return { label: 'OFFER', bg: '#2E1065', color: '#C084FC', border: '#7E22CE' };
      case 'ALERT':
        return { label: 'ALERT', bg: '#450A0A', color: '#F87171', border: '#DC2626' };
      default:
        return { label: 'INFO', bg: '#18181B', color: '#A1A1AA', border: '#27272A' };
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Supabase Realtime Subscription (নতুন নোটিফিকেশন সাথে সাথে পাওয়ার জন্য)
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
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px 16px', color: '#FFF' }}>
      
      {/* হেডার ও ব্যাক বাটন */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: '#121212',
              border: '1px solid #27272A',
              color: '#FFF',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.3px' }}>
              Notifications
            </h2>
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              {unreadCount > 0 ? `${unreadCount} unread message(s)` : 'All caught up'}
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ফিল্টার ট্যাব */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #18181B', paddingBottom: '12px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid',
            borderColor: filter === 'all' ? '#FFF' : '#27272A',
            background: filter === 'all' ? '#FFF' : '#121212',
            color: filter === 'all' ? '#000' : '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid',
            borderColor: filter === 'unread' ? '#FFF' : '#27272A',
            background: filter === 'unread' ? '#FFF' : '#121212',
            color: filter === 'unread' ? '#000' : '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* নোটিফিকেশন লিস্ট */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717A', fontSize: '14px' }}>
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#09090B', borderRadius: '12px', border: '1px solid #18181B' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔔</div>
          <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#FFF', fontWeight: '500' }}>No notifications found</p>
          <span style={{ fontSize: '12px', color: '#71717A' }}>You're all up to date. We'll notify you when something comes up!</span>
        </div>
      ) : (
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
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: item.is_read ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* আনরিড নির্দেশক ডট */}
                {!item.is_read && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '8px',
                      height: '8px',
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
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        letterSpacing: '0.5px'
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
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '2px 6px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#FFF' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#A1A1AA', lineHeight: '1.4' }}>
                  {item.message}
                </p>

                {item.link && (
                  <a
                    href={item.link}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#38BDF8',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    View Details →
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
