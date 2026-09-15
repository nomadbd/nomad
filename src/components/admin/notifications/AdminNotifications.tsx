 import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { HistoryIcon } from '../../../components/icons';
import NotificationLogs from './NotificationLogs';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function AdminNotifications() {
  const [view, setView] = useState<'create' | 'logs'>('create');

  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CategoryType>(null);
  const [link, setLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutedText = '#888888';

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type) {
      setStatusMsg({ type: 'error', text: 'Select a category' });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'Title and message required' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'Recipient required' });
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
      setType(null);
      setSpecificUserId('');
      setUserSearch('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Dispatch failed' });
    } finally {
      setLoading(false);
    }
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

  const underlineInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #222222',
    padding: '10px 0',
    color: '#FFFFFF',
    fontSize: '13px',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    borderRadius: 0,
    transition: 'border-color 0.2s ease',
  };

  if (view === 'logs') {
    return <NotificationLogs onBack={() => setView('create')} />;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px' }}>

      <style>{`
        input::placeholder, textarea::placeholder {
          color: ${mutedText} !important;
          opacity: 1 !important;
        }
        textarea::-webkit-scrollbar {
          width: 4px;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #333333;
          border-radius: 2px;
        }
      `}</style>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: '#FFF' }}>DISPATCHER</span>

        <button
          type="button"
          onClick={() => setView('logs')}
          title="View Notification Logs"
          style={{
            background: '#141414',
            border: '1px solid #282828',
            color: '#FFF',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <HistoryIcon style={{ width: 14, height: 14, fill: '#FFF' }} />
          <span>LOGS</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div style={{
          padding: '10px 0',
          marginBottom: '16px',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          borderBottom: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Target Switcher */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #181818', paddingBottom: '10px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setTargetType('all')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: targetType === 'all' ? '2px solid #FFF' : '2px solid transparent',
            color: targetType === 'all' ? '#FFF' : mutedText,
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            paddingBottom: '8px',
            cursor: 'pointer'
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
            color: targetType === 'specific' ? '#FFF' : mutedText,
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            paddingBottom: '8px',
            cursor: 'pointer'
          }}
        >
          SINGLE USER
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* User Search */}
        {targetType === 'specific' && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search user by name, email, or ID..."
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
                top: '100%', left: 0, right: 0,
                background: '#0B0B0B',
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
                    style={{ padding: '10px 12px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #141414' }}
                  >
                    <div style={{ color: '#FFF', fontWeight: 'bold' }}>{u.name || 'User'}</div>
                    <div style={{ fontSize: '9px', color: mutedText, marginTop: '2px' }}>{u.email} ({u.id.slice(0, 8)}...)</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Pills */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '10px' }}>
            CATEGORY
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(['INFO', 'PROMO', 'ALERT', 'SYSTEM'] as const).map((cat) => {
              const active = type === cat;
              const catColor = getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setType(cat)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    background: 'transparent',
                    color: active ? catColor : mutedText,
                    border: `1px solid ${active ? catColor : '#2A2A2A'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'center'
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
          placeholder="Notification title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={underlineInputStyle}
        />

        {/* Message Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px' }}>
              MESSAGE
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: message.length > 180 ? '#EAB308' : mutedText
            }}>
              {message.length} chars
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="Message content..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.currentTarget.style.height = 'auto';
              const nextHeight = Math.min(e.currentTarget.scrollHeight, 120);
              e.currentTarget.style.height = `${nextHeight}px`;
            }}
            style={{
              ...underlineInputStyle,
              resize: 'none',
              minHeight: '50px',
              maxHeight: '120px',
              overflowY: 'auto',
              paddingTop: '4px'
            }}
          />
        </div>

        {/* Action Link Input */}
        <input
          type="url"
          placeholder="Action link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={underlineInputStyle}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '8px',
            padding: '12px',
            background: '#FFFFFF',
            color: '#000000',
            fontWeight: '800',
            fontSize: '11px',
            letterSpacing: '2px',
            border: 'none',
            borderRadius: '2px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'SENDING...' : 'DISPATCH NOTIFICATION'}
        </button>
      </form>

    </div>
  );
}
