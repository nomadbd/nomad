import React from 'react';

interface LogisticsSettingsBarProps {
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

export default function LogisticsSettingsBar({
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
}: LogisticsSettingsBarProps) {
  return (
    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
      <div
        style={{
          flex: 1,
          minWidth: '140px',
          backgroundColor: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: '4px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            color: '#aaa',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontWeight: '600',
          }}
        >
          Delivery Charge
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>৳</span>
          <input
            type="number"
            value={isEditing ? deliveryCharge : initialDeliveryCharge}
            onChange={(e) => onDeliveryChange(e.target.value)}
            disabled={!isEditing}
            placeholder={String(initialDeliveryCharge)}
            style={{
              backgroundColor: 'transparent',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: '700',
              width: '100%',
              padding: '0',
              fontFamily: 'monospace',
              cursor: isEditing ? 'text' : 'default',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: '140px',
          backgroundColor: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: '4px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            color: '#aaa',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            fontWeight: '600',
          }}
        >
          VAT Rate
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <input
            type="number"
            step="0.01"
            value={isEditing ? vatRate : initialVatRate}
            onChange={(e) => onVatChange(e.target.value)}
            disabled={!isEditing}
            placeholder={String(initialVatRate)}
            style={{
              backgroundColor: 'transparent',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: '700',
              width: '100%',
              padding: '0',
              fontFamily: 'monospace',
              cursor: isEditing ? 'text' : 'default',
            }}
          />
          <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {!isEditing ? (
          <button
            onClick={onStartEdit}
            title="Edit Settings"
            style={{
              backgroundColor: '#0a0a0a',
              color: '#b0b0b0',
              border: '1px solid #1f1f1f',
              borderRadius: '4px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={onSaveSettings}
              disabled={isSaving}
              title="Save Changes"
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
              }}
            >
              {isSaving ? '...' : 'SAVE'}
            </button>

            <button
              onClick={onCancel}
              disabled={isSaving}
              title="Cancel"
              style={{
                backgroundColor: '#262626',
                color: '#b0b0b0',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
