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
  const [localDelivery, setLocalDelivery] = useState(String(deliveryCharge ?? ''));
  const [localVat, setLocalVat] = useState(String(vatRate ?? ''));

  // Sync state if props change from outside
  useEffect(() => {
    setLocalDelivery(String(deliveryCharge ?? ''));
  }, [deliveryCharge]);

  useEffect(() => {
    setLocalVat(String(vatRate ?? ''));
  }, [vatRate]);

  const hasChanges =
    String(localDelivery) !== String(deliveryCharge) ||
    String(localVat) !== String(vatRate);

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
        backgroundColor: '#0a0a0a',
        border: '1px solid #1f1f1f',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#ededed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#888888',
            letterSpacing: '1px',
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
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Input Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Shipping Fee */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
          }}
        >
          <label style={{ fontSize: '13px', color: '#cccccc', fontWeight: '400' }}>
            Shipping Fee
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#121212',
              border: '1px solid #262626',
              borderRadius: '4px',
              padding: '2px 8px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '4px' }}>৳</span>
            <input
              type="number"
              value={localDelivery}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleDeliveryInput(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'right',
                width: '70px',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* VAT Rate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
          }}
        >
          <label style={{ fontSize: '13px', color: '#cccccc', fontWeight: '400' }}>
            VAT Rate
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#121212',
              border: '1px solid #262626',
              borderRadius: '4px',
              padding: '2px 8px',
            }}
          >
            <input
              type="number"
              step="any"
              value={localVat}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleVatInput(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'right',
                width: '70px',
                fontFamily: 'monospace',
              }}
            />
            <span style={{ fontSize: '12px', color: '#666666', marginLeft: '4px' }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
