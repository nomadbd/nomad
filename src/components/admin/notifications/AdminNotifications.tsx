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

  // নোটিফিকেশন হিস্ট্রি
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
      setStatusMsg({ type: 'error', text: 'Title and Message are required!' });
      return;
    }

    if (targetType === 'specific' && !specificUserId.trim()) {
      setStatusMsg({ type: 'error', text: 'Specific User ID is required!' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      if (targetType === 'specific') {
        // ১. নির্দিষ্ট ইউজারে ইনসার্ট
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
        // ২. সকল ইউজারে ইনসার্ট (Broadcast All)
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

      setStatusMsg({ type: 'success', text: 'Notification sent successfully!' });
      setTitle('');
      setMessage('');
      setLink('');
      setSpecificUserId('');
      fetchSentHistory();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send notification' });
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

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: '#FFF' }}>

      {/* হেডার */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', margin: '0 0 6px 0', letterSpacing: '0.3px' }}>
          Notification Manager
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#71717A' }}>
          Broadcast announcements or send targeted notifications to app users.
        </p>
      </div>

      {/* রেসপন্স স্টেটাস */}
      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          backgroundColor: statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${statusMsg.type === 'success' ? '#15803D' : '#991B1B'}`,
          color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* ফর্ম */}
      <div style={{
        background: '#09090B',
        border: '1px solid #27272A',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* টার্গেট অডিয়েন্স */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '8px' }}>Target Audience</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="audience"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                />
                Broadcast to All Users
              </label>
              <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="audience"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                />
                Specific User ID
              </label>
            </div>
          </div>

          {/* ইউজার আইডি ফিল্ড */}
          {targetType === 'specific' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '6px' }}>User ID</label>
              <input
                type="text"
                placeholder="Enter Supabase User UUID"
                value={specificUserId}
                onChange={(e) => setSpecificUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: '#121212',
                  border: '1px solid #27272A',
                  color: '#FFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* টাইপ ড্রপডাউন */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '6px' }}>Notification Type</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#121212',
                border: '1px solid #27272A',
                color: '#FFF',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="INFO">INFO (General Notice)</option>
              <option value="PROMO">PROMO (Offer / Discount)</option>
              <option value="ALERT">ALERT (Warning / Urgent)</option>
              <option value="SYSTEM">SYSTEM (Maintenance / Update)</option>
            </select>
          </div>

          {/* টাইটেল */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '6px' }}>Title</label>
            <input
              type="text"
              placeholder="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#121212',
                border: '1px solid #27272A',
                color: '#FFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* মেসেজ */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '6px' }}>Message Body</label>
            <textarea
              rows={4}
              placeholder="Write the full notification message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#121212',
                border: '1px solid #27272A',
                color: '#FFF',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* অপশনাল লিংক */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#A1A1AA', marginBottom: '6px' }}>Explore Action Link (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/promo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#121212',
                border: '1px solid #27272A',
                color: '#FFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* সাবমিট বাটন */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px 20px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontWeight: '600',
              fontSize: '13px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Sending Notifications...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* হিস্ট্রি তালিকা */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: '#FFF' }}>
          Recent Notification History
        </h2>

        {fetchingHistory ? (
          <div style={{ color: '#71717A', fontSize: '13px' }}>Loading history...</div>
        ) : sentHistory.length === 0 ? (
          <div style={{ color: '#71717A', fontSize: '13px' }}>No sent notifications found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sentHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#09090B',
                  border: '1px solid #27272A',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#18181B', border: '1px solid #27272A', color: '#A1A1AA' }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '11px', color: '#71717A' }}>
                      {item.target_audience === 'ALL' ? 'Broadcast All' : `User: ${item.user_id.slice(0, 8)}...`}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#FFF' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#71717A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '450px' }}>
                    {item.message}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSent(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #27272A',
                    color: '#F87171',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}