import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { HistoryIcon } from '@/components/icons';
import NotificationLogs from './NotificationLogs';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  roll?: string; // Schema fallback
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function AdminNotifications() {
  const [view, setView] = useState<'create' | 'logs'>('create');

  // Modal & User List States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Modal Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CategoryType>(null);
  const [link, setLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutedText = '#888888';

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, roll'); // role or roll fallback

      if (error) throw error;
      if (data) setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtered users inside Modal based on Search and Role
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const userRole = (user.role || user.roll || '').toUpperCase();
      
      // Role Filter Check
      if (roleFilter !== 'ALL' && userRole !== roleFilter) {
        return false;
      }

      // Search Query Check
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

  // Check if all current filtered users are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every((u) => selectedUserIds.includes(u.id));
  }, [filteredUsers, selectedUserIds]);

  // Toggle Single User
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  // Toggle All Filtered Users
  const toggleSelectFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const combined = new Set([...selectedUserIds, ...filteredUsers.map((u) => u.id)]);
      setSelectedUserIds(Array.from(combined));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please select at least one recipient (+ icon)' });
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
      const isAllUsersSelected = selectedUserIds.length === allUsers.length;
      
      const notificationsToInsert = selectedUserIds.map((userId) => ({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
        target_audience: isAllUsersSelected ? 'ALL' : 'SPECIFIC',
        is_read: false
      }));

      const { error } = await supabase.from('notifications').insert(notificationsToInsert);
      if (error) throw error;

      setStatusMsg({
        type: 'success',
        text: `Notification dispatched successfully to ${selectedUserIds.length} user(s)`
      });

      // Clear Form
      setTitle('');
      setMessage('');
      setLink('');
      setType(null);
      setSelectedUserIds([]);
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
      case 'AMBASSADOR': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: 'rgba(234, 179, 8, 0.3)' };
      case 'ADMIN': return { bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' };
      case 'CUSTOMER': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' };
      default: return { bg: 'rgba(255, 255, 255, 0.08)', color: '#AAA', border: '#333' };
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

  // Label text for recipients bar
  const getRecipientSummaryText = () => {
    if (selectedUserIds.length === 0) return 'No recipients selected';
    if (allUsers.length > 0 && selectedUserIds.length === allUsers.length) return 'All Users selected';
    if (selectedUserIds.length === 1) {
      const u = allUsers.find((x) => x.id === selectedUserIds[0]);
      return u ? `1 User (${u.name || u.email || 'Selected'})` : '1 User selected';
    }
    return `${selectedUserIds.length} Users selected`;
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px' }}>

      <style>{`
        input::placeholder, textarea::placeholder {
          color: ${mutedText} !important;
          opacity: 1 !important;
        }
        textarea::-webkit-scrollbar, .modal-scroll::-webkit-scrollbar {
          width: 4px;
        }
        textarea::-webkit-scrollbar-thumb, .modal-scroll::-webkit-scrollbar-thumb {
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

      {/* Main Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* RECIPIENT SELECTOR BAR (To Field) */}
        <div>
          <span style={{ display: 'block', fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1.5px', marginBottom: '8px' }}>
            RECIPIENTS
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            background: '#0B0B0B',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: selectedUserIds.length > 0 ? '#FFF' : mutedText }}>
                {getRecipientSummaryText()}
              </span>
              <span style={{ fontSize: '10px', color: mutedText }}>
                {selectedUserIds.length > 0 ? 'Click + to modify selection' : 'Click + to search or filter by role'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#181818',
                border: '1px solid #333',
                color: '#FFF',
                fontSize: '20px',
                fontWeight: '400',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
              title="Add / Manage Recipients"
            >
              +
            </button>
          </div>
        </div>

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
          {loading ? 'SENDING...' : `DISPATCH TO ${selectedUserIds.length} USER(S)`}
        </button>
      </form>

      {/* ========================================================= */}
      {/* RECIPIENT SELECTION MODAL (WhatsApp Style Selector)        */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0B0B0B',
            border: '1px solid #222222',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>

            {/* Modal Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #1A1A1A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', letterSpacing: '1px' }}>SELECT RECIPIENTS</h3>
                <span style={{ fontSize: '10px', color: mutedText }}>
                  Total {allUsers.length} users registered
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: mutedText,
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Search & Role Filters */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #141414', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search user by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#121212',
                  border: '1px solid #222',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#FFF',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />

              {/* Role Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {['ALL', 'AMBASSADOR', 'CUSTOMER', 'ADMIN'].map((role) => {
                  const active = roleFilter === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '9px',
                        fontWeight: '700',
                        letterSpacing: '1px',
                        borderRadius: '12px',
                        background: active ? '#FFF' : '#141414',
                        color: active ? '#000' : mutedText,
                        border: `1px solid ${active ? '#FFF' : '#222'}`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select All Toggle Action */}
            <div style={{
              padding: '10px 16px',
              background: '#0e0e0e',
              borderBottom: '1px solid #181818',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '10px', color: mutedText, fontWeight: '600' }}>
                Showing {filteredUsers.length} user(s)
              </span>

              <button
                type="button"
                onClick={toggleSelectFiltered}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isAllFilteredSelected ? '#EF4444' : '#3B82F6',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isAllFilteredSelected ? 'Deselect Visible' : 'Select All Visible'}
              </button>
            </div>

            {/* Scrollable User List */}
            <div className="modal-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '30px', fontSize: '11px', color: mutedText }}>
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', fontSize: '11px', color: mutedText }}>
                  No users found matching filter
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const roleStr = user.role || user.roll || 'USER';
                  const badgeStyle = getRoleBadgeStyle(roleStr);

                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleSelectUser(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 8px',
                        borderBottom: '1px solid #141414',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Custom Checkbox */}
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: `1px solid ${isSelected ? '#FFF' : '#333'}`,
                          background: isSelected ? '#FFF' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {isSelected && '✓'}
                        </div>

                        {/* User Details */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#FFF' }}>
                              {user.name || 'Unnamed User'}
                            </span>
                            <span style={{
                              fontSize: '8px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {roleStr.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: mutedText, display: 'block', marginTop: '2px' }}>
                            {user.email || user.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer / Apply Button */}
            <div style={{
              padding: '14px 16px',
              borderTop: '1px solid #1A1A1A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0B0B0B'
            }}>
              <span style={{ fontSize: '11px', color: '#FFF', fontWeight: '700' }}>
                Selected: {selectedUserIds.length} users
              </span>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 20px',
                  background: '#FFF',
                  color: '#000',
                  fontWeight: '800',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                APPLY SELECTION
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
