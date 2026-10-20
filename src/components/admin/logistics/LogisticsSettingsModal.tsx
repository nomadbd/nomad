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
    <div
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        width: '100%',
        maxWidth: '480px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#888', letterSpacing: '0.8px' }}>
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
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            EDIT
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        <div
          style={{
            backgroundColor: '#050505',
            border: '1px solid #141414',
            borderRadius: '6px',
            padding: '12px 16px',
          }}
        >
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
            DELIVERY CHARGE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>৳</span>
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
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#050505',
            border: '1px solid #141414',
            borderRadius: '6px',
            padding: '12px 16px',
          }}
        >
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '0.8px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
            VAT RATE
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
              }}
            />
            <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>%</span>
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
              border: '1px solid #222',
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
              padding: '8px 18px',
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
  );
}
