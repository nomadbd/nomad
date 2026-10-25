import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';

interface LogisticsHistoryProps {
  onBack: () => void;
  entityType?: string;
  title?: string;
}

interface AuditLogItem {
  id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changes?: any;
  reason?: string;
  metadata?: {
    name?: string;
    designation?: string;
    email?: string;
  };
  created_at: string;
}

export default function LogisticsHistory({ 
  onBack, 
  entityType = 'store_settings', 
  title = 'Logistics Audit History' 
}: LogisticsHistoryProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('entity_type', entityType)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [entityType]);

  const formatFieldName = (key: string) => {
    switch (key) {
      case 'delivery_charge':
        return 'Shipping Fee';
      case 'vat_rate':
        return 'VAT Rate';
      default:
        return key.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#222228',
        border: '1px solid #363642',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #30303b',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#b0b0bc',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>

        {/* Back / Close Button */}
        <button
          type="button"
          onClick={onBack}
          title="Back to Settings"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <CloseIcon width={16} height={16} stroke="#ffffff" />
        </button>
      </div>

      {/* Logs Content List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          LOADING HISTORY...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#888888', fontSize: '11px', fontFamily: 'monospace' }}>
          NO HISTORY FOUND FOR THIS SECTION
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {logs.map((log) => {
            const userName = log.metadata?.name || 'System / Admin';
            const userDesignation = log.metadata?.designation ? `(${log.metadata.designation})` : '';
            const userEmail = log.metadata?.email || '';

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#1a1a20',
                  border: '1px solid #2d2d38',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Top Row: User Info & Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '11px', borderBottom: '1px solid #262630', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: '#3498db', fontWeight: '700' }}>
                      {userName} <span style={{ color: '#aaa', fontWeight: '400', fontSize: '10px' }}>{userDesignation}</span>
                    </span>
                    {userEmail && (
                      <span style={{ color: '#888895', fontSize: '10px', fontFamily: 'monospace' }}>
                        {userEmail}
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#9999aa', fontFamily: 'monospace', fontSize: '10px' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Structured Changes Object Rendering */}
                {log.changes && typeof log.changes === 'object' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    {Object.entries(log.changes).map(([key, val]: [string, any]) => (
                      <div
                        key={key}
                        style={{
                          backgroundColor: '#141418',
                          border: '1px solid #262630',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#cfcfd9' }}>
                          {formatFieldName(key)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'monospace' }}>
                          <span style={{ color: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            Old: <strong>{val?.old ?? 'N/A'}</strong>
                          </span>
                          <span style={{ color: '#666' }}>➔</span>
                          <span style={{ color: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            New: <strong>{val?.new ?? 'N/A'}</strong>
                          </span>
                        </div>
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
