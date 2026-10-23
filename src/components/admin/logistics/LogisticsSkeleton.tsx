import React from 'react';

export default function LogisticsSkeleton() {
  return (
    <div style={{ borderBottom: '1px solid #1f1f1f', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
      
      {/* LEFT COLUMN SKELETON (3 ROWS) */}
      <div style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Row 1: ID Placeholder */}
        <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '110px', height: '13px', backgroundColor: '#2a2a2a', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
        </div>

        {/* Row 2: Date Placeholder */}
        <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '140px', height: '10px', backgroundColor: '#222222', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
        </div>

        {/* Row 3: Courier & Quantity Placeholder */}
        <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '90px', height: '11px', backgroundColor: '#222222', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
        </div>
      </div>

      {/* RIGHT COLUMN SKELETON (3 ROWS) */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
        {/* Row 1: Status Badge Placeholder */}
        <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '18px', backgroundColor: '#2a2a2a', borderRadius: '12px', animation: 'pulse 1.2s infinite' }} />
        </div>

        {/* Row 2: Date Placeholder */}
        <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '70px', height: '10px', backgroundColor: '#222222', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
        </div>

        {/* Row 3: Time Placeholder */}
        <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '10px', backgroundColor: '#222222', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
