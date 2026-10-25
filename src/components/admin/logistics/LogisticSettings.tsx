import React, { useState } from 'react';

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
  const [localDelivery, setLocalDelivery] = useState(String(deliveryCharge ?? ''));
  const [localVat, setLocalVat] = useState(String(vatRate ?? ''));

  // রিয়েল-টাইমে পরিবর্তন ট্র্যাক করা
  const hasChanges =
    localDelivery !== String(deliveryCharge ?? '') ||
    localVat !== String(vatRate ?? '');

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
        backgroundColor: '#202026', // প্রিমিয়াম ধূসর ব্যাকগ্রাউন্ড
        border: '1px solid #32323d',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section: LOGISTICS & Pill-shaped Save Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid #2e2e38',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#a0a0ab',
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
              borderRadius: '20px', // ডিম্বাকার বাটন (Pill-shaped)
              padding: '5px 14px',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Shipping Fee */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '13px', color: '#e1e1e6', fontWeight: '500' }}>
            Shipping Fee
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#292933',
              border: '1px solid #3f3f4d',
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
              placeholder={String(deliveryCharge ?? '')}
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
            <span style={{ fontSize: '13px', color: '#a0a0ab', marginLeft: '6px', fontWeight: '600' }}>৳</span>
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
          <label style={{ fontSize: '13px', color: '#e1e1e6', fontWeight: '500' }}>
            VAT Rate
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#292933',
              border: '1px solid #3f3f4d',
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
              placeholder={String(vatRate ?? '')}
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
            <span style={{ fontSize: '13px', color: '#a0a0ab', marginLeft: '6px', fontWeight: '600' }}>%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
