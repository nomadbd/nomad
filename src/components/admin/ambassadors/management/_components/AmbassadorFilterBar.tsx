import React from 'react';

interface AmbassadorFilterBarProps {
  sortOrder: 'NEWEST' | 'OLDEST';
  setSortOrder: (order: 'NEWEST' | 'OLDEST') => void;
}

export const AmbassadorFilterBar: React.FC<AmbassadorFilterBarProps> = ({
  sortOrder,
  setSortOrder,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', padding: '12px 14px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '1px' }}>SORT BY:</span>
        {(['NEWEST', 'OLDEST'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSortOrder(opt)}
            style={{
              backgroundColor: 'transparent',
              color: sortOrder === opt ? '#2997ff' : '#71717a',
              border: 'none',
              fontSize: '10px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              fontWeight: sortOrder === opt ? 'bold' : 'normal',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
