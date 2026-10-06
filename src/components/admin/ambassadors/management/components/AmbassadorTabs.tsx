import React from 'react';

interface AmbassadorTabsProps {
  activeSubTab: 'AMBASSADORS' | 'PAYOUTS';
  setActiveSubTab: (tab: 'AMBASSADORS' | 'PAYOUTS') => void;
  ambassadorCount: number;
  pendingPayoutCount: number;
}

export const AmbassadorTabs: React.FC<AmbassadorTabsProps> = ({
  activeSubTab,
  setActiveSubTab,
  ambassadorCount,
  pendingPayoutCount,
}) => {
  return (
    <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px', paddingBottom: '2px' }}>
      <button
        type="button"
        onClick={() => setActiveSubTab('AMBASSADORS')}
        style={{
          backgroundColor: 'transparent',
          color: activeSubTab === 'AMBASSADORS' ? '#ffffff' : '#666',
          border: 'none',
          borderBottom: activeSubTab === 'AMBASSADORS' ? '2px solid #2997ff' : '2px solid transparent',
          padding: '6px 0',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: '1px',
          cursor: 'pointer',
        }}
      >
        AMBASSADORS ({ambassadorCount})
      </button>

      <button
        type="button"
        onClick={() => setActiveSubTab('PAYOUTS')}
        style={{
          backgroundColor: 'transparent',
          color: activeSubTab === 'PAYOUTS' ? '#ffffff' : '#666',
          border: 'none',
          borderBottom: activeSubTab === 'PAYOUTS' ? '2px solid #2997ff' : '2px solid transparent',
          padding: '6px 0',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: '1px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        PAYOUT REQUESTS
        {pendingPayoutCount > 0 && (
          <span style={{ backgroundColor: '#e3a008', color: '#000', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
            {pendingPayoutCount}
          </span>
        )}
      </button>
    </div>
  );
};
