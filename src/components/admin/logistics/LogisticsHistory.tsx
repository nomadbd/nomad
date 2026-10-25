import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';

interface LogisticsHistoryProps {
  onBack: () => void;
  entityType?: string; // নির্দিষ্ট কার্ড বা সেটিংস ফিল্টার করার জন্য প্রপস
  title?: string;      // পেজের হেডার টাইটেল ডাইনামিক করার জন্য
}

interface AuditLogItem {
  id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changes?: any;
  reason?: string;
  metadata?: any;
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
        // নির্দিষ্ট entity_type অনুযায়ী লগ ফিল্টার করে ফেচ করা
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                backgroundColor: '#1a1a20',
                border: '1px solid #2d2d38',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#3498db', fontFamily: 'monospace' }}>
                  {log.action_type || 'UPDATE'}
                </span>
                <span style={{ fontSize: '10px', color: '#888888', fontFamily: 'monospace' }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              {log.field_name && (
                <div style={{ fontSize: '12px', color: '#e0e0e5' }}>
                  Field: <strong style={{ color: '#fff' }}>{log.field_name}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', fontSize: '11px', fontFamily: 'monospace' }}>
                {log.old_value !== undefined && log.old_value !== null && (
                  <span style={{ color: '#e74c3c' }}>Old: {String(log.old_value)}</span>
                )}
                {log.new_value !== undefined && log.new_value !== null && (
                  <span style={{ color: '#2ecc71' }}>New: {String(log.new_value)}</span>
                )}
              </div>

              {log.changes && (
                <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  Changes: {JSON.stringify(log.changes)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
