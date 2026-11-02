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
          // নতুন কোনো লগ আসলে এবং সেটি ডিলিট সংক্রান্ত হলে লিস্টে যুক্ত করব
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
      // শুধুমাত্র ডিলিট সম্পর্কিত অ্যাকশনগুলো ফিল্টার করে আনা হচ্ছে (.ilike)
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
        maxWidth: '850px',
        margin: '0 auto',
        backgroundColor: '#000000',
        color: '#e4e4e7',
        fontFamily: 'monospace, sans-serif',
        boxSizing: 'border-box',
        padding: '12px 0',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #27272a', paddingBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '1px', textTransform: 'uppercase' }}>
          🗑️ System Deletion Logs ({filteredLogs.length})
        </span>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ backgroundColor: 'transparent', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', cursor: 'pointer' }}
          >
            ← Back
          </button>
        )}
      </div>

      {debugError && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '12px', marginBottom: '12px', color: '#f87171', fontSize: '11px', wordBreak: 'break-all' }}>
          <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>⚠️ Debug Error:</strong>
          {debugError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#52525b', fontSize: '11px' }}>
            LOADING DELETION LOGS...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#71717a', fontSize: '11px' }}>
            NO DELETION RECORDS FOUND
          </div>
        ) : (
          filteredLogs.map((log) => {
            const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            const adminName = profileObj?.name || profileObj?.email?.split('@')[0] || 'Admin User';
            const adminRole = profileObj?.role || profileObj?.designation || 'Admin';
            
            // ডিলিট হওয়া আইটেমের পূর্বের ডেটা (যদি changes.old এ থাকে)
            const oldData = log.changes?.old || log.changes || {};

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Top Badge & Entity */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {log.action_type}
                    </span>
                    <span style={{ color: '#a1a1aa', fontWeight: '600', textTransform: 'uppercase' }}>
                      Entity: {log.entity_type}
                    </span>
                  </div>
                  <span style={{ color: '#71717a', fontSize: '10px' }}>
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                {/* Deleted Content Preview (যদি রিমাইন্ডার বা অন্য কিছু হয়) */}
                {oldData && typeof oldData === 'object' && (
                  <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#d4d4d8' }}>
                    <div style={{ color: '#71717a', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>Deleted Item Data:</div>
                    {oldData.content && <div><strong>Content:</strong> {oldData.content}</div>}
                    {oldData.reference && <div style={{ color: '#3498db' }}><strong>Reference:</strong> {oldData.reference}</div>}
                    {oldData.name && <div><strong>Name:</strong> {oldData.name}</div>}
                    {oldData.category && <div style={{ color: '#a1a1aa' }}><strong>Category:</strong> {oldData.category}</div>}
                  </div>
                )}

                {/* Footer User Info */}
                <div style={{ fontSize: '9px', color: '#71717a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #18181b' }}>
                  <span>ROLE: <strong style={{ color: '#a1a1aa' }}>{adminRole.toUpperCase()}</strong></span>
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
