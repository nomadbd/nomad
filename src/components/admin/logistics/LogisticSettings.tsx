import React from 'react';

interface LogisticsSettingsProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  initialDeliveryCharge: number | string;
  initialVatRate: number | string;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onSaveSettings: () => void;
  onCancel: () => void;
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
  onCancel,
}: LogisticsSettingsProps) {
  const isDeliveryChanged = deliveryCharge !== '' && String(deliveryCharge) !== String(initialDeliveryCharge);
  const isVatChanged = vatRate !== '' && String(vatRate) !== String(initialVatRate);

  const hasChanges = isDeliveryChanged || isVatChanged;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          borderBottom: '1px solid #1a1a1a',
          padding: '16px 0',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            minHeight: '28px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#666',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Fulfillment & Checkout Config
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
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '10px',
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '1px solid #141414',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>
              Base Shipping Rate
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>৳</span>
              <input
                type="number"
                value={deliveryCharge}
                placeholder={String(initialDeliveryCharge)}
                onChange={(e) => onDeliveryChange(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '80px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '1px solid #141414',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>
              Tax Rate (VAT)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                step="any"
                value={vatRate}
                placeholder={String(initialVatRate)}
                onChange={(e) => onVatChange(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '80px',
                  fontFamily: 'monospace',
                }}
              />
              <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
