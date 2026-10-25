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

  const baseDelivery = initialDeliveryCharge !== undefined ? initialDeliveryCharge : deliveryCharge;
  const baseVat = initialVatRate !== undefined ? initialVatRate : vatRate;

  // সেভ সফল হওয়ার পর সাময়িকভাবে 'SAVED' দেখানোর লজিক
  const prevIsSaving = useRef(isSaving);
  useEffect(() => {
    if (prevIsSaving.current && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
        setLocalDelivery('');
        setLocalVat('');
      }, 1500); // ১.৫ সেকেন্ড পর রিসেট হবে
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
      }}
    >
      {/* Header Section: LOGISTICS & Fixed-size Pill Button */}
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

        {/* ফিক্সড সাইজ এবং সুষম শব্দবিন্যাস (SAVE -> SAVING -> SAVED) */}
        <button
          type="button"
          onClick={onSaveSettings}
          disabled={isSaving || showSaved || !hasChanges}
          style={{
            backgroundColor: showSaved ? '#10b981' : '#ffffff', // সফল হলে সফট গ্রীন, অন্যথায় সাদা
            color: showSaved ? '#ffffff' : '#000000',
            border: 'none',
            borderRadius: '20px',
            width: '88px', // নির্দিষ্ট ফিক্সড উইডথ
            height: '26px', // নির্দিষ্ট ফিক্সড হাইট
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.8px', // অক্ষরগুলোর মধ্যে প্রিমিয়াম স্পেসিং
            cursor: hasChanges && !isSaving && !showSaved ? 'pointer' : 'default',
            visibility: shouldShowButton ? 'visible' : 'hidden',
            opacity: shouldShowButton ? 1 : 0,
            transition: 'background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease',
          }}
        >
          {isSaving ? 'SAVING' : showSaved ? 'SAVED' : 'SAVE'}
        </button>
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

        {/* VAT Rate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
    </div>
  );
}
