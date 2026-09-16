import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { HistoryIcon } from '@/components/icons';
import NotificationLogs from './NotificationLogs';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function AdminNotifications() {
  const [view, setView] = useState<'create' | 'logs'>('create');

  // Modal & User States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CategoryType>(null);
  const [link, setLink] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutedText = '#888888';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role');

      if (error) throw error;
      if (data) setAllUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
      setFetchError(err.message || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const userRole = (user.role || '').toUpperCase();
      if (roleFilter !== 'ALL' && userRole !== roleFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const id = user.id.toLowerCase();
        return name.includes(query) || email.includes(query) || id.includes(query);
      }

      return true;
    });
  }, [allUsers, roleFilter, searchQuery]);

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      setStatusMsg({ type: 'error', text: 'Select at least one recipient' });
      return;
    }
    if (!type) {
      setStatusMsg({ type: 'error', text: 'Select a category' });
      return;
    }
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: 'error', text: 'Title and message required' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const isAllUsersSelected = allUsers.length > 0 && selectedUserIds.length === allUsers.length;

      const notificationsToInsert = selectedUserIds.map((userId) => ({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
        target_audience: isAllUsersSelected ? 'ALL' : 'SPECIFIC',
        is_read: false,
        scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null
      }));

      const { error } = await supabase.from('notifications').insert(notificationsToInsert);
      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text: `Notification ${isScheduled ? 'scheduled' : 'dispatched'} for ${selectedUserIds.length} user(s)`
      });

      setTitle('');
      setMessage('');
      setLink('');
      setType(null);
      setSelectedUserIds([]);
      setIsScheduled(false);
      setScheduledAt('');
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

  const getRoleBadgeStyle = (roleStr?: string) => {
    const role = (roleStr || '').toUpperCase();
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN': 
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.4)' };
      case 'AMBASSADOR': 
        return { bg: 'rgba(234, 179, 8, 0.2)', color: '#FACC15', border: 'rgba(234, 179, 8, 0.4)' };
      case 'CUSTOMER': 
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)' };
      default: 
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#AAA', border: '#333' };
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
  };

  if (view === 'logs') {
    return <NotificationLogs onBack={() => setView('create')} />;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px' }}>

      <style>{`
        input::placeholder, textarea::placeholder { color: ${mutedText} !important; opacity: 1 !important; }
        textarea::-webkit-scrollbar, .sheet-scroll::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb, .sheet-scroll::-webkit-scrollbar-thumb { background: #333333; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: '#FFF' }}>DISPATCHER PRO</span>

        <button
          type="button"
          onClick={() => setView('logs')}
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
          borderBottom: `1px solid ${statusMsg.type === 'success' ? '#22C55E' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* RECIPIENTS SECTION */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            RECIPIENTS
          </span>

          <div style={{
            background: '#0B0B0B',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: selectedUserIds.length > 0 ? '#FFF' : mutedText, fontWeight: '600' }}>
                {selectedUserIds.length === 0 ? 'No recipients selected' : `${selectedUserIds.length} user(s) selected`}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    CLEAR ALL
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#181818', border: '1px solid #333', color: '#FFF', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Selected User Chips */}
            {selectedUserIds.length > 0 ? (
              <div className="sheet-scroll" style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedUserIds.map((id) => {
                  const u = allUsers.find((x) => x.id === id);
                  const badge = getRoleBadgeStyle(u?.role);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#161616',
                        border: '1px solid #282828',
                        borderRadius: '16px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        color: '#FFF'
                      }}
                    >
                      <span>{u?.name || u?.email || id}</span>
                      <span style={{ fontSize: '8px', fontWeight: '800', background: badge.bg, color: badge.color, padding: '1px 5px', borderRadius: '4px', border: `1px solid ${badge.border}` }}>
                        {(u?.role || 'USER').toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(id)}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', padding: '0 2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: mutedText, fontStyle: 'italic' }}>
                Click + button to choose recipients
              </span>
            )}
          </div>
        </div>

        {/* CATEGORY SELECTOR */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            CATEGORY
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
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
                    fontWeight: '800',
                    background: 'transparent',
                    color: active ? catColor : mutedText,
                    border: `1px solid ${active ? catColor : '#222'}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* TIMING & SCHEDULING */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px' }}>
              DISPATCH TIMING
            </span>
            <button
              type="button"
              onClick={() => setIsScheduled(!isScheduled)}
              style={{ background: 'none', border: 'none', color: isScheduled ? '#A855F7' : mutedText, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
            >
              {isScheduled ? '⏰ SCHEDULED' : '⚡ INSTANT SEND'}
            </button>
          </div>

          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                background: '#121212',
                border: '1px solid #2A2A2A',
                borderRadius: '4px',
                padding: '8px 12px',
                color: '#FFF',
                fontSize: '11px',
                outline: 'none'
              }}
            />
          )}
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
            <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px' }}>MESSAGE</span>
            <span style={{ fontSize: '10px', color: message.length > 180 ? '#EAB308' : mutedText }}>{message.length} chars</span>
          </div>
          <textarea
            rows={2}
            placeholder="Message content..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ ...underlineInputStyle, resize: 'none', minHeight: '50px' }}
          />
        </div>

        {/* Action Link */}
        <input
          type="url"
          placeholder="Action link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={underlineInputStyle}
        />

        {/* LIVE MOBILE PREVIEW CARD */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            LIVE PREVIEW (NOTIFICATION TOAST)
          </span>
          <div style={{
            background: '#121212',
            border: `1px solid ${type ? getCategoryColor(type) : '#2B2B2B'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getCategoryColor(type),
              marginTop: '5px'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFF' }}>
                  {title || 'Notification Title'}
                </span>
                <span style={{ fontSize: '9px', color: mutedText }}>Just Now</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#CCC', lineHeight: '1.4' }}>
                {message || 'Notification content will appear here...'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px',
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
          {loading ? 'PROCESSING...' : `DISPATCH TO ${selectedUserIds.length} USER(S)`}
        </button>

      </form>

      {/* FULL SCREEN RECIPIENT SELECTOR */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: '20px', left: 0, right: 0, bottom: 0,
          background: '#070707',
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          border: '1px solid #222'
        }}>
          {/* Sheet Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', letterSpacing: '1px' }}>SELECT RECIPIENTS</h3>
              <span style={{ fontSize: '10px', color: mutedText }}>Total {allUsers.length} users in database</span>
            </div>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#1A1A1A', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Filters */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #141414', display: 'flex', flexDirection: 'column', gap: '12px', background: '#0B0B0B' }}>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#121212', border: '1px solid #222', borderRadius: '6px', padding: '10px 14px', color: '#FFF', fontSize: '12px', outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['ALL', 'SUPER_ADMIN', 'AMBASSADOR', 'CUSTOMER'].map((role) => {
                const active = roleFilter === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    style={{
                      padding: '6px 14px', fontSize: '10px', fontWeight: '700', borderRadius: '16px',
                      background: active ? '#FFF' : '#141414', color: active ? '#000' : mutedText,
                      border: `1px solid ${active ? '#FFF' : '#222'}`, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User List */}
          <div className="sheet-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              const badgeStyle = getRoleBadgeStyle(user.role);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelectUser(user.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 10px', borderBottom: '1px solid #141414', cursor: 'pointer',
                    background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent', borderRadius: '6px', marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${isSelected ? '#FFF' : '#444'}`, background: isSelected ? '#FFF' : 'transparent', color: '#000', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && '✓'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFF' }}>{user.name || 'Unnamed User'}</span>
                        <span style={{ fontSize: '8px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}>
                          {(user.role || 'USER').toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: mutedText, display: 'block', marginTop: '3px' }}>{user.email || user.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sheet Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0B0B0B' }}>
            <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '700' }}>Selected: {selectedUserIds.length} users</span>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 24px', background: '#FFF', color: '#000', fontWeight: '800', fontSize: '11px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>DONE / APPLY</button>
          </div>
        </div>
      )}

    </div>
  );
}
