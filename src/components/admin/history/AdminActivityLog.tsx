import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface AuditLogItem {
  id: string;
  entity_type: string;
  action_type: string;
  changes?: Record<string, { old: any; new: any }> | null;
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
  searchQuery?: string;
  selectedEntity?: string;
}

export default function AdminActivityLog({ onBack, searchQuery = '', selectedEntity = 'ALL' }: AdminActivityLogProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletionLogs();

    const channel = supabase
      .channel('admin_deletion_logs_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          if (payload.new && payload.new.action_type && payload.new.action_type.toUpperCase().includes('DELETE')) {
            fetchDeletionLogs();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeletionLogs = async () => {
    setLoading(true);
    setDebugError(null);
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
        .ilike('action_type', '%DELETE%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
      }

      setLogs((data as unknown as AuditLogItem[]) || []);
    } catch (err: any) {
      console.error('Error fetching deletion logs:', err);
      setDebugError(err.message || 'Unknown error occurred while fetching deletion logs.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const actionMatch = (log.action_type || '').toLowerCase().includes(q);
    const entityMatch = (log.entity_type || '').toLowerCase().includes(q);

    const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    const userName = (profileObj?.name || '').toLowerCase();
    const userEmail = (profileObj?.email || '').toLowerCase();
    const userMatch = userName.includes(q) || userEmail.includes(q);

    const matchesSearch = !q || actionMatch || entityMatch || userMatch;
    const matchesEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity;

    return matchesSearch && matchesEntity;
  });

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        color: '#f1f5f9',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        padding: '16px 12px',
        overflowX: 'hidden',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', letterSpacing: '1px', textTransform: 'uppercase' }}>
          🗑️ SYSTEM DELETION LOGS ({filteredLogs.length})
        </span>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
          >
            ← Back
          </button>
        )}
      </div>

      {debugError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px', color: '#f87171', fontSize: '11px', wordBreak: 'break-all' }}>
          <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>⚠️ Debug Error:</strong>
          {debugError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '12px', letterSpacing: '1px' }}>
            LOADING DELETION LOGS...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '12px', letterSpacing: '0.5px' }}>
            NO DELETION RECORDS FOUND.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            const adminName = profileObj?.name || profileObj?.email?.split('@')[0] || 'Admin User';
            const adminRole = profileObj?.role || profileObj?.designation || 'Admin';

            const oldData = log.changes?.old || log.changes || {};

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#0c0c0e',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {/* Top Badge & Entity */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {log.action_type}
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', fontSize: '12px' }}>
                      {log.entity_type}
                    </span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                {/* Deleted Content Preview */}
                {oldData && typeof oldData === 'object' && (
                  <div style={{ backgroundColor: '#141417', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px', fontWeight: 600 }}>Deleted Item Data:</div>
                    {oldData.content && <div style={{ marginBottom: '4px' }}><strong>Content:</strong> {oldData.content}</div>}
                    {oldData.reference && <div style={{ color: '#38bdf8', marginBottom: '4px' }}><strong>Reference:</strong> {oldData.reference}</div>}
                    {oldData.name && <div style={{ marginBottom: '4px' }}><strong>Name:</strong> {oldData.name}</div>}
                    {oldData.category && <div style={{ color: '#94a3b8' }}><strong>Category:</strong> {oldData.category}</div>}
                  </div>
                )}

                {/* Footer User Info */}
                <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', flexWrap: 'wrap', gap: '6px' }}>
                  <span>ROLE: <strong style={{ color: '#cbd5e1' }}>{adminRole.toUpperCase()}</strong></span>
                  <span>DELETED BY: <strong style={{ color: '#f87171' }}>{adminName.toUpperCase()}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
