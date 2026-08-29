import React from 'react';
import { formatNumber } from './adminOverview.utils';

interface FulfillmentStatusCardProps {
  pendingOrders: number;
  receivedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  calcPercent: (val: number) => number;
}

export const FulfillmentStatusCard: React.FC<FulfillmentStatusCardProps> = ({
  pendingOrders,
  receivedOrders,
  processingOrders,
  shippedOrders,
  deliveredOrders,
  cancelledOrders,
  calcPercent,
}) => {
  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#FFB800' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#7C4DFF' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#E040FB' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#00B0FF' },
    { key: 'DELIVERED', label: 'DELIVERED', count: deliveredOrders, color: '#008000' },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#FF5252' },
  ];

  return (
    <div
      className="animate-card"
      style={{
        backgroundColor: '#080808',
        border: '1px solid #222',
        padding: '14px',
        borderRadius: '2px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontSize: '14px',
          color: '#CBD5E0',
          letterSpacing: '1px',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '10px',
        }}
      >
        FULFILLMENT STATUS
      </span>

      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '100%',
          height: '4px',
          backgroundColor: '#181818',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div className="status-bar-segment" style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#FFB800', flexShrink: 0 }} />
        <div className="status-bar-segment" style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#7C4DFF', flexShrink: 0 }} />
        <div className="status-bar-segment" style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#E040FB', flexShrink: 0 }} />
        <div className="status-bar-segment" style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#00B0FF', flexShrink: 0 }} />
        <div className="status-bar-segment" style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#008000', flexShrink: 0 }} />
        <div className="status-bar-segment" style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#FF5252', flexShrink: 0 }} />
      </div>

      <div className="status-grid">
        {statusItems.map((item) => (
          <div key={item.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: item.count === 0 ? '#444' : item.color, fontSize: '10px' }}>●</span>
              <span style={{ fontSize: '12px', color: '#A0AEC0', fontWeight: 'bold' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {formatNumber(item.count)} <span style={{ fontSize: '10px', color: '#718096' }}>({calcPercent(item.count).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
