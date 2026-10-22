import React from 'react';

interface LogisticsSettingsModalProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  initialDeliveryCharge: number | string;
  initialVatRate: number | string;
  isEditing: boolean;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onStartEdit: () => void;
  onSaveSettings: () => void;
  onCancel: () => void;
}

export default function LogisticsSettingsModal({
  deliveryCharge,
  vatRate,
  initialDeliveryCharge,
  initialVatRate,
  isEditing,
  isSaving,
  onDeliveryChange,
  onVatChange,
  onStartEdit,
  onSaveSettings,
  onCancel,
}: LogisticsSettingsModalProps) {
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
            STORE CHARGES & TAXES
          </h3>
          {!isEditing && (
            <button
              onClick={onStartEdit}
              style={{
                backgroundColor: '#161616',
                color: '#ccc',
                border: '1px solid #282828',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              EDIT
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
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
                value={isEditing ? deliveryCharge : initialDeliveryCharge}
                onChange={(e) => onDeliveryChange(e.target.value)}
                disabled={!isEditing}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%',
                  fontFamily: 'monospace',
                  cursor: isEditing ? 'text' : 'default',
                }}
              />
            </div>
          </div>

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
                step="0.01"
                value={isEditing ? vatRate : initialVatRate}
                onChange={(e) => onVatChange(e.target.value)}
                disabled={!isEditing}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%',
                  fontFamily: 'monospace',
                  cursor: isEditing ? 'text' : 'default',
                }}
              />
              <span style={{ fontSize: '15px', color: '#aaa', fontWeight: 'bold' }}>%</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
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
