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

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function AdminNotifications() {
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CategoryType>(null); // Default null
  const [link, setLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sentHistory, setSentHistory] = useState<SentNotification[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    fetchSentHistory();
  }, []);

  useEffect(() => {
    if (targetType === 'specific' && userSearch.trim().length > 1) {
      searchUsers(userSearch);
    } else {
      setUserOptions([]);
    }
  }, [userSearch, targetType]);

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name')
      .or(`email.ilike.%${query}%,name.ilike.%${query}%,id.eq.${query}`)
      .limit(5);

    if (data) setUserOptions(data);
  };

  const fetchSentHistory = async () => {
    setFetchingHistory(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setSentHistory(data as SentNotification[]);
    setFetchingHistory(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type) {
      setStatusMsg({ type: 'error', text: 'Select a notification category' });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'Title & Message are required' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'Select or enter a recipient user' });
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
        const { data: users, error: userError } = await supabase.from('profiles').select('id');
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

          const { error: bulkError } = await supabase.from('notifications').insert(notificationsToInsert);
          if (bulkError) throw bulkError;
        }
      }

      setStatusMsg({ type: 'success', text: 'Notification dispatched successfully' });
      setTitle('');
      setMessage('');
      setLink('');
      setType(null); // Reset to null after sending
      setSpecificUserId('');
      setUserSearch('');
      fetchSentHistory();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Dispatch failed' });
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

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'PROMO': return '#EAB308';
      case 'ALERT': return '#EF4444';
      case 'SYSTEM': return '#A855F7';
      case 'INFO': return '#3B82F6';
      default: return '#666666';
    }
  };

  // Modern Underline Input Styling
  const underlineInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #262626',
    padding: '12px 0',
    color: '#FFFFFF',
    fontSize: '13px',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    borderRadius: 0,
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 4px' }}>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div style={{
          padding: '10px 0',
          marginBottom: '20px',
          fontSize: '12px',
          fontWeight: '500',
          borderBottom: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Target Tab Navigation */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #1A1A1A', paddingBottom: '10px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setTargetType('all')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: targetType === 'all' ? '2px solid #FFF' : '2px solid transparent',
            color: targetType === 'all' ? '#FFF' : '#555',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            paddingBottom: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ALL USERS
        </button>
        <button
          type="button"
          onClick={() => setTargetType('specific')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: targetType === 'specific' ? '2px solid #FFF' : '2px solid transparent',
            color: targetType === 'specific' ? '#FFF' : '#555',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            paddingBottom: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          SINGLE USER
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>

        {/* User Search Input (Only when single user is active) */}
        {targetType === 'specific' && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search target user by Name, Email, or User ID..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setSpecificUserId(e.target.value);
              }}
              style={underlineInputStyle}
            />
            {userOptions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#0D0D0D',
                border: '1px solid #222',
                borderRadius: '4px',
                zIndex: 20,
                marginTop: '4px'
              }}>
                {userOptions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSpecificUserId(u.id);
                      setUserSearch(u.email || u.name || u.id);
                      setUserOptions([]);
                    }}
                    style={{ padding: '10px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #161616' }}
                  >
                    <div style={{ color: '#FFF', fontWeight: 'bold' }}>{u.name || 'User'}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{u.email} ({u.id.slice(0, 8)}...)</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Pills (Unselected by default) */}
        <div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            {(['INFO', 'PROMO', 'ALERT', 'SYSTEM'] as const).map((cat) => {
              const active = type === cat;
              const catColor = getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setType(cat)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    background: active ? catColor : 'transparent',
                    color: active ? '#000' : '#666',
                    border: `1px solid ${active ? catColor : '#222'}`,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          placeholder="Notification headline title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={underlineInputStyle}
        />

        {/* Message Input (Scales easily for short & long texts) */}
        <textarea
          rows={3}
          placeholder="Write notification message details here (supports short or multi-line detailed notes)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            ...underlineInputStyle,
            resize: 'vertical',
            minHeight: '80px',
            lineHeight: '1.6'
          }}
        />

        {/* Action URL Input */}
        <input
          type="url"
          placeholder="Action Link URL (optional, e.g. https://...)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={underlineInputStyle}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '14px',
            background: '#FFFFFF',
            color: '#000000',
            fontWeight: '800',
            fontSize: '11px',
            letterSpacing: '2px',
            border: 'none',
            borderRadius: '2px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'SENDING...' : 'DISPATCH NOTIFICATION'}
        </button>
      </form>

      {/* Minimal Live Preview */}
      {(title || message || type) && (
        <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid #141414' }}>
          <div style={{ fontSize: '9px', color: '#555', letterSpacing: '1.5px', fontWeight: 'bold', marginBottom: '12px' }}>
            PREVIEW
          </div>
          <div style={{ padding: '16px 0', borderTop: '1px dashed #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {type ? (
                <span style={{ fontSize: '9px', fontWeight: '800', color: getCategoryColor(type), letterSpacing: '1px' }}>
                  {type}
                </span>
              ) : (
                <span style={{ fontSize: '9px', color: '#444' }}>NO CATEGORY</span>
              )}
              <span style={{ fontSize: '9px', color: '#444' }}>• NOW</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '6px' }}>
              {title || 'Headline Title'}
            </div>
            <div style={{ fontSize: '12px', color: '#AAA', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {message || 'Notification content preview will render here...'}
            </div>
            {link && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#3B82F6' }}>
                {link} ↗
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Log List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1.5px', color: '#555' }}>DISPATCH LOGS</span>
          <button
            onClick={fetchSentHistory}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer' }}
          >
            REFRESH
          </button>
        </div>

        {fetchingHistory ? (
          <div style={{ color: '#444', fontSize: '11px', padding: '10px 0' }}>Loading logs...</div>
        ) : sentHistory.length === 0 ? (
          <div style={{ color: '#444', fontSize: '11px', padding: '10px 0' }}>No dispatch history available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sentHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #141414',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: getCategoryColor(item.type) }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#EEE' }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.message}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '9px', color: '#444' }}>
                    {item.target_audience === 'ALL' ? 'GLOBAL' : item.user_id.slice(0, 6)}
                  </span>
                  <button
                    onClick={() => handleDeleteSent(item.id)}
                    style={{ background: 'none', border: 'none', color: '#444', fontSize: '10px', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
