import React from 'react';

interface AmbassadorStatsProps {
  unpaidBalance: number;
  totalEarned: number;
}

export default function AmbassadorStats({ unpaidBalance, totalEarned }: AmbassadorStatsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Unpaid Balance</span>
        <h2 style={{ fontSize: '28px', color: '#d4af37', margin: '8px 0 0 0' }}>৳{unpaidBalance}</h2>
      </div>

      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
        <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Earned</span>
        <h2 style={{ fontSize: '28px', color: '#fff', margin: '8px 0 0 0' }}>৳{totalEarned}</h2>
      </div>
    </div>
  );
}
