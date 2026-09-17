import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { BackIcon, CheckIcon, CloseIcon } from '@/components/icons';

interface Recipient {
  id: string;
  user_id: string;
  is_read: boolean;
  name?: string;
  email?: string;
}

interface SenderInfo {
  name?: string;
  email?: string;
}

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT';
  link?: string | null;
  target_audience: string;
  created_by?: string;
  sender?: SenderInfo | null;
  created_at: string;
  notification_recipients?: Recipient[];
}

interface NotificationLogsProps {
  onBack: () => void;
}

type CategoryType = 'INFO' | 'PROMO' | 'SYSTEM' | 'ALERT' | null;

export default function NotificationLogs({ onBack }: NotificationLogsProps) {
  const [logs, setLogs] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const mutedText = '#888888';

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('admin_notification_logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchLogs()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_recipients' },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // ১. notifications ডাটা ফেচ
      const { data: notifsData, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (notifsError) throw notifsError;

      if (!notifsData || notifsData.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const notificationIds = notifsData.map((n) => n.id);

      // ২. notification_recipients ফেচ
      const { data: recipientsData, error: recipError } = await supabase
        .from('notification_recipients')
        .select('id, notification_id, user_id, is_read')
        .in('notification_id', notificationIds);

      if (recipError) console.error('Error fetching recipients:', recipError.message);

      // ৩. সেন্ডার ও প্রাপকদের প্রোফাইল ডাটা একযোগে ফেচ
      const createdByIds = notifsData.map((item) => item.created_by).filter(Boolean);
      const recipientUserIds = (recipientsData || []).map((r) => r.user_id).filter(Boolean);
      const allUserIds = Array.from(new Set([...createdByIds, ...recipientUserIds]));

      let profilesMap: Record<string, SenderInfo> = {};

      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', allUserIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { name: profile.name, email: profile.email };
            return acc;
          }, {} as Record<string, SenderInfo>);
        }
      }

      // ৪. প্রাপকদের নোটিফিকেশন আইডি অনুযায়ী গ্রুপ করা ও নাম যুক্ত করা
      const recipientsGrouped: Record<string, Recipient[]> = {};
      (recipientsData || []).forEach((r) => {
        if (!recipientsGrouped[r.notification_id]) {
          recipientsGrouped[r.notification_id] = [];
        }
        const userProf = profilesMap[r.user_id];
        recipientsGrouped[r.notification_id].push({
          id: r.id,
          user_id: r.user_id,
          is_read: r.is_read,
          name: userProf?.name,
          email: userProf?.email
        });
      });

      // ৫. ফাইনাল লগ ফরম্যাটিং
      const formattedLogs = notifsData.map((item) => ({
        ...item,
        sender: item.created_by ? profilesMap[item.created_by] || null : null,
        notification_recipients: recipientsGrouped[item.id] || []
      }));

      setLogs(formattedLogs as SentNotification[]);
    } catch (err: any) {
      console.error('Error fetching logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setLogs((prev) => prev.filter((item) => item.id !== id));
      triggerToast('Log deleted successfully', 'success');
    } catch (err: any) {
      triggerToast('Delete failed: ' + err.message, 'error');
    }
  };

  const getExactDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
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

  const getTargetAudienceLabel = (aud: string, recipientCount: number) => {
    const upper = (aud || '').toUpperCase();
    switch (upper) {
      case 'ALL':
        return 'GLOBAL (ALL USERS)';
      case 'AMBASSADOR':
        return 'AMBASSADORS';
      case 'GENERAL':
      case 'CUSTOMER':
        return 'CUSTOMERS';
      case 'INTERNAL':
        return 'INTERNAL STAFF & ADMINS';
      default:
        return `SPECIFIC (${recipientCount} RECIPIENT${recipientCount === 1 ? '' : 'S'})`;
    }
  };

  const getSeenStatusBadge = (recipients: Recipient[] = []) => {
    const total = recipients.length;
    const seen = recipients.filter((r) => r.is_read).length;

    if (total === 0) {
      return {
        text: 'NO RECIPIENTS',
        bg: 'rgba(255, 255, 255, 0.05)',
        color: mutedText,
        border: '#222222'
      };
    }

    if (seen === 0) {
      return {
        text: `UNSEEN (0/${total})`,
        bg: 'rgba(239, 68, 68, 0.1)',
        color: '#EF4444',
        border: 'rgba(239, 68, 68, 0.3)'
      };
    }

    if (seen === total) {
      return {
        text: `ALL SEEN (${seen}/${total})`,
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#4ADE80',
        border: 'rgba(34, 197, 94, 0.3)'
      };
    }

    return {
      text: `SEEN (${seen}/${total})`,
      bg: 'rgba(234, 179, 8, 0.15)',
      color: '#EAB308',
      border: 'rgba(234, 179, 8, 0.3)'
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const query = searchQuery.toLowerCase();
      const titleMatch = (log.title || '').toLowerCase().includes(query);
      const msgMatch = (log.message || '').toLowerCase().includes(query);
      const senderMatch = (log.sender?.name || log.sender?.email || '').toLowerCase().includes(query);
      const recipientMatch = log.notification_recipients?.some(
        (r) => (r.name || '').toLowerCase().includes(query) || (r.email || '').toLowerCase().includes(query)
      );

      const matchesSearch = titleMatch || msgMatch || senderMatch || recipientMatch;
      const matchesCategory = selectedCategory === 'ALL' || log.type === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchQuery, selectedCategory]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', color: '#FFF', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 8px', paddingBottom: '120px', position: 'relative' }}>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFF',
          padding: '10px 18px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1A1A1A', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', padding: 0 }}
        >
          {BackIcon ? <BackIcon style={{ width: 16, height: 16 }} /> : '◄'} BACK TO DISPATCHER
        </button>
        <span style={{ fontSize: '10px', color: mutedText, fontWeight: '700', letterSpacing: '1px' }}>LOGS & ANALYTICS</span>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search logs by title, message, sender or recipient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '10px 12px',
            color: '#FFF',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['ALL', 'INFO', 'PROMO', 'ALERT', 'SYSTEM'].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '20px',
                border: `1px solid ${active ? '#FFFFFF' : '#222222'}`,
                background: active ? '#FFFFFF' : '#141414',
                color: active ? '#000000' : mutedText,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Logs List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: mutedText, fontSize: '12px', padding: '40px 0' }}>Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', color: mutedText, fontSize: '12px', padding: '40px 0' }}>No logs matched your criteria</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLogs.map((item) => {
            const badge = getSeenStatusBadge(item.notification_recipients);
            const totalRecipients = item.notification_recipients?.length || 0;
            const senderName = item.sender?.name || item.sender?.email || 'System Admin';
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: '#0D0D0D',
                  border: '1px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: getCategoryColor(item.type), letterSpacing: '0.5px' }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '9px', color: mutedText }}>
                      • {getRelativeTime(item.created_at)} ({getExactDateTime(item.created_at)})
                    </span>
                  </div>

                  <span style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {badge.text}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: mutedText, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{item.message}</div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', fontSize: '10px', color: '#3B82F6', marginTop: '4px', wordBreak: 'break-all', textDecoration: 'none' }}
                    >
                      {item.link}
                    </a>
                  )}
                </div>

                {/* Footer Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #141414' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: '#AAA', fontWeight: '600' }}>
                      SENT BY: <span style={{ color: '#FFF' }}>{senderName}</span>
                    </span>
                    <span style={{ fontSize: '9px', color: '#666666' }}>
                      TARGET: {getTargetAudienceLabel(item.target_audience, totalRecipients)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {totalRecipients > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '10px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        {isExpanded ? 'HIDE RECIPIENTS' : 'VIEW RECIPIENTS'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>

                {/* Expandable Recipient Details List */}
                {isExpanded && item.notification_recipients && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #222222',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}>
                    <span style={{ fontSize: '9px', color: mutedText, fontWeight: '700', letterSpacing: '1px', marginBottom: '2px' }}>
                      RECIPIENT STATUS LIST ({item.notification_recipients.length})
                    </span>
                    {item.notification_recipients.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          background: '#050505',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid #111111'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '11px', color: '#DDD', fontWeight: '500', display: 'block' }}>
                            {rec.name || 'Unknown User'}
                          </span>
                          <span style={{ fontSize: '9px', color: mutedText }}>
                            {rec.email || rec.user_id}
                          </span>
                        </div>

                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '9px',
                          fontWeight: '700',
                          color: rec.is_read ? '#4ADE80' : '#EF4444'
                        }}>
                          {rec.is_read ? (
                            <>
                              <CheckIcon style={{ width: 10, height: 10 }} /> SEEN
                            </>
                          ) : (
                            <>
                              <CloseIcon style={{ width: 8, height: 8 }} /> UNSEEN
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
