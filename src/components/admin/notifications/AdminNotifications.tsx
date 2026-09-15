import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

interface SentNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT';
  link?: string | null;
  target_audience: string;
  created_at: string;
}

export default function AdminNotifications() {
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT'>('INFO');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sentHistory, setSentHistory] = useState<SentNotification[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    fetchSentHistory();
  }, []);

  const fetchSentHistory = async () => {
    setFetchingHistory(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setSentHistory(data as SentNotification[]);
    }
    setFetchingHistory(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'REQUIRED FIELDS MISSING: Title & Message' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'TARGET ERROR: Specific User ID is required' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      if (targetType === 'specific') {
        const { error } = await supabase.from('notifications').insert([
          {
            user_id: specificUserId.trim(),
            title: title.trim(),
            message: message.trim(),
            type,
            link: link.trim() || null,
            target_audience: 'SPECIFIC',
            is_read: false
          }
        ]);

        if (error) throw error;
      } else {
        const { data: users, error: userError } = await supabase
          .from('profiles')
          .select('id');

        if (userError) throw userError;

        if (users && users.length > 0) {
          const notificationsToInsert = users.map((u: { id: string }) => ({
            user_id: u.id,
            title: title.trim(),
            message: message.trim(),
            type,
            link: link.trim() || null,
            target_audience: 'ALL',
            is_read: false
          }));

          const { error: bulkError } = await supabase
            .from('notifications')
            .insert(notificationsToInsert);

          if (bulkError) throw bulkError;
        }
      }

      setStatusMsg({ type: 'success', text: 'DISPATCH SUCCESSFUL: Notification Broadcasted' });
      setTitle('');
      setMessage('');
      setLink('');
      setSpecificUserId('');
      fetchSentHistory();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'DISPATCH FAILED' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSent = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setSentHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const getTypeBadgeStyle = (badgeType: string) => {
    switch (badgeType) {
      case 'PROMO':
        return { color: '#EAB308', borderColor: '#854D0E', background: 'rgba(234, 179, 8, 0.08)' };
      case 'ALERT':
        return { color: '#EF4444', borderColor: '#991B1B', background: 'rgba(239, 68, 68, 0.08)' };
      case 'SYSTEM':
        return { color: '#A855F7', borderColor: '#6B21A8', background: 'rgba(168, 85, 247, 0.08)' };
      default:
        return { color: '#3B82F6', borderColor: '#1E40AF', background: 'rgba(59, 130, 246, 0.08)' };
    }
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '850px', margin: '0 auto', color: '#FFF', fontFamily: 'monospace' }}>

      {/* Title Block */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #1A1A1A', paddingBottom: '16px' }}>
        <span style={{ fontSize: '10px', color: '#666', letterSpacing: '2px', fontWeight: 'bold' }}>SYSTEM // DISPATCH</span>
        <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '4px 0 6px 0', letterSpacing: '2px' }}>
          NOTIFICATION MANAGER
        </h1>
        <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '0.5px' }}>
          Broadcast global alerts or send private updates directly to specific user accounts.
        </p>
      </div>

      {/* Status Feedback */}
      {statusMsg && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '2px',
          marginBottom: '20px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '1px',
          backgroundColor: statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          border: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Panel Form */}
      <div style={{
        background: '#070707',
        border: '1px solid #1C1C1C',
        borderRadius: '2px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Target Audience */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>
              TARGET AUDIENCE
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: targetType === 'all' ? '#FFF' : '#666' }}>
                <input
                  type="radio"
                  name="audience"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                  style={{ accentColor: '#FFF' }}
                />
                BROADCAST ALL USERS
              </label>
              <label style={{ fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: targetType === 'specific' ? '#FFF' : '#666' }}>
                <input
                  type="radio"
                  name="audience"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                  style={{ accentColor: '#FFF' }}
                />
                SPECIFIC USER ID
              </label>
            </div>
          </div>

          {/* User ID Input */}
          {targetType === 'specific' && (
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>TARGET USER UUID</label>
              <input
                type="text"
                placeholder="e.g. 011074c5-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={specificUserId}
                onChange={(e) => setSpecificUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '2px',
                  background: '#000',
                  border: '1px solid #282828',
                  color: '#FFF',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Notification Type */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>NOTIFICATION CATEGORY</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '2px',
                background: '#000',
                border: '1px solid #282828',
                color: '#FFF',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="INFO">INFO (General Announcement)</option>
              <option value="PROMO">PROMO (Offer & Discounts)</option>
              <option value="ALERT">ALERT (Urgent Warning)</option>
              <option value="SYSTEM">SYSTEM (Platform Maintenance)</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>HEADLINE TITLE</label>
            <input
              type="text"
              placeholder="Enter announcement header..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '2px',
                background: '#000',
                border: '1px solid #282828',
                color: '#FFF',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>MESSAGE BODY</label>
            <textarea
              rows={3}
              placeholder="Write the detailed notification payload..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '2px',
                background: '#000',
                border: '1px solid #282828',
                color: '#FFF',
                fontSize: '12px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Optional Action Link */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>ACTION URL (OPTIONAL)</label>
            <input
              type="url"
              placeholder="https://nomadbd.com/offers"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '2px',
                background: '#000',
                border: '1px solid #282828',
                color: '#FFF',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Dispatch Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '12px 16px',
              borderRadius: '2px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontWeight: '900',
              fontSize: '11px',
              letterSpacing: '2px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'DISPATCHING...' : 'DISPATCH NOTIFICATION'}
          </button>
        </form>
      </div>

      {/* History Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#FFF' }}>
            RECENT DISPATCH LOGS
          </span>
          <button 
            onClick={fetchSentHistory}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}
          >
            REFRESH LOGS
          </button>
        </div>

        {fetchingHistory ? (
          <div style={{ color: '#555', fontSize: '11px', letterSpacing: '1px' }}>FETCHING HISTORY LOGS...</div>
        ) : sentHistory.length === 0 ? (
          <div style={{ color: '#555', fontSize: '11px', letterSpacing: '1px' }}>NO DISPATCH LOGS RECORDED</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sentHistory.map((item) => {
              const badgeStyle = getTypeBadgeStyle(item.type);
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#070707',
                    border: '1px solid #1A1A1A',
                    borderRadius: '2px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        letterSpacing: '1px',
                        border: `1px solid ${badgeStyle.borderColor}`,
                        color: badgeStyle.color,
                        background: badgeStyle.background
                      }}>
                        {item.type}
                      </span>
                      <span style={{ fontSize: '10px', color: '#666', letterSpacing: '0.5px' }}>
                        {item.target_audience === 'ALL' ? 'GLOBAL BROADCAST' : `USER: ${item.user_id.slice(0, 8)}...`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSent(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        fontSize: '10px',
                        cursor: 'pointer',
                        letterSpacing: '1px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
                    >
                      DELETE
                    </button>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#FFF', fontWeight: 'bold' }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                      {item.message}
                    </p>
                  </div>

                  {item.link && (
                    <div style={{ fontSize: '10px', color: '#444', borderTop: '1px dashed #1C1C1C', paddingTop: '6px', marginTop: '2px' }}>
                      LINK: <a href={item.link} target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'underline' }}>{item.link}</a>
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
