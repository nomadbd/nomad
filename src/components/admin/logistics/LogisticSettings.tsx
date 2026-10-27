import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';

interface LogisticsSettingsProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  initialDeliveryCharge?: number | string;
  initialVatRate?: number | string;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onSaveSettings: () => void;
  onCancel?: () => void;
}

export default function LogisticSettings({
  deliveryCharge,
  vatRate,
  initialDeliveryCharge,
  initialVatRate,
  isSaving,
  onDeliveryChange,
  onVatChange,
  onSaveSettings,
}: LogisticsSettingsProps) {
  const [localDelivery, setLocalDelivery] = useState('');
  const [localVat, setLocalVat] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const baseDelivery = initialDeliveryCharge !== undefined ? initialDeliveryCharge : deliveryCharge;
  const baseVat = initialVatRate !== undefined ? initialVatRate : vatRate;

  const prevIsSaving = useRef(isSaving);
  useEffect(() => {
    if (prevIsSaving.current && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
        setLocalDelivery('');
        setLocalVat('');
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevIsSaving.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    if (showHistory) {
      const fetchAuditLogs = async () => {
        setHistoryLoading(true);
        try {
          const { data: logsData, error: logsError } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_type', 'store_settings')
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
          setHistoryLoading(false);
        }
      };

      fetchAuditLogs();
    }
  }, [showHistory]);

  const hasChanges = localDelivery !== '' || localVat !== '';
  const shouldShowButton = hasChanges || isSaving || showSaved;

  const handleDeliveryInput = (val: string) => {
    setLocalDelivery(val);
    onDeliveryChange(val);
  };

  const handleVatInput = (val: string) => {
    setLocalVat(val);
    onVatChange(val);
  };

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
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes pulseDot {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
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
          {showHistory ? 'Logistics Audit History' : 'Logistics'}
        </span>

        {showHistory ? (
          <button
            type="button"
            onClick={() => setShowHistory(false)}
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
        ) : shouldShowButton ? (
          <button
            type="button"
            onClick={onSaveSettings}
            disabled={isSaving || showSaved || !hasChanges}
            style={{
              backgroundColor: showSaved ? '#10b981' : hasChanges ? '#ffffff' : '#3a3a46',
              color: showSaved ? '#ffffff' : hasChanges ? '#000000' : '#888898',
              border: 'none',
              borderRadius: '20px',
              width: '88px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.8px',
              cursor: hasChanges && !isSaving && !showSaved ? 'pointer' : 'default',
              transition: 'background-color 0.2s ease, color 0.2s ease',
            }}
          >
            {isSaving ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out' }}></span>
                <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out 0.2s' }}></span>
                <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out 0.4s' }}></span>
              </div>
            ) : showSaved ? (
              'SAVED'
            ) : (
              'SAVE'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '26px',
              padding: '0',
              transition: 'color 0.2s',
            }}
            title="View Logistics History"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </button>
        )}
      </div>

      {showHistory ? (
        historyLoading ? (
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
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '500' }}>
              Shipping Fee
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#2c2c35',
                border: '1px solid #444452',
                borderRadius: '6px',
                padding: '6px 10px',
                flex: '1',
                maxWidth: '150px',
                justifyContent: 'flex-end',
              }}
            >
              <input
                type="number"
                value={localDelivery}
                placeholder={String(baseDelivery ?? '')}
                onChange={(e) => handleDeliveryInput(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '100%',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '13px', color: '#c0c0cc', marginLeft: '6px', fontWeight: '600' }}>৳</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '500' }}>
              VAT Rate
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#2c2c35',
                border: '1px solid #444452',
                borderRadius: '6px',
                padding: '6px 10px',
                flex: '1',
                maxWidth: '150px',
                justifyContent: 'flex-end',
              }}
            >
              <input
                type="number"
                step="any"
                value={localVat}
                placeholder={String(baseVat ?? '')}
                onChange={(e) => handleVatInput(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '100%',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '13px', color: '#c0c0cc', marginLeft: '6px', fontWeight: '600' }}>%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
