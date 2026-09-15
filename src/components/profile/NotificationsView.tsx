import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface NotificationsViewProps {
  userId: string;
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

export default function NotificationsView({ userId, onBack }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ১. নোটিফিকেশন ফেচ করা
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // ২. নোটিফিকেশন রিড মার্ক করা
  const markAsRead = async (id: string, currentStatus: boolean) => {
    if (currentStatus) return; // আগেই রিড করা থাকলে কিছু করার দরকার নেই

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // ৩. সব নোটিফিকেশন একসাথে রিড মার্ক করা
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#09090B',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* টপ ব্যাক বার */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #18181B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        backgroundColor: '#09090B',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h2>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717A',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* নোটিফিকেশন লিস্ট */}
      <div style={{ padding: '16px 20px', flex: 1 }}>
        {loading ? (
          <p style={{ fontSize: '13px', color: '#71717A', textAlign: 'center', marginTop: '40px' }}>
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#71717A' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No notifications yet</p>
            <span style={{ fontSize: '12px' }}>Updates regarding your orders will appear here</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id, item.is_read)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: item.is_read ? '#0F0F0F' : '#141416',
                  borderRadius: '12px',
                  border: item.is_read ? '1px solid #18181B' : '1px solid #27272A',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s'
                }}
              >
                {!item.is_read && (
                  <span style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF'
                  }} />
                )}

                <h4 style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: item.is_read ? '#A1A1AA' : '#FFFFFF'
                }}>
                  {item.title}
                </h4>

                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '13px',
                  color: item.is_read ? '#71717A' : '#D4D4D8',
                  lineHeight: '1.4'
                }}>
                  {item.message}
                </p>

                <span style={{ fontSize: '10px', color: '#52525B' }}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
