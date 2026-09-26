import React from 'react';

export default function AmbassadorSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #262626',
            padding: '16px',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
              {/* Title Bar */}
              <div className="skeleton-pulse" style={{ height: '14px', width: '140px', backgroundColor: '#333333', borderRadius: '2px' }} />
              {/* Subtitle Bar */}
              <div className="skeleton-pulse" style={{ height: '10px', width: '180px', backgroundColor: '#222222', borderRadius: '2px' }} />
            </div>
            {/* Button Placeholder */}
            <div className="skeleton-pulse" style={{ height: '26px', width: '70px', backgroundColor: '#333333', borderRadius: '2px' }} />
          </div>

          {/* Footer Link Bar */}
          <div className="skeleton-pulse" style={{ height: '10px', width: '100%', backgroundColor: '#222222', borderRadius: '2px' }} />
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.95; }
          100% { opacity: 0.3; }
        }
        .skeleton-pulse {
          animation: pulse 1.4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
