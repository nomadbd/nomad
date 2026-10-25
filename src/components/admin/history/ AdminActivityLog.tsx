import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';

interface AuditLogItem {
  id: string;
  entity_type: string;
  action_type: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  changes?: Record<string, { old: any; new: any }> | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  user_id?: string | null;
  profiles?: {
    name?: string | null;
    designation?: string | null;
    role?: string | null;
    email?: string | null;
  } | { name?: string | null; designation?: string | null; role?: string | null; email?: string | null }[] | null;
}

interface AdminActivityLogProps {
  onBack?: () => void;
}

const ENTITY_FILTERS = ['ALL', 'orders', 'products', 'store_settings', 'ambassador'];

export default function AdminActivityLog({ onBack }: AdminActivityLogProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  useEffect(() => {
    fetchAuditLogs();

    const channel = supabase
      .channel('admin_audit_logs_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            designation,
            role,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data as unknown as AuditLogItem[]) || []);
    } catch (err) {
      console.error('Error fetching admin activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (actionType: string) => {
    const type = (actionType || '').toUpperCase();
    if (type.includes('CREATE') || type.includes('RESTORE') || type.includes('RECEIVED')) {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.25)',
      };
    }
    if (type.includes('UPDATE') || type.includes('STATUS')) {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.25)',
      };
    }
    if (type.includes('DELETE') || type.includes('ARCHIVE') || type.includes('CANCEL')) {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        color: '#f87171',
        borderColor: 'rgba(239, 68, 68, 0.25)',
      };
    }
    return {
      backgroundColor: '#18181b',
      color: '#d4d4d8',
      borderColor: '#27272a',
    };
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').toUpperCase();
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const actionMatch = (log.action_type || '').toLowerCase().includes(q);
      const entityMatch = (log.entity_type || '').toLowerCase().includes(q);
      const reasonMatch = (log.reason || '').toLowerCase().includes(q);

      const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
      const userName = (profileObj?.name || '').toLowerCase();
      const userEmail = (profileObj?.email || '').toLowerCase();
      const userMatch = userName.includes(q) || userEmail.includes(q);

      const matchesSearch = !q || actionMatch || entityMatch || reasonMatch || userMatch;
      const matchesEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity;

      return matchesSearch && matchesEntity;
    });
  }, [logs, searchQuery, selectedEntity]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        borderRadius: '12px',
        border: '1px solid #27272a',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #27272a',
          backgroundColor: '#09090b',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                color: '#d4d4d8',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>
            ADMIN ACTIVITY & AUDIT LOGS
          </h3>
        </div>
        <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
          TOTAL: {filteredLogs.length} LOGS
        </span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #27272a', backgroundColor: '#0d0d10' }}>
        <input
          type="text"
          placeholder="Search by action, entity, admin name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {ENTITY_FILTERS.map((ent) => {
            const active = selectedEntity === ent;
            return (
              <button
                key={ent}
                type="button"
                onClick={() => setSelectedEntity(ent)}
                style={{
                  padding: '6px 12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '16px',
                  border: `1px solid ${active ? '#ffffff' : '#27272a'}`,
                  background: active ? '#ffffff' : '#18181b',
                  color: active ? '#000000' : '#a1a1aa',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {ent.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '600px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>
            LOADING ACTIVITY LOGS...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', color: '#71717a', fontSize: '12px', gap: '8px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>NO ACTIVITY LOGS FOUND</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            const adminName = profileObj?.name || 'System / Admin';
            const adminRole = profileObj?.role || profileObj?.designation || 'Admin';
            const adminEmail = profileObj?.email || '';
            const badgeStyle = getBadgeStyle(log.action_type);

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '1px solid',
                        textTransform: 'uppercase',
                        ...badgeStyle,
                      }}
                    >
                      {log.action_type}
                    </span>
                    <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      [{log.entity_type}]
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>
                </div>

                {log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(log.changes).map(([key, val]: [string, any]) => (
                      <div
                        key={key}
                        style={{
                          backgroundColor: '#09090b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#a1a1aa' }}>
                          {formatFieldName(key)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                          <span style={{ color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: '2px 6px', borderRadius: '4px', textDecoration: 'line-through' }}>
                            {String(val?.old ?? 'None')}
                          </span>
                          <span style={{ color: '#52525b' }}>➔</span>
                          <span style={{ color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            {String(val?.new ?? 'None')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!log.changes || Object.keys(log.changes).length === 0) && (log.field_name || log.reason) && (
                  <div style={{ fontSize: '11px', color: '#d4d4d8', fontFamily: 'monospace' }}>
                    {log.field_name && <strong>{log.field_name}: </strong>}
                    {log.reason || `${log.old_value || 'N/A'} ➔ ${log.new_value || 'N/A'}`}
                  </div>
                )}

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#d4d4d8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {adminName} {adminEmail ? `(${adminEmail})` : ''}
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
                      border: '1px solid #27272a',
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
}
