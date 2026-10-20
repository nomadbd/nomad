import React from 'react';

interface LogisticsSettingsBarProps {
  activeTab: 'returns' | 'settings';
  setActiveTab: (tab: 'returns' | 'settings') => void;
  returnsCount: number;
}

export default function LogisticsSettingsBar({
  activeTab,
  setActiveTab,
  returnsCount,
}: LogisticsSettingsBarProps) {
  return (
    <div style={{ width: '100%', marginBottom: '20px', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button
          onClick={() => setActiveTab('returns')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px 0 12px 0',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            color: activeTab === 'returns' ? '#fff' : '#555',
            borderBottom: activeTab === 'returns' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}
        >
          RETURNS ({returnsCount})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px 0 12px 0',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            color: activeTab === 'settings' ? '#fff' : '#555',
            borderBottom: activeTab === 'settings' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          SETTINGS
        </button>
      </div>
    </div>
  );
}
