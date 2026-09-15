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

export default function AdminNotifications() {
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);

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
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'ERR // Title & Message required' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'ERR // Target user ID required' });
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

      setStatusMsg({ type: 'success', text: 'SUCCESS // Dispatch sent' });
      setTitle('');
      setMessage('');
      setLink('');
      setSpecificUserId('');
      setUserSearch('');
      fetchSentHistory();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'ERR // Dispatch failed' });
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

  const getTypeStyle = (category: string) => {
    switch (category) {
      case 'PROMO': return { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' };
      case 'ALERT': return { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' };
      case 'SYSTEM': return { color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' };
      default: return { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' };
    }
  };

  // Modern Input Style Helper
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#090909',
    border: '1px solid #1F1F1F',
    borderRadius: '4px',
    color: '#FFFFFF',
    fontSize: '12px',
    fontFamily: 'monospace, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    color: '#777',
    fontWeight: '700',
    letterSpacing: '1px',
    marginBottom: '6px',
    textTransform: 'uppercase'
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', color: '#FFF', fontFamily: 'monospace, sans-serif', padding: '10px 4px' }}>

      {/* Status Bar */}
      {statusMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          background: statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Responsive Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>

        {/* Dispatch Form Panel */}
        <form onSubmit={handleSend} style={{
          background: '#050505',
          border: '1px solid #141414',
          borderRadius: '6px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          {/* Target Audience Switcher */}
          <div>
            <label style={labelStyle}>Target</label>
            <div style={{ display: 'flex', background: '#0A0A0A', padding: '3px', borderRadius: '4px', border: '1px solid #181818' }}>
              <button
                type="button"
                onClick={() => setTargetType('all')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  background: targetType === 'all' ? '#1F1F1F' : 'transparent',
                  color: targetType === 'all' ? '#FFF' : '#666',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ALL USERS
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  background: targetType === 'specific' ? '#1F1F1F' : 'transparent',
                  color: targetType === 'specific' ? '#FFF' : '#666',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                SINGLE USER
              </button>
            </div>
          </div>

          {/* User Search Input (Only for Specific) */}
          {targetType === 'specific' && (
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Recipient Search</label>
              <input
                type="text"
                placeholder="Search Name / Email / User ID..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSpecificUserId(e.target.value);
                }}
                style={fieldStyle}
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
                  marginTop: '4px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
                }}>
                  {userOptions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSpecificUserId(u.id);
                        setUserSearch(u.email || u.name || u.id);
                        setUserOptions([]);
                      }}
                      style={{ padding: '10px 12px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #161616' }}
                    >
                      <div style={{ color: '#FFF', fontWeight: 'bold' }}>{u.name || 'Anonymous User'}</div>
                      <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{u.email} // {u.id.slice(0, 8)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Pills */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(['INFO', 'PROMO', 'ALERT', 'SYSTEM'] as const).map((cat) => {
                const active = type === cat;
                const style = getTypeStyle(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setType(cat)}
                    style={{
                      padding: '8px 0',
                      fontSize: '9px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      background: active ? style.bg : '#0A0A0A',
                      color: active ? style.color : '#555',
                      border: `1px solid ${active ? style.border : '#181818'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Headline Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              placeholder="Headline title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={fieldStyle}
            />
          </div>

          {/* Message Body */}
          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              rows={3}
              placeholder="Enter details body text..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </div>

          {/* Action Link */}
          <div>
            <label style={labelStyle}>Action Link (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={fieldStyle}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '12px',
              background: '#FFFFFF',
              color: '#000000',
              fontWeight: '900',
              fontSize: '11px',
              letterSpacing: '1.5px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'DISPATCHING...' : 'DISPATCH NOTIFICATION'}
          </button>
        </form>

        {/* Live Preview Card (Device Push Notification Look) */}
        <div style={{
          background: '#050505',
          border: '1px solid #141414',
          borderRadius: '6px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <label style={labelStyle}>Live Preview</label>
          
          <div style={{
            background: '#0A0A0A',
            border: '1px solid #1C1C1C',
            borderRadius: '6px',
            padding: '14px 16px',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            minHeight: '140px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '8px',
                  fontWeight: '800',
                  padding: '3px 7px',
                  borderRadius: '3px',
                  letterSpacing: '0.5px',
                  color: getTypeStyle(type).color,
                  background: getTypeStyle(type).bg,
                  border: `1px solid ${getTypeStyle(type).border}`
                }}>
                  {type}
                </span>
                <span style={{ fontSize: '9px', color: '#444' }}>JUST NOW</span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 'bold', color: title ? '#FFFFFF' : '#444', marginBottom: '6px' }}>
                {title || 'Headline Title Placeholder'}
              </div>

              <div style={{ fontSize: '11px', color: message ? '#999999' : '#333333', lineHeight: '1.4' }}>
                {message || 'Your notification body text preview will appear here in real-time as you type...'}
              </div>
            </div>

            {link && (
              <div style={{
                marginTop: '14px',
                paddingTop: '8px',
                borderTop: '1px dashed #1C1C1C',
                fontSize: '10px',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 'bold'
              }}>
                <span>ACTION LINK</span>
                <span>↗</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Dispatch History Logs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 2px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: '#666' }}>DISPATCH HISTORY</span>
          <button
            onClick={fetchSentHistory}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace' }}
          >
            REFRESH
          </button>
        </div>

        {fetchingHistory ? (
          <div style={{ color: '#444', fontSize: '10px', padding: '12px', textAlign: 'center' }}>LOADING RECENT LOGS...</div>
        ) : sentHistory.length === 0 ? (
          <div style={{ color: '#444', fontSize: '10px', padding: '12px', textAlign: 'center' }}>NO DISPATCH LOGS FOUND</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sentHistory.map((item) => {
              const b = getTypeStyle(item.type);
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#050505',
                    border: '1px solid #141414',
                    borderRadius: '4px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '8px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: b.color,
                      border: `1px solid ${b.border}`,
                      background: b.bg,
                      flexShrink: 0
                    }}>
                      {item.type}
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EEE', marginRight: '8px' }}>{item.title}</span>
                      <span style={{ fontSize: '10px', color: '#666' }}>{item.message}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '9px', color: '#444', background: '#0A0A0A', padding: '2px 6px', borderRadius: '2px', border: '1px solid #141414' }}>
                      {item.target_audience === 'ALL' ? 'GLOBAL' : `USER: ${item.user_id.slice(0, 6)}`}
                    </span>
                    <button
                      onClick={() => handleDeleteSent(item.id)}
                      style={{ background: 'none', border: 'none', color: '#555', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                    >
                      DEL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
