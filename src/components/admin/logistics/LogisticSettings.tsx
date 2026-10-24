import React, { useState, useEffect, useRef } from 'react';

interface LogisticsSettingsProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  initialDeliveryCharge?: number | string;
  initialVatRate?: number | string;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onSaveSettings: () => void;
  onCancel: () => void;
}

export default function LogisticSettings({
  deliveryCharge,
  vatRate,
  isSaving,
  onDeliveryChange,
  onVatChange,
  onSaveSettings,
  onCancel,
}: LogisticsSettingsProps) {
  const [localDelivery, setLocalDelivery] = useState('');
  const [localVat, setLocalVat] = useState('');

  const baseDeliveryRef = useRef(deliveryCharge);
  const baseVatRef = useRef(vatRate);

  useEffect(() => {
    if (deliveryCharge !== '' && baseDeliveryRef.current === '') {
      baseDeliveryRef.current = deliveryCharge;
    }
  }, [deliveryCharge]);

  useEffect(() => {
    if (vatRate !== '' && baseVatRef.current === '') {
      baseVatRef.current = vatRate;
    }
  }, [vatRate]);

  const handleDeliveryInput = (val: string) => {
    setLocalDelivery(val);
    onDeliveryChange(val);
  };

  const handleVatInput = (val: string) => {
    setLocalVat(val);
    onVatChange(val);
  };

  const currentInitialDelivery = baseDeliveryRef.current !== '' ? baseDeliveryRef.current : deliveryCharge;
  const currentInitialVat = baseVatRef.current !== '' ? baseVatRef.current : vatRate;

  const isDeliveryChanged = localDelivery !== '' && String(localDelivery) !== String(currentInitialDelivery);
  const isVatChanged = localVat !== '' && String(localVat) !== String(currentInitialVat);
  const hasChanges = isDeliveryChanged || isVatChanged;

  const handleCustomSave = () => {
    baseDeliveryRef.current = localDelivery !== '' ? localDelivery : currentInitialDelivery;
    baseVatRef.current = localVat !== '' ? localVat : currentInitialVat;
    setLocalDelivery('');
    setLocalVat('');
    onSaveSettings();
  };

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
            justifyContent: 'space-between',
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
              onClick={handleCustomSave}
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
              justifyContent: 'space-between',
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
                value={localDelivery}
                placeholder={String(currentInitialDelivery)}
                onChange={(e) => handleDeliveryInput(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '100px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
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
                value={localVat}
                placeholder={String(currentInitialVat)}
                onChange={(e) => handleVatInput(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  textAlign: 'right',
                  width: '100px',
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
