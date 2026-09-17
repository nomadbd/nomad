import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  HistoryIcon, 
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

  // Button Status State
  const [btnState, setBtnState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [btnErrorText, setBtnErrorText] = useState('');

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

  const isAllFilteredSelected = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every((u) => selectedUserIds.includes(u.id));
  }, [filteredUsers, selectedUserIds]);

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    if (isAllFilteredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const triggerError = (msg: string) => {
    setBtnErrorText(msg);
    setBtnState('error');
    setTimeout(() => {
      setBtnState('idle');
      setBtnErrorText('');
    }, 2500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      triggerError('SELECT RECIPIENTS');
      return;
    }
    if (!type) {
      triggerError('SELECT A CATEGORY');
      return;
    }
    if (!title.trim() || !message.trim()) {
      triggerError('TITLE & MESSAGE REQUIRED');
      return;
    }

    setBtnState('loading');

    try {
      // ১. বর্তমান লগইন করা অ্যাডমিন আইডি গ্রহণ
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('AUTHENTICATION FAILED');
      }

      // ২. Target Audience এর মান নির্ধারণ (UPPERCASE স্ট্যান্ডার্ড)
      let targetAudience = 'SPECIFIC';
      const totalUsers = allUsers.length;
      const totalAmbassadors = allUsers.filter(u => (u.role || '').toUpperCase() === 'AMBASSADOR').length;
      const totalCustomers = allUsers.filter(u => (u.role || '').toUpperCase() === 'CUSTOMER').length;

      if (totalUsers > 0 && selectedUserIds.length === totalUsers) {
        targetAudience = 'ALL';
      } else if (roleFilter === 'AMBASSADOR' && selectedUserIds.length === totalAmbassadors && totalAmbassadors > 0) {
        targetAudience = 'AMBASSADOR';
      } else if (roleFilter === 'CUSTOMER' && selectedUserIds.length === totalCustomers && totalCustomers > 0) {
        targetAudience = 'CUSTOMER';
      } else {
        targetAudience = 'SPECIFIC';
      }

      // ৩. notifications টেবিলে নোটিফিকেশন সেভ
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert([
          {
            title: title.trim(),
            message: message.trim(),
            type,
            link: link.trim() || null,
            target_audience: targetAudience,
            created_by: currentUser.id
          }
        ])
        .select()
        .single();

      if (notifError) throw notifError;

      // ৪. নির্বাচন করা সব ইউজারের জন্য notification_recipients টেবিলে ইনসার্ট
      const recipientData = selectedUserIds.map((userId) => ({
        notification_id: notification.id,
        user_id: userId,
        is_read: false
      }));

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipientData);

      if (recipientError) throw recipientError;

      setBtnState('success');
      setTitle('');
      setMessage('');
      setLink('');
      setType(null);
      setSelectedUserIds([]);

      setTimeout(() => {
        setBtnState('idle');
      }, 2500);

    } catch (err: any) {
      triggerError(err.message ? err.message.toUpperCase() : 'FAILED TO DISPATCH');
    }
  };

  const underlineInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1A1A1A',
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
    <div style={{ maxWidth: '540px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px 12px', paddingBottom: '120px' }}>

      <style>{`
        input::placeholder, textarea::placeholder { color: ${mutedText} !important; opacity: 1 !important; }
        textarea::-webkit-scrollbar, .sheet-scroll::-webkit-scrollbar { width: 2px; }
        textarea::-webkit-scrollbar-thumb, .sheet-scroll::-webkit-scrollbar-thumb { background: #222222; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: '#FFF' }}>DISPATCH</span>

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
            fontWeight: '600',
            letterSpacing: '1px',
            cursor: 'pointer',
            padding: '2px 0',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}
        >
          <HistoryIcon style={{ width: 13, height: 13 }} />
          <span>LOGS</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* RECIPIENTS SECTION */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            RECIPIENTS
          </span>

          <div style={{
            background: '#050505',
            border: '1px solid #141414',
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
                  style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#111111', border: '1px solid #222', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <PlusIcon style={{ width: 11, height: 11 }} />
                </button>
              </div>
            </div>

            {selectedUserIds.length > 0 && (
              <div className="sheet-scroll" style={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                {selectedUserIds.map((id) => {
                  const u = allUsers.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0F0F0F',
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
                    background: 'transparent',
                    color: active ? '#FFFFFF' : mutedText,
                    border: `1px solid ${active ? '#FFFFFF' : '#141414'}`,
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
            style={{ ...underlineInputStyle, resize: 'none', minHeight: '44px' }}
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
            background: '#050505',
            border: '1px solid #141414',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: type ? '#FFFFFF' : '#333333',
              marginTop: '5px'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#FFF' }}>
                  {title || 'Notification Title'}
                </span>
                <span style={{ fontSize: '9px', color: mutedText }}>Now</span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#777', lineHeight: '1.4' }}>
                {message || 'Notification content will appear here...'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={btnState !== 'idle'}
          style={{
            marginTop: '6px',
            padding: '12px',
            background: btnState === 'success' ? '#FFFFFF' : '#080808',
            color: btnState === 'success' ? '#000000' : '#FFFFFF',
            fontWeight: '700',
            fontSize: '10px',
            letterSpacing: '2px',
            border: `1px solid ${
              btnState === 'success' ? '#FFFFFF' : btnState === 'error' ? '#666666' : '#222222'
            }`,
            borderRadius: '4px',
            cursor: btnState !== 'idle' ? 'default' : 'pointer',
            opacity: btnState === 'loading' ? 0.6 : 1,
            transition: 'all 0.25s ease'
          }}
        >
          {btnState === 'loading' && 'SENDING...'}
          {btnState === 'success' && 'SENT SUCCESSFULLY'}
          {btnState === 'error' && (btnErrorText || 'FAILED')}
          {btnState === 'idle' && `DISPATCH (${selectedUserIds.length})`}
        </button>

      </form>

      {/* RECIPIENT SELECTOR MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#000000',
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px' }}>RECIPIENTS</span>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', padding: '4px', cursor: 'pointer' }}
            >
              <CloseIcon style={{ width: 13, height: 13 }} />
            </button>
          </div>

          <div style={{ padding: '14px 20px', borderBottom: '1px solid #111111', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#080808', border: '1px solid #1A1A1A', borderRadius: '4px', padding: '8px 12px', color: '#FFF', fontSize: '12px', outline: 'none' }}
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
                      background: 'transparent', color: active ? '#FFF' : mutedText,
                      border: `1px solid ${active ? '#FFF' : '#1A1A1A'}`, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
              <span style={{ fontSize: '9px', color: mutedText, letterSpacing: '1px', fontWeight: '600' }}>
                {filteredUsers.length} FOUND
              </span>
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isAllFilteredSelected ? '#FFFFFF' : mutedText,
                  fontSize: '9px',
                  fontWeight: '700',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                {isAllFilteredSelected ? 'DESELECT ALL' : `SELECT ALL (${filteredUsers.length})`}
              </button>
            </div>
          </div>

          <div className="sheet-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelectUser(user.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid #0F0F0F', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '2px', border: `1px solid ${isSelected ? '#FFF' : '#222'}`, background: isSelected ? '#FFF' : 'transparent', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <CheckIcon style={{ width: 9, height: 9 }} />}
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: isSelected ? '#FFF' : '#888', display: 'block' }}>{user.name || 'Unnamed User'}</span>
                      <span style={{ fontSize: '10px', color: mutedText }}>{user.email || user.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: mutedText }}>{selectedUserIds.length} selected</span>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 20px', background: '#FFF', color: '#000', fontWeight: '700', fontSize: '10px', letterSpacing: '1px', border: 'none', borderRadius: '2px', cursor: 'pointer' }}>DONE</button>
          </div>
        </div>
      )}

    </div>
  );
}
