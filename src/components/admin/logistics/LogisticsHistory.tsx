import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';

interface LogisticsHistoryProps {
  onClose: () => void;
}

export default function LogisticsHistory({ onClose }: LogisticsHistoryProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogisticsHistory = async () => {
      try {
        setLoading(true);
        // audit_logs থেকে শুধুমাত্র লজিস্টিকস সংক্রান্ত লগগুলো ফেচ করা
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            *,
            profiles:user_id (
              name,
              email
            )
          `)
          .eq('entity_type', 'STORE_SETTINGS') // অথবা আপনার লজিস্টিকসের জন্য নির্ধারিত entity_type
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setHistoryList(data);
        }
      } catch (err) {
        console.error('Error fetching logistics history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogisticsHistory();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#23212c',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '10px',
            borderBottom: '1px solid #3b3848',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1px',
              color: '#b0b0bc',
              textTransform: 'uppercase',
            }}
          >
            Logistics Audit History
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CloseIcon width="16" height="16" />
          </button>
        </div>

        {/* Content List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', fontSize: '11px', color: '#777' }}>
            LOADING HISTORY...
          </div>
        ) : historyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', fontSize: '11px', color: '#777' }}>
            NO HISTORY FOUND
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyList.map((log) => {
              const userName = log.profiles?.name || log.profiles?.email || 'Unknown User';
              const formattedDate = new Date(log.created_at).toLocaleString();
              const changes = log.changes || {};

              return (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: '#14131a',
                    border: '1px solid #3b3848',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8a8894' }}>
                    <span style={{ fontWeight: '600', color: '#a855f7' }}>{userName}</span>
                    <span>{formattedDate}</span>
                  </div>

                  {/* Changes Cards */}
                  {Object.entries(changes).map(([field, val]: [string, any]) => (
                    <div
                      key={field}
                      style={{
                        backgroundColor: '#1e1b26',
                        borderRadius: '6px',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ fontWeight: '600', textTransform: 'capitalize', color: '#ddd' }}>
                        {field.replace('_', ' ')}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>
                          Old: {val?.old ?? 'N/A'}
                        </span>
                        <span>→</span>
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>
                          New: {val?.new ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
