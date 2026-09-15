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
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

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
    setIsSearchingUsers(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name')
      .or(`email.ilike.%${query}%,name.ilike.%${query}%,id.eq.${query}`)
      .limit(5);

    if (data) setUserOptions(data);
    setIsSearchingUsers(false);
  };

  const fetchSentHistory = async () => {
    setFetchingHistory(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) setSentHistory(data as SentNotification[]);
    setFetchingHistory(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'ERR: TITLE & MESSAGE REQUIRED' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'ERR: TARGET USER REQUIRED' });
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

      setStatusMsg({ type: 'success', text: 'DISPATCH COMPLETED' });
      setTitle('');
      setMessage('');
      setLink('');
      setSpecificUserId('');
      setUserSearch('');
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

  const getBadgeStyle = (badgeType: string) => {
    switch (badgeType) {
      case 'PROMO': return { color: '#EAB308', border: '1px solid #854D0E', bg: 'rgba(234,179,8,0.06)' };
      case 'ALERT': return { color: '#EF4444', border: '1px solid #991B1B', bg: 'rgba(239,68,68,0.06)' };
      case 'SYSTEM': return { color: '#A855F7', border: '1px solid #6B21A8', bg: 'rgba(168,85,247,0.06)' };
      default: return { color: '#3B82F6', border: '1px solid #1E40AF', bg: 'rgba(59,130,246,0.06)' };
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', color: '#FFF', fontFamily: 'monospace, sans-serif' }}>
      
      {/* Header */}
      <div style={{ paddingBottom: '16px', marginBottom: '20px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', fontWeight: 'bold' }}>SYS // DISPATCH</span>
          <h1 style={{ fontSize: '16px', fontWeight: '900', margin: '2px 0 0 0', letterSpacing: '2px' }}>NOTIFICATIONS</h1>
        </div>
        {statusMsg && (
          <span style={{
            fontSize: '10px',
            padding: '4px 8px',
            color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171',
            border: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
            background: '#000'
          }}>
            {statusMsg.text}
          </span>
        )}
      </div>

      {/* Main Grid: Form & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', marginBottom: '32px' }}>
        
        {/* Form Panel */}
        <form onSubmit={handleSend} style={{ background: '#070707', border: '1px solid #181818', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Target Audience */}
          <div>
            <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '8px', letterSpacing: '1px' }}>TARGET</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setTargetType('all')}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '10px',
                  background: targetType === 'all' ? '#FFF' : '#000',
                  color: targetType === 'all' ? '#000' : '#666',
                  border: '1px solid #222',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ALL USERS
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific')}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '10px',
                  background: targetType === 'specific' ? '#FFF' : '#000',
                  color: targetType === 'specific' ? '#000' : '#666',
                  border: '1px solid #222',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                SINGLE USER
              </button>
            </div>
          </div>

          {/* User Selector */}
          {targetType === 'specific' && (
            <div style={{ position: 'relative' }}>
              <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '4px', letterSpacing: '1px' }}>RECIPIENT SEARCH</span>
              <input
                type="text"
                placeholder="Search Name / Email / UUID..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSpecificUserId(e.target.value);
                }}
                style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #262626', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />
              {userOptions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0D0D0D', border: '1px solid #262626', zIndex: 10, marginTop: '2px' }}>
                  {userOptions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSpecificUserId(u.id);
                        setUserSearch(u.email || u.name || u.id);
                        setUserOptions([]);
                      }}
                      style={{ padding: '8px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #1A1A1A', color: '#AAA' }}
                    >
                      <div style={{ color: '#FFF', fontWeight: 'bold' }}>{u.name || 'User'}</div>
                      <div style={{ fontSize: '9px', color: '#555' }}>{u.email} | {u.id.slice(0, 8)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '4px', letterSpacing: '1px' }}>CATEGORY</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {(['INFO', 'PROMO', 'ALERT', 'SYSTEM'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setType(cat)}
                  style={{
                    padding: '6px 0',
                    fontSize: '9px',
                    background: type === cat ? '#181818' : '#000',
                    color: type === cat ? '#FFF' : '#555',
                    border: `1px solid ${type === cat ? '#444' : '#1A1A1A'}`,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div>
            <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '4px', letterSpacing: '1px' }}>TITLE</span>
            <input
              type="text"
              placeholder="Notification headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #262626', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '4px', letterSpacing: '1px' }}>MESSAGE</span>
            <textarea
              rows={3}
              placeholder="Message body..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #262626', color: '#FFF', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '4px', letterSpacing: '1px' }}>ACTION URL (OPTIONAL)</span>
            <input
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #262626', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px',
              background: '#FFF',
              color: '#000',
              fontWeight: '900',
              fontSize: '10px',
              letterSpacing: '2px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              marginTop: '4px'
            }}
          >
            {loading ? 'SENDING...' : 'DISPATCH'}
          </button>
        </form>

        {/* Live Preview Panel */}
        <div style={{ background: '#070707', border: '1px solid #181818', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', marginBottom: '12px', fontWeight: 'bold' }}>LIVE PREVIEW</span>
          
          <div style={{ background: '#000', border: '1px solid #222', padding: '12px', borderRadius: '2px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '8px', padding: '2px 4px', fontWeight: 'bold', ...getBadgeStyle(type) }}>
                  {type}
                </span>
                <span style={{ fontSize: '8px', color: '#444' }}>NOW</span>
              </div>
              
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: title ? '#FFF' : '#444', marginBottom: '4px' }}>
                {title || 'Headline Title'}
              </div>

              <div style={{ fontSize: '10px', color: message ? '#888' : '#333', lineHeight: '1.3' }}>
                {message || 'Notification content display area preview...'}
              </div>
            </div>

            {link && (
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #1A1A1A', fontSize: '9px', color: '#3B82F6', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                LINK ↗
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Dispatch History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', color: '#666' }}>LOGS</span>
          <button 
            onClick={fetchSentHistory}
            style={{ background: 'none', border: 'none', color: '#444', fontSize: '9px', cursor: 'pointer' }}
          >
            REFRESH
          </button>
        </div>

        {fetchingHistory ? (
          <div style={{ color: '#444', fontSize: '10px' }}>LOADING LOGS...</div>
        ) : sentHistory.length === 0 ? (
          <div style={{ color: '#444', fontSize: '10px' }}>NO RECENT LOGS</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sentHistory.map((item) => {
              const b = getBadgeStyle(item.type);
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#070707',
                    border: '1px solid #141414',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', padding: '2px 5px', color: b.color, border: b.border, background: b.bg }}>
                      {item.type}
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EEE', marginRight: '8px' }}>{item.title}</span>
                      <span style={{ fontSize: '10px', color: '#666' }}>{item.message}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', shrink: 0 }}>
                    <span style={{ fontSize: '8px', color: '#444' }}>
                      {item.target_audience === 'ALL' ? 'ALL' : item.user_id.slice(0, 6)}
                    </span>
                    <button
                      onClick={() => handleDeleteSent(item.id)}
                      style={{ background: 'none', border: 'none', color: '#444', fontSize: '9px', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
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
