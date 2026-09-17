import React from 'react';

interface BenefitCardsProps {
  commissionRate: number;
  discountPercent: number;
}

export const BenefitCards: React.FC<BenefitCardsProps> = ({ commissionRate, discountPercent }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={cardStyle}>
        <span style={numberStyle}>01</span>
        <div style={benefitTitleStyle}>CURATED ALLOCATION</div>
        <p style={benefitDescStyle}>Select products from our high-tier ambassador allocation to feature in your private gallery.</p>
      </div>

      <div style={cardStyle}>
        <span style={numberStyle}>02</span>
        <div style={benefitTitleStyle}>AUTOMATED COMMISSIONS</div>
        <p style={benefitDescStyle}>
          Earn a baseline {commissionRate}% payout with real-time performance tracking for every sales conversion. NOMAD reserves the right to dynamically adjust commission structures based on tier performance.
        </p>
      </div>

      <div style={cardStyle}>
        <span style={numberStyle}>03</span>
        <div style={benefitTitleStyle}>PRIVÉ PRIVILEGES</div>
        <p style={benefitDescStyle}>
          Bespoke invitation links offering an initial {discountPercent}% VIP pass for your audience, early release access, and direct portal management. Rates and privileges remain subject to periodic revision at NOMAD’s discretion.
        </p>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
  padding: '12px 16px'
};

const numberStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#888888',
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '2px'
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '4px'
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cccccc',
  margin: 0,
  lineHeight: '1.5',
  fontWeight: 300
};
