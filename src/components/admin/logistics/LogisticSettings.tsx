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
  // Check if current value in input differs from saved initial value
  const isDeliveryChanged = deliveryCharge !== '' && String(deliveryCharge) !== String(initialDeliveryCharge);
  const isVatChanged = vatRate !== '' && String(vatRate) !== String(initialVatRate);

  const hasChanges = isDeliveryChanged || isVatChanged;

  return (
    <div style={{ padding: '16px 0', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: '8px',
          padding: '20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
            DELIVERY CHARGES & TAXES
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: hasChanges ? '20px' : '0' }}>
          {/* Delivery Charge Input Card */}
          <div
            style={{
              backgroundColor: '#050505',
              border: '1px solid #141414',
              borderRadius: '6px',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: '9px', color: '#888', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Delivery Charge
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', color: '#aaa', fontWeight: 'bold' }}>৳</span>
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
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%',
                  fontFamily: 'monospace',
                  cursor: 'text',
                }}
              />
            </div>
          </div>

          {/* VAT Rate Input Card */}
          <div
            style={{
              backgroundColor: '#050505',
              border: '1px solid #141414',
              borderRadius: '6px',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: '9px', color: '#888', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              VAT Rate
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%',
                  fontFamily: 'monospace',
                  cursor: 'text',
                }}
              />
              <span style={{ fontSize: '15px', color: '#aaa', fontWeight: 'bold' }}>%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Save / Cancel) trigger dynamically when input values change */}
        {hasChanges && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              style={{
                backgroundColor: 'transparent',
                color: '#888',
                border: '1px solid #333',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={isSaving}
              style={{
                backgroundColor: '#2ecc71',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 20px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
