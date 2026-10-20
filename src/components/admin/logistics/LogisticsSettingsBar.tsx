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
    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '8px',
          backgroundColor: '#060606',
          padding: '8px 10px',
          border: '1px solid #1a1a1a',
          alignItems: 'center',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flexShrink: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '8px',
              color: '#888',
              display: 'block',
              letterSpacing: '0.5px',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            DELIVERY CHARGE
          </span>
          <input
            type="number"
            value={isEditing ? deliveryCharge : initialDeliveryCharge}
            onChange={(e) => onDeliveryChange(e.target.value)}
            disabled={!isEditing}
            placeholder={String(initialDeliveryCharge)}
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '100%',
              maxWidth: '60px',
              padding: '0',
              fontFamily: 'monospace',
              cursor: isEditing ? 'text' : 'default',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '8px', flexShrink: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '8px',
              color: '#888',
              display: 'block',
              letterSpacing: '0.5px',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            VAT RATE
          </span>
          <input
            type="number"
            step="0.01"
            value={isEditing ? vatRate : initialVatRate}
            onChange={(e) => onVatChange(e.target.value)}
            disabled={!isEditing}
            placeholder={String(initialVatRate)}
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '100%',
              maxWidth: '50px',
              padding: '0',
              fontFamily: 'monospace',
              cursor: isEditing ? 'text' : 'default',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '8px', display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {!isEditing ? (
            <button
              onClick={onStartEdit}
              title="Edit Settings"
              style={{
                backgroundColor: 'transparent',
                color: '#888',
                border: 'none',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
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
                title="Save Settings"
                style={{
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  padding: '5px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                {isSaving ? (
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888' }}>...</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <button
                onClick={onCancel}
                disabled={isSaving}
                title="Cancel"
                style={{
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  padding: '5px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
