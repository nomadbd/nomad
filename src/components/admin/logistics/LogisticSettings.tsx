import React, { useState, useEffect } from 'react';

interface LogisticsSettingsProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onSaveSettings: () => void;
}

export default function LogisticSettings({
  deliveryCharge,
  vatRate,
  isSaving,
  onDeliveryChange,
  onVatChange,
  onSaveSettings,
}: LogisticsSettingsProps) {
  const [localDelivery, setLocalDelivery] = useState('');
  const [localVat, setLocalVat] = useState('');

  // Sync state if props change externally
  useEffect(() => {
    setLocalDelivery('');
  }, [deliveryCharge]);

  useEffect(() => {
    setLocalVat('');
  }, [vatRate]);

  const hasChanges = localDelivery !== '' || localVat !== '';

  const handleDeliveryInput = (val: string) => {
    setLocalDelivery(val);
    onDeliveryChange(val);
  };

  const handleVatInput = (val: string) => {
    setLocalVat(val);
    onVatChange(val);
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#161618', // সম্পূর্ণ কার্ডের প্রিমিয়াম ধূসর ব্যাকগ্রাউন্ড
        border: '1px solid #262629',
        borderRadius: '12px',
        padding: '16px',
        color: '#ededed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section: LOGISTICS & Save Button on the same row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid #222225',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#999999',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
          }}
        >
          Logistics
        </span>

        {hasChanges && (
          <button
            type="button"
            onClick={onSaveSettings}
            disabled={isSaving}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? 'SAVING...' : 'SAVE'}
          </button>
        )}
      </div>

      {/* Input Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Shipping Fee */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '13px', color: '#b0b0b5', fontWeight: '500' }}>
            Shipping Fee
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e1e22',
              border: '1px solid #2e2e33',
              borderRadius: '6px',
              padding: '4px 10px',
              width: '110px',
              justifyContent: 'flex-end',
            }}
          >
            <input
              type="number"
              value={localDelivery}
              placeholder={String(deliveryCharge ?? '')}
              onChange={(e) => handleDeliveryInput(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'right',
                width: '100%',
                fontFamily: 'monospace',
              }}
            />
            <span style={{ fontSize: '12px', color: '#88888f', marginLeft: '6px', fontWeight: '600' }}>৳</span>
          </div>
        </div>

        {/* VAT Rate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '13px', color: '#b0b0b5', fontWeight: '500' }}>
            VAT Rate
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e1e22',
              border: '1px solid #2e2e33',
              borderRadius: '6px',
              padding: '4px 10px',
              width: '110px',
              justifyContent: 'flex-end',
            }}
          >
            <input
              type="number"
              step="any"
              value={localVat}
              placeholder={String(vatRate ?? '')}
              onChange={(e) => handleVatInput(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'right',
                width: '100%',
                fontFamily: 'monospace',
              }}
            />
            <span style={{ fontSize: '12px', color: '#88888f', marginLeft: '6px', fontWeight: '600' }}>%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
