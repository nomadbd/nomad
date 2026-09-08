interface AmbassadorProps {
  ambassadorData: any;
  profile: any;
}

export default function Ambassador({ ambassadorData, profile }: AmbassadorProps) {
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '2px', textTransform: 'uppercase' }}>VIP PARTNER</span>
        <h2 style={{ fontSize: '18px', margin: '4px 0 16px 0', fontWeight: '500', letterSpacing: '1px' }}>AMBASSADOR DASHBOARD</h2>

        <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px' }}>STATUS</p>
        <p style={{ margin: '4px 0 16px 0', fontSize: '15px', color: '#4edf4e', fontWeight: 'bold' }}>ACTIVE PARTNER</p>

        <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px' }}>RECIPIENT ID</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#fff' }}>{ambassadorData?.recipient_identifier || profile?.email}</p>
      </div>

      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '24px', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>CONCIERGE & SUPPORT</h4>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', margin: 0 }}>
          Welcome to your exclusive Ambassador portal. For partner inquiries or payout updates, contact your concierge admin directly.
        </p>
      </div>
    </div>
  );
}
