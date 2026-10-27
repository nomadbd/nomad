import React, { useState, useEffect, useRef } from 'react';
import LogisticsHistory from './LogisticsHistory';

interface LogisticsSettingsProps {
  deliveryCharge: number | string;
  vatRate: number | string;
  initialDeliveryCharge?: number | string;
  initialVatRate?: number | string;
  isSaving: boolean;
  onDeliveryChange: (val: string) => void;
  onVatChange: (val: string) => void;
  onSaveSettings: () => void;
  onCancel?: () => void;
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
}: LogisticsSettingsProps) {
  const [localDelivery, setLocalDelivery] = useState('');
  const [localVat, setLocalVat] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const baseDelivery = initialDeliveryCharge !== undefined ? initialDeliveryCharge : deliveryCharge;
  const baseVat = initialVatRate !== undefined ? initialVatRate : vatRate;

  const prevIsSaving = useRef(isSaving);
  useEffect(() => {
    if (prevIsSaving.current && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
        setLocalDelivery('');
        setLocalVat('');
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevIsSaving.current = isSaving;
  }, [isSaving]);

  const hasChanges = localDelivery !== '' || localVat !== '';
  const shouldShowButton = hasChanges || isSaving || showSaved;

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
        backgroundColor: '#222228',
        border: '1px solid #363642',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes pulseDot {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid #30303b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#b0b0bc',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Logistics
          </span>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              transition: 'color 0.2s',
            }}
            title="View Logistics History"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={onSaveSettings}
          disabled={isSaving || showSaved || !hasChanges}
          style={{
            backgroundColor: showSaved ? '#10b981' : hasChanges ? '#ffffff' : '#3a3a46',
            color: showSaved ? '#ffffff' : hasChanges ? '#000000' : '#888898',
            border: 'none',
            borderRadius: '20px',
            width: '88px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.8px',
            cursor: hasChanges && !isSaving && !showSaved ? 'pointer' : 'default',
            visibility: shouldShowButton ? 'visible' : 'hidden',
            opacity: shouldShowButton ? 1 : 0,
            pointerEvents: shouldShowButton ? 'auto' : 'none',
            transition: 'opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease, color 0.2s ease',
          }}
        >
          {isSaving ? (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out' }}></span>
              <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out 0.2s' }}></span>
              <span style={{ width: '5px', height: '5px', backgroundColor: '#000', borderRadius: '50%', animation: 'pulseDot 1.2s infinite ease-in-out 0.4s' }}></span>
            </div>
          ) : showSaved ? (
            'SAVED'
          ) : (
            'SAVE'
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '500' }}>
            Shipping Fee
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#2c2c35',
              border: '1px solid #444452',
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
              placeholder={String(baseDelivery ?? '')}
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
            <span style={{ fontSize: '13px', color: '#c0c0cc', marginLeft: '6px', fontWeight: '600' }}>৳</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '500' }}>
            VAT Rate
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#2c2c35',
              border: '1px solid #444452',
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
              placeholder={String(baseVat ?? '')}
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
            <span style={{ fontSize: '13px', color: '#c0c0cc', marginLeft: '6px', fontWeight: '600' }}>%</span>
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <LogisticsHistory onBack={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
}
