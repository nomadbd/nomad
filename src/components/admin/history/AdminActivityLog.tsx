import React, { useState, useEffect } from 'react';
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
  searchQuery?: string;     // মূল হেডার থেকে আসা সার্চ প্রপস
  selectedEntity?: string;  // মূল হেডার থেকে আসা ফিল্টার প্রপস (যদি প্রয়োজন হয়)
}

export default function AdminActivityLog({ onBack, searchQuery = '', selectedEntity = 'ALL' }: AdminActivityLogProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      return { color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', bg: 'rgba(16, 185, 129, 0.08)' };
    }
    if (type.includes('UPDATE') || type.includes('STATUS')) {
      return { color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', bg: 'rgba(245, 158, 11, 0.08)' };
    }
    if (type.includes('DELETE') || type.includes('ARCHIVE') || type.includes('CANCEL')) {
      return { color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', bg: 'rgba(239, 68, 68, 0.08)' };
    }
    return { color: '#a1a1aa', border: '1px solid #27272a', bg: '#18181b' };
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const filteredLogs = logs.filter((log) => {
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

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
        backgroundColor: '#000000',
        color: '#e4e4e7',
        fontFamily: 'monospace, sans-serif',
        boxSizing: 'border-box',
        padding: '12px 0',
      }}
    >
      {/* Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#52525b', fontSize: '11px' }}>
            LOADING...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#52525b', fontSize: '11px' }}>
            NO ACTIVITY FOUND
          </div>
        ) : (
          filteredLogs.map((log) => {
            const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            const adminName = profileObj?.name || profileObj?.email?.split('@')[0] || 'System';
            const badge = getBadgeStyle(log.action_type);

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #18181b',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {/* Meta Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        textTransform: 'uppercase',
                      }}
                    >
                      {log.action_type}
                    </span>
                    <span style={{ color: '#71717a', textTransform: 'uppercase' }}>
                      {log.entity_type}
                    </span>
                  </div>
                  <span style={{ color: '#52525b', fontSize: '10px' }}>
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                {/* Changes List */}
                {log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '2px 0' }}>
                    {Object.entries(log.changes).map(([key, val]: [string, any]) => (
                      <div
                        key={key}
                        style={{
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#a1a1aa',
                        }}
                      >
                        <span style={{ color: '#71717a', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}:</span>
                        <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{String(val?.old ?? 'null')}</span>
                        <span style={{ color: '#52525b' }}>→</span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{String(val?.new ?? 'null')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Reason / Single Field */}
                {(!log.changes || Object.keys(log.changes).length === 0) && (log.field_name || log.reason) && (
                  <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                    {log.reason || `${log.field_name}: ${log.old_value || 'null'} → ${log.new_value || 'null'}`}
                  </div>
                )}

                {/* Footer User */}
                <div style={{ fontSize: '9px', color: '#52525b', display: 'flex', justifyContent: 'flex-end' }}>
                  <span>BY: <strong style={{ color: '#71717a' }}>{adminName.toUpperCase()}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
