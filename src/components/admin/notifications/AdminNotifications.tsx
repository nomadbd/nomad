import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { HistoryIcon, SearchIcon, EditIcon, BackIcon } from '@/components/icons';

interface SentNotification {
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

interface NotificationLogsProps {
  onBack: () => void;
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function NotificationLogs({ onBack }: NotificationLogsProps) {
  const [logs, setLogs] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<SentNotification | null>(null);
  const [updating, setUpdating] = useState(false);

  const mutedText = '#888888';

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('admin_notification_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as SentNotification;
            setLogs((prev) => [newNotif, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as SentNotification;
            setLogs((prev) =>
              prev.map((item) => (item.id === updatedNotif.id ? updatedNotif : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setLogs((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setLogs(data as SentNotification[]);
    } catch (err: any) {
      console.error('Error fetching notification logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSilentUpdate = async () => {
    if (!editingItem) return;
    if (!editingItem.title.trim() || !editingItem.message.trim()) {
      alert('Title and Message are required.');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          title: editingItem.title.trim(),
          message: editingItem.message.trim(),
          type: editingItem.type,
          link: editingItem.link ? editingItem.link.trim() : null
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setLogs((prev) =>
        prev.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
    } catch (err: any) {
      alert('Silent update failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'PROMO': return '#EAB308';
      case 'ALERT': return '#EF4444';
      case 'SYSTEM': return '#A855F7';
      case 'INFO': return '#3B82F6';
      default: return mutedText;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const titleMatch = (log.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const msgMatch = (log.message || '').toLowerCase().includes(searchQuery.toLowerCase());
      const userMatch = (log.user_id || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || msgMatch || userMatch;
      const matchesCategory = selectedCategory === 'ALL' || log.type === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchQuery, selectedCategory]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px' }}>

      {/* Header with Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1A1A1A', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', padding: 0 }}
        >
          {BackIcon ? <BackIcon style={{ width: 16, height: 16 }} /> : '◄'} BACK TO DISPATCHER
        </button>
        <span style={{ fontSize: '10px', color: mutedText, fontWeight: '700', letterSpacing: '1px' }}>LOGS & ANALYTICS</span>
      </div>

      {/* Internal Log Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search logs by title, message or user ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '10px 12px',
            color: '#FFF',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['ALL', 'INFO', 'PROMO', 'ALERT', 'SYSTEM'].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '20px',
                border: `1px solid ${active ? '#FFFFFF' : '#222222'}`,
                background: active ? '#FFFFFF' : '#141414',
                color: active ? '#000000' : mutedText,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Logs List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: mutedText, fontSize: '12px', padding: '40px 0' }}>Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', color: mutedText, fontSize: '12px', padding: '40px 0' }}>No logs matched your criteria</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLogs.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#0D0D0D',
                border: '1px solid #1A1A1A',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: getCategoryColor(item.type), letterSpacing: '0.5px' }}>
                    {item.type}
                  </span>
                  <span style={{ fontSize: '9px', color: mutedText }}>• {getRelativeTime(item.created_at)}</span>
                  <span style={{ fontSize: '9px', color: '#555555' }}>({new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                </div>

                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: item.is_read ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: item.is_read ? '#4ADE80' : mutedText,
                  border: `1px solid ${item.is_read ? 'rgba(34, 197, 94, 0.3)' : '#222222'}`
                }}>
                  {item.is_read ? '✓ SEEN' : 'UNSEEN'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: mutedText, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{item.message}</div>
                {item.link && <div style={{ fontSize: '10px', color: '#3B82F6', marginTop: '4px', wordBreak: 'break-all' }}>{item.link}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #141414' }}>
                <span style={{ fontSize: '9px', color: '#666666' }}>
                  TARGET: {item.target_audience === 'ALL' ? 'GLOBAL' : `USER (${item.user_id ? item.user_id.slice(0, 8) : 'SPECIFIC'}...)`}
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...item })}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '10px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    SILENT EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SILENT EDIT BOTTOM SHEET */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          {/* Background Overlay Click to Close */}
          <div 
            onClick={() => setEditingItem(null)} 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} 
          />

          {/* Bottom Sheet Container */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '540px',
            background: '#121212',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            border: '1px solid #262626',
            borderBottom: 'none',
            padding: '16px 20px 24px 20px',
            boxSizing: 'border-box',
            maxHeight: '85vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 -10px 25px rgba(0,0,0,0.5)'
          }}>
            {/* Sheet Handle Indicator */}
            <div style={{
              width: '36px',
              height: '4px',
              background: '#333333',
              borderRadius: '2px',
              alignSelf: 'center',
              marginBottom: '4px'
            }} />

            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#FFF', letterSpacing: '0.5px' }}>
                SILENT EDIT NOTIFICATION
              </div>
              <div style={{ fontSize: '10px', color: mutedText, marginTop: '2px' }}>
                Updates database live without triggering a new push notification alert.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  TITLE
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Title"
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid #262626',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '12px',
                    outline: 'none',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  MESSAGE
                </label>
                <textarea
                  value={editingItem.message}
                  onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                  placeholder="Message"
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid #262626',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  ACTION LINK (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={editingItem.link || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                  placeholder="Action Link"
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid #262626',
                    padding: '10px 12px',
                    color: '#FFF',
                    fontSize: '12px',
                    outline: 'none',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Buttons Area */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleSilentUpdate}
                  disabled={updating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '11px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    borderRadius: '6px',
                    opacity: updating ? 0.7 : 1
                  }}
                >
                  {updating ? 'SAVING...' : 'SAVE LIVE'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={updating}
                  style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    color: mutedText,
                    border: '1px solid #333333',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    borderRadius: '6px'
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
