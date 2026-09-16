import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  HistoryIcon, 
  ScheduleIcon, 
  PlusIcon, 
  CloseIcon, 
  CheckIcon 
} from '@/components/icons';
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

  const mutedText = '#666666';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role');

      if (error) throw error;
      if (data) setAllUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
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
      setStatusMsg({ type: 'error', text: 'Select recipients' });
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
        text: `Notification ${isScheduled ? 'scheduled' : 'sent'}`
      });

      setTitle('');
      setMessage('');
      setLink('');
      setType(null);
      setSelectedUserIds([]);
      setIsScheduled(false);
      setScheduledAt('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const underlineInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1C1C1C',
    padding: '12px 0',
    color: '#FFFFFF',
    fontSize: '13px',
    lineHeight: '1.5',
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
    <div style={{ maxWidth: '580px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px 12px', paddingBottom: '120px' }}>

      <style>{`
        input::placeholder, textarea::placeholder { color: ${mutedText} !important; opacity: 1 !important; }
        textarea::-webkit-scrollbar, .sheet-scroll::-webkit-scrollbar { width: 3px; }
        textarea::-webkit-scrollbar-thumb, .sheet-scroll::-webkit-scrollbar-thumb { background: #222222; border-radius: 2px; }
        
        .smooth-schedule-container {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, margin-top 0.35s ease;
          margin-top: 0;
        }
        .smooth-schedule-container.open {
          max-height: 50px;
          opacity: 1;
          margin-top: 10px;
        }

        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#FFF' }}>DISPATCHER PRO</span>

        <button
          type="button"
          onClick={() => setView('logs')}
          style={{
            background: 'transparent',
            border: 'none',
            color: mutedText,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '1px',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}
        >
          <HistoryIcon style={{ width: 13, height: 13 }} />
          <span>LOGS</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div style={{
          padding: '8px 0',
          marginBottom: '16px',
          fontSize: '11px',
          fontWeight: '500',
          borderBottom: `1px solid ${statusMsg.type === 'success' ? '#333' : '#666'}`,
          color: statusMsg.type === 'success' ? '#FFF' : '#AAA'
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
            background: '#080808',
            border: '1px solid #161616',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: selectedUserIds.length > 0 ? '#FFF' : mutedText, fontWeight: '500' }}>
                {selectedUserIds.length === 0 ? 'No recipients selected' : `${selectedUserIds.length} recipient(s)`}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    style={{ background: 'none', border: 'none', color: mutedText, fontSize: '9px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', padding: 0 }}
                  >
                    CLEAR
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#121212', border: '1px solid #222', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <PlusIcon style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>

            {/* Selected User Chips */}
            {selectedUserIds.length > 0 && (
              <div className="sheet-scroll" style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                {selectedUserIds.map((id) => {
                  const u = allUsers.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#111111',
                        border: '1px solid #222222',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        color: '#DDD'
                      }}
                    >
                      <span>{u?.name || u?.email || id}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(id)}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0 1px', display: 'flex', alignItems: 'center' }}
                      >
                        <CloseIcon style={{ width: 9, height: 9 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY SELECTOR */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            CATEGORY
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['INFO', 'PROMO', 'ALERT', 'SYSTEM'] as const).map((cat) => {
              const active = type === cat;
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
                    background: active ? '#FFFFFF' : '#080808',
                    color: active ? '#000000' : mutedText,
                    border: `1px solid ${active ? '#FFFFFF' : '#161616'}`,
                    borderRadius: '4px',
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

        {/* TIMING & SCHEDULING (SMOOTH SLIDE) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px' }}>
              TIMING
            </span>

            {/* Single Icon for both states */}
            <button
              type="button"
              onClick={() => setIsScheduled(!isScheduled)}
              title={isScheduled ? 'Scheduled Mode' : 'Instant Mode'}
              style={{
                background: 'transparent',
                border: 'none',
                color: isScheduled ? '#FFFFFF' : '#444444',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.25s ease'
              }}
            >
              <ScheduleIcon style={{ width: 15, height: 15 }} />
              <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1px' }}>
                {isScheduled ? 'SCHEDULED' : 'INSTANT'}
              </span>
            </button>
          </div>

          {/* Animated Schedule Container */}
          <div className={`smooth-schedule-container ${isScheduled ? 'open' : ''}`}>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                background: '#080808',
                border: '1px solid #222222',
                borderRadius: '4px',
                padding: '8px 12px',
                color: '#FFF',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
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
            <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px' }}>MESSAGE</span>
            <span style={{ fontSize: '9px', color: mutedText }}>{message.length} chars</span>
          </div>
          <textarea
            rows={2}
            placeholder="Message content..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ ...underlineInputStyle, resize: 'none', minHeight: '48px' }}
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
            PREVIEW
          </span>
          <div style={{
            background: '#080808',
            border: '1px solid #1A1A1A',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: type ? '#FFFFFF' : '#333333',
              marginTop: '5px'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#FFF' }}>
                  {title || 'Notification Title'}
                </span>
                <span style={{ fontSize: '9px', color: mutedText }}>Now</span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
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
            marginTop: '8px',
            padding: '13px',
            background: '#0F0F0F',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '11px',
            letterSpacing: '2px',
            border: '1px solid #262626',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#0F0F0F';
              e.currentTarget.style.color = '#FFFFFF';
            }
          }}
        >
          {loading ? 'PROCESSING...' : `DISPATCH TO ${selectedUserIds.length} USER(S)`}
        </button>

      </form>

      {/* FULL SCREEN RECIPIENT SELECTOR */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#050505',
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Sheet Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px' }}>SELECT RECIPIENTS</span>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', padding: '4px', cursor: 'pointer' }}
            >
              <CloseIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Search & Filters */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #111111', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: '4px', padding: '8px 12px', color: '#FFF', fontSize: '12px', outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {['ALL', 'SUPER_ADMIN', 'AMBASSADOR', 'CUSTOMER'].map((role) => {
                const active = roleFilter === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    style={{
                      padding: '4px 10px', fontSize: '9px', fontWeight: '700', borderRadius: '12px',
                      background: active ? '#FFF' : 'transparent', color: active ? '#000' : mutedText,
                      border: `1px solid ${active ? '#FFF' : '#1F1F1F'}`, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User List */}
          <div className="sheet-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelectUser(user.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid #111111', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '2px', border: `1px solid ${isSelected ? '#FFF' : '#333'}`, background: isSelected ? '#FFF' : 'transparent', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <CheckIcon style={{ width: 10, height: 10 }} />}
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: isSelected ? '#FFF' : '#AAA', display: 'block' }}>{user.name || 'Unnamed User'}</span>
                      <span style={{ fontSize: '10px', color: mutedText }}>{user.email || user.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sheet Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: mutedText }}>{selectedUserIds.length} selected</span>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 20px', background: '#FFF', color: '#000', fontWeight: '700', fontSize: '10px', letterSpacing: '1px', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>DONE</button>
          </div>
        </div>
      )}

    </div>
  );
}
