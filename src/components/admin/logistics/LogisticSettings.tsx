import React, { useState, useEffect } from 'react';

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
  // লোকাল স্টেট খালি রাখা হয়েছে যাতে বর্তমান মানগুলো প্লেসহোল্ডার হিসেবে কাজ করতে পারে
  const [localDelivery, setLocalDelivery] = useState('');
  const [localVat, setLocalVat] = useState('');

  const baseDelivery = initialDeliveryCharge !== undefined ? initialDeliveryCharge : deliveryCharge;
  const baseVat = initialVatRate !== undefined ? initialVatRate : vatRate;

  // সফলভাবে সেভ হওয়ার পর ইনপুট ফিল্ড রিসেট করার জন্য
  useEffect(() => {
    setLocalDelivery('');
  }, [deliveryCharge]);

  useEffect(() => {
    setLocalVat('');
  }, [vatRate]);

  // ইনপুটে কিছু লেখা মাত্রই সেভ বাটন দেখানোর শর্ত
  const hasChanges = localDelivery !== '' || localVat !== '';

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
        backgroundColor: '#202026', // প্রিমিয়াম ধূসর কার্ড ব্যাকগ্রাউন্ড
        border: '1px solid #32323d',
        borderRadius: '12px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section: LOGISTICS & Pill-shaped Save Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid #2e2e38',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#a0a0ab',
            letterSpacing: '1.2px',
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
              borderRadius: '20px', // নিখুঁত ডিম্বাকার (Pill-shaped) বাটন
              padding: '5px 16px',
              fontSize: '11px',
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
          <label style={{ fontSize: '13px', color: '#e1e1e6', fontWeight: '500' }}>
            Shipping Fee
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#292933',
              border: '1px solid #3f3f4d',
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
            <span style={{ fontSize: '13px', color: '#a0a0ab', marginLeft: '6px', fontWeight: '600' }}>৳</span>
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
          <label style={{ fontSize: '13px', color: '#e1e1e6', fontWeight: '500' }}>
            VAT Rate
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#292933',
              border: '1px solid #3f3f4d',
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
            <span style={{ fontSize: '13px', color: '#a0a0ab', marginLeft: '6px', fontWeight: '600' }}>%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
