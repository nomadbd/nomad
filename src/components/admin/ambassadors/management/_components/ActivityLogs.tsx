import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { BackIcon, HistoryIcon, ProfileIcon } from '@/components/icons';

interface AuditLog {
  id: string;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changes: Record<string, any> | null;
  reason: string | null;
  metadata: {
    admin_email?: string;
    admin_role?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  performed_by: string | null;
}

interface Props {
  ambassadorId: string;
  onBack: () => void;
}

export const ActivityLogs: React.FC<Props> = ({ ambassadorId, onBack }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLogs();
  }, [ambassadorId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'RATE_UPDATE':
      case 'COMMISSION_CHANGE':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#34d399',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        };
      case 'STATUS_CHANGE':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: '#fbbf24',
          borderColor: 'rgba(245, 158, 11, 0.25)',
        };
      case 'PRODUCT_ASSIGN':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          color: '#60a5fa',
          borderColor: 'rgba(59, 130, 246, 0.25)',
        };
      default:
        return {
          backgroundColor: '#18181b',
          color: '#d4d4d8',
          borderColor: '#27272a',
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '420px',
        maxHeight: 'calc(100dvh - 100px)',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid #27272a',
          position: 'sticky',
          top: 0,
          backgroundColor: '#09090b',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            color: '#d4d4d8',
            borderRadius: '10px',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BackIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
          </div>
        </button>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
            Activity & Audit Logs
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a1a1aa' }}>
            অ্যাম্বাসেডরের সমস্ত আপডেটের ইতিহাস
          </p>
        </div>
      </div>

      {/* Log List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '12px', fontFamily: 'monospace' }}>
            লগ লোড হচ্ছে...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#71717a', fontSize: '12px' }}>
            <div style={{ width: '28px', height: '28px', opacity: 0.4, marginBottom: '8px' }}>
              <HistoryIcon style={{ width: '28px', height: '28px', color: '#71717a' }} />
            </div>
            <span>কোনো একটিভিটি হিস্ট্রি পাওয়া যায়নি</span>
          </div>
        ) : (
          logs.map((log) => {
            const adminEmail = log.metadata?.admin_email || 'System / Admin';
            const adminRole = log.metadata?.admin_role || 'Admin';
            const badgeStyle = getBadgeStyle(log.action_type);

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Badge & Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid',
                      textTransform: 'uppercase',
                      ...badgeStyle,
                    }}
                  >
                    {log.action_type || 'UPDATE'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                    <div style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HistoryIcon style={{ width: '12px', height: '12px', color: '#71717a' }} />
                    </div>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>

                {/* Details / Field */}
                <div style={{ fontSize: '12px', color: '#e4e4e7' }}>
                  {log.field_name && (
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {log.field_name}
                    </div>
                  )}

                  {log.old_value || log.new_value ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        backgroundColor: '#09090b',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #27272a',
                      }}
                    >
                      <span style={{ color: '#f87171', textDecoration: 'line-through' }}>
                        {log.old_value || 'None'}
                      </span>
                      <span style={{ color: '#52525b' }}>➔</span>
                      <span style={{ color: '#34d399', fontWeight: '600' }}>
                        {log.new_value || 'None'}
                      </span>
                    </div>
                  ) : log.reason ? (
                    <p style={{ margin: 0, fontSize: '12px', color: '#d4d4d8' }}>{log.reason}</p>
                  ) : null}
                </div>

                {/* Footer Admin Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(39, 39, 42, 0.6)',
                    fontSize: '11px',
                    color: '#a1a1aa',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <ProfileIcon style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px', color: '#a1a1aa' }} />
                    </div>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#a1a1aa',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {adminEmail}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      backgroundColor: '#18181b',
                      borderRadius: '4px',
                      color: '#a1a1aa',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {adminRole}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
