import React from 'react';
import AnalyticsChart from './AnalyticsChart';

interface AmbassadorWorkspaceProps {
  ambassadorData: any;
  profile: any;
  ambassadorState: any;
}

export default function AmbassadorWorkspace({
  ambassadorData,
  profile,
  ambassadorState
}: AmbassadorWorkspaceProps) {
  const name = ambassadorData?.recipient_identifier || profile?.full_name || 'Partner';
  const commissionRate = ambassadorData?.commission_rate || 0;
  const discountPercent = ambassadorData?.discount_percent || 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER SECTION */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1f1f1f',
        paddingBottom: '20px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>
            Welcome back, <span style={{ color: '#d4af37' }}>{name}</span> 👋
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ backgroundColor: '#111', border: '1px solid #333', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#aaa' }}>
            Commission: <b style={{ color: '#d4af37' }}>{commissionRate}%</b>
          </span>
          <span style={{ backgroundColor: '#111', border: '1px solid #333', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#aaa' }}>
            Customer Off: <b style={{ color: '#10b981' }}>{discountPercent}%</b>
          </span>
        </div>
      </header>

      {/* METRIC CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
          <span style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Unpaid Balance</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>
            ৳{ambassadorState?.unpaidBalance || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
          <span style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Earned</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4af37', marginTop: '8px' }}>
            ৳{ambassadorState?.totalEarned || 0}
          </div>
        </div>
      </div>

      {/* ANALYTICS GRAPH */}
      <AnalyticsChart totalEarned={ambassadorState?.totalEarned} />

    </div>
  );
}
