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

function NotificationSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          style={{
            background: '#121212',
            border: '1px solid #27272A',
            borderRadius: '12px',
            padding: '16px',
            opacity: 0.35,
            animation: 'pulse 1.5s infinite ease-in-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ height: '14px', width: '30%', background: '#333', borderRadius: '4px' }}></div>
            <div style={{ height: '14px', width: '14px', background: '#333', borderRadius: '4px' }}></div>
          </div>
          <div style={{ height: '18px', width: '65%', background: '#333', marginBottom: '12px', borderRadius: '4px' }}></div>
          <div style={{ height: '13px', width: '90%', background: '#333', marginBottom: '8px', borderRadius: '4px' }}></div>
          <div style={{ height: '13px', width: '55%', background: '#333', borderRadius: '4px' }}></div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsView({ userId, onBack }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // ডাটা ফেস করার ফাংশন (Silent параметр দিয়ে স্কেলিটন লোডার রোধ করা হয়েছে)
  const fetchNotifications = async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      // Specific User এবং GLOBAL উভয় নোটিফিকেশনই নিয়ে আসবে
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},target_audience.eq.ALL`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data as NotificationItem[]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications(false);

    // Global ও Individual উভয় পরিবর্তন লাইভ রিয়েলটাইমে ক্যাচ করবে
    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as NotificationItem;
            setNotifications(prev =>
              prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item))
            );
          } else {
            fetchNotifications(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string, currentStatus: boolean) => {
    if (currentStatus) return;

    // UI-তে তাৎক্ষণিক SEEN দেখাবে
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
    );

    // ডাটাবেজে is_read = true আপডেট পাঠাবে
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to update DB is_read status:', error.message);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(item => item.id !== id));
    if (expandedId === id) setExpandedId(null);

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
  };

  const handleCardClick = (item: NotificationItem) => {
    markAsRead(item.id, item.is_read);
    setExpandedId(prev => (prev === item.id ? null : item.id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#000000', 
      color: '#FFF',
      overflow: 'hidden'
    }}>
      {/* ১. ফিক্সড হেডার */}
      <div style={{ 
        flexShrink: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px 14px',
        borderBottom: '1px solid #18181B',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        zIndex: 50
      }}>
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

        <button
          onClick={() => setFilter(prev => prev === 'unread' ? 'all' : 'unread')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            border: filter === 'unread' ? '1px solid #FFFFFF' : '1px solid #27272A',
            background: filter === 'unread' ? 'rgba(255, 255, 255, 0.12)' : '#121212',
            color: filter === 'unread' ? '#FFFFFF' : '#71717A',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      </div>

      {/* ২. স্বাধীনভাবে স্ক্রলযোগ্য নোটিফিকেশন বডি */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px 12px 32px 12px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {unreadCount > 0 && filter === 'all' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', paddingRight: '4px' }}>
            <button
              onClick={markAllAsRead}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717A',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckIcon width={12} height={12} stroke="#71717A" />
              <span>Mark all read</span>
            </button>
          </div>
        )}

        {/* ৩. লোডিং অবস্থায় স্কেলিটন কম্পোনেন্ট */}
        {loading ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotifications.map((item) => {
              const badge = getTypeBadge(item.type);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  style={{
                    background: item.is_read ? '#09090B' : '#121212',
                    border: '1px solid',
                    borderColor: item.is_read ? '#27272A' : 'rgba(255, 255, 255, 0.35)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.25s ease, background-color 0.25s ease'
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
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
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      <CloseIcon width={14} height={14} stroke="#71717A" />
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#FFFFFF', lineHeight: '1.3' }}>
                    {item.title}
                  </h3>

                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: item.is_read ? '#8E8E93' : '#A1A1AA', 
                    lineHeight: '1.5',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: isExpanded ? 'pre-line' : 'normal',
                    display: isExpanded ? '-webkit-box' : 'block',
                    WebkitLineClamp: isExpanded ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: isExpanded ? '1000px' : '58px',
                    transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s ease'
                  }}>
                    {item.message}
                  </p>

                  {item.link && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          backgroundColor: '#18181B',
                          border: '1px solid #27272A',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Explore
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
