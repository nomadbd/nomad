import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface LogisticsHistoryProps {
  onBack: () => void;
  entityType?: string;
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
  user_id?: string;
  profiles?: {
    name?: string;
    designation?: string;
    email?: string;
  };
}

export default function LogisticsHistory({ 
  onBack, 
  entityType = 'store_settings' 
}: LogisticsHistoryProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('entity_type', entityType)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        if (logsData && logsData.length > 0) {
          const userIds = Array.from(
            new Set(logsData.map((log: any) => log.user_id).filter(Boolean))
          );

          let profilesMap: { [key: string]: any } = {};

          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, name, designation, email')
              .in('id', userIds);

            if (profilesData) {
              profilesData.forEach((profile: any) => {
                profilesMap[profile.id] = profile;
              });
            }
          }

          const formattedLogs = logsData.map((log: any) => ({
            ...log,
            profiles: log.user_id ? profilesMap[log.user_id] : null,
          }));

          setLogs(formattedLogs);
        } else {
          setLogs([]);
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
    <div>
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
            const userName = log.profiles?.name || 'Admin / User';
            const userDesignation = log.profiles?.designation ? `(${log.profiles.designation})` : '';
            const userEmail = log.profiles?.email || '';

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
