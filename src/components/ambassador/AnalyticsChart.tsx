import React from 'react';

interface AnalyticsChartProps {
  totalEarned: number;
}

export default function AnalyticsChart({ totalEarned }: AnalyticsChartProps) {
  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      border: '1px solid #222',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 500 }}>Performance & Revenue Growth</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>Lifetime earnings representation</p>
        </div>
        <span style={{ fontSize: '12px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
          Active Stream
        </span>
      </div>

      <div style={{ height: '140px', width: '100%', position: 'relative' }}>
        <svg viewBox="0 0 500 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 100 Q 125 80, 250 50 T 500 20 L 500 120 L 0 120 Z"
            fill="url(#chartGradient)"
          />
          <path
            d="M 0 100 Q 125 80, 250 50 T 500 20"
            fill="none"
            stroke="#d4af37"
            strokeWidth="3"
          />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#555', fontSize: '11px' }}>
        <span>Start</span>
        <span>Mid Term</span>
        <span>Current (৳{totalEarned || 0})</span>
      </div>
    </div>
  );
}
