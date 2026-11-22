import React from 'react';
import { Order } from './orderTypes';
import { getStepIndex, getUnifiedStatus } from './orderStatusHelpers';

interface OrderCardProps {
  order: Order;
  isManageMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDownloadInvoice: (order: Order) => void;
  onRequestSingleHide: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isManageMode,
  isSelected,
  onToggleSelect,
  onDownloadInvoice,
  onRequestSingleHide,
}) => {
  const dateObj = new Date(order.created_at);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  const hasMultipleItems = order.items && order.items.length > 1;

  const activeStepIndex = getStepIndex(order.status);
  const unifiedStatusText = getUnifiedStatus(order.status);

  const dynamicSteps = ['PENDING', 'RECEIVED', 'SHIPPED', 'DELIVERED'];

  if (activeStepIndex === 1) {
    dynamicSteps[1] = unifiedStatusText;
  }

  return (
    <div
      onClick={() => {
        if (isManageMode) {
          onToggleSelect(order.id);
        }
      }}
      style={{
        backgroundColor: '#050505',
        border: isSelected ? '1px solid #fff' : '1px solid #222',
        padding: '25px 0px 25px 25px',
        position: 'relative',
        opacity: isManageMode && !isSelected ? 0.5 : 1,
        cursor: isManageMode ? 'pointer' : 'default',
        userSelect: isManageMode ? 'none' : 'auto',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '25px' }}>
        <div>
          <button
            onClick={(e) => {
              if (isManageMode) {
                onToggleSelect(order.id);
              } else {
                e.stopPropagation();
                onDownloadInvoice(order);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isManageMode ? '#444' : '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'none',
              textTransform: 'uppercase',
              outline: 'none',
              transition: 'color 0.2s ease',
            }}
          >
            DOWNLOAD INVOICE
          </button>
        </div>
        <div>
          {isManageMode ? (
            <div
              style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '2px solid #fff' : '2px solid #555', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
            >
              {isSelected && <span style={{ color: '#000', fontSize: '11px', fontWeight: '900' }}>✓</span>}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestSingleHide(order.id);
              }}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', transition: 'color 0.2s ease' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div
        className="premium-carousel"
        style={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          gap: '20px',
          marginBottom: '25px',
          paddingRight: '25px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {order.items.map((item, index) => (
          <div
            key={index}
            style={{
              flex: '0 0 auto',
              width: hasMultipleItems ? '82%' : '100%',
              minWidth: hasMultipleItems ? '82%' : '100%',
              borderRight: hasMultipleItems && index !== order.items.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              paddingRight: hasMultipleItems && index !== order.items.length - 1 ? '20px' : '0',
              boxSizing: 'border-box',
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
            }}
          >
            <img
              src={item.product_image}
              alt={item.product_name}
              style={{
                width: '60px',
                height: '75px',
                objectFit: 'cover',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
              }}
            />
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textTransform: 'uppercase' }}>
                {item.product_name}
              </h4>

              <div className="order-item-attrs">
                <span className="attr-text">
                  SIZE: <span className="attr-val">{item.size}</span>
                </span>

                <span className="attr-dot"></span>

                <span className="attr-text">
                  QTY: <span className="attr-val">{item.quantity}</span>
                </span>

                <span className="attr-dot dot-desktop-only"></span>

                <span className="attr-text attr-color">
                  COLOR: <span className="attr-val">{item.color}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', paddingRight: '25px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>TOTAL AMOUNT</span>
          <span style={{ fontSize: '18px', color: '#fff', fontWeight: '800', fontFamily: 'monospace' }}>
            ৳{order.total_amount}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>ISSUED DATE</span>
          <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace', letterSpacing: '0.5px', fontWeight: 'bold' }}>
            {formattedDate}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px', paddingRight: '25px' }}>
        {dynamicSteps.map((stepText, idx) => {
          const isCompleted = idx <= activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#fff' : 'transparent',
                border: isCompleted ? '2px solid #fff' : '2px solid #444',
                boxShadow: isCurrent ? '0 0 10px rgba(255,255,255,0.6)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                {isCompleted && (
                  <span style={{ color: '#000', fontSize: '9px', fontWeight: '900', lineHeight: 1 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: '9px', letterSpacing: '0.5px', marginTop: '10px', color: isCompleted ? '#fff' : '#888', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderCard;
