import React, { useState, useEffect } from 'react';
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

  const mutedText = '#888888';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setLogs(data as SentNotification[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setLogs(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSilentUpdate = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          title: editingItem.title,
          message: editingItem.message,
          type: editingItem.type,
          link: editingItem.link
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setLogs(prev =>
        prev.map(item => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
    } catch (err: any) {
      alert('Update failed: ' + err.message);
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || log.type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px' }}>
      
      {/* Header with Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1A1A1A', paddingBottom: '12px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' }}
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
            background: '#111',
            border: '1px solid #222',
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
        {['ALL', 'INFO', 'PROMO', 'ALERT', 'SYSTEM'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '5px 12px',
              fontSize: '10px',
              fontWeight: '700',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === cat ? '#FFF' : '#161616',
              color: selectedCategory === cat ? '#000' : mutedText,
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
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
              {/* Item Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: getCategoryColor(item.type) }}>
                    {item.type}
                  </span>
                  <span style={{ fontSize: '9px', color: mutedText }}>• {getRelativeTime(item.created_at)}</span>
                  <span style={{ fontSize: '9px', color: '#555' }}>({new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                </div>

                {/* Seen / Unseen Status Badge */}
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: item.is_read ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: item.is_read ? '#4ADE80' : mutedText,
                  border: `1px solid ${item.is_read ? 'rgba(34, 197, 94, 0.3)' : '#222'}`
                }}>
                  {item.is_read ? '✓ SEEN' : 'UNSEEN'}
                </span>
              </div>

              {/* Title & Message Body */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: mutedText, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{item.message}</div>
                {item.link && <div style={{ fontSize: '10px', color: '#3B82F6', marginTop: '4px' }}>{item.link}</div>}
              </div>

              {/* Footer Info & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #141414' }}>
                <span style={{ fontSize: '9px', color: '#666' }}>
                  TARGET: {item.target_audience === 'ALL' ? 'GLOBAL' : `USER (${item.user_id.slice(0, 8)}...)`}
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setEditingItem(item)}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    SILENT EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SILENT EDIT MODAL */}
      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#FFF', marginBottom: '4px' }}>SILENT EDIT NOTIFICATION</div>
            <div style={{ fontSize: '10px', color: mutedText, marginBottom: '16px' }}>Updates database live without alerting the user again.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="Title"
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', padding: '8px 0', color: '#FFF', fontSize: '12px', outline: 'none' }}
              />
              <textarea
                value={editingItem.message}
                onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                placeholder="Message"
                rows={3}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', padding: '8px 0', color: '#FFF', fontSize: '12px', outline: 'none', resize: 'vertical' }}
              />
              <input
                type="url"
                value={editingItem.link || ''}
                onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                placeholder="Action Link"
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', padding: '8px 0', color: '#FFF', fontSize: '12px', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={handleSilentUpdate} style={{ flex: 1, padding: '10px', background: '#FFF', color: '#000', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' }}>SAVE LIVE</button>
                <button onClick={() => setEditingItem(null)} style={{ padding: '10px 16px', background: 'transparent', color: mutedText, border: '1px solid #333', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' }}>CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
 