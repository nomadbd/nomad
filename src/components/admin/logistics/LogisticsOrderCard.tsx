import React from 'react';
import { OrderItem } from '@/hooks/useAdminLogistics';

interface LogisticsOrderCardProps {
  item: OrderItem;
  isExpanded: boolean;
  currentStatus: string;
  pendingStatus?: string;
  activeStatus: string;
  hasChange: boolean;
  isSavingThis: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onSelectStatus: (orderId: string, status: string) => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export default function LogisticsOrderCard({
  item,
  isExpanded,
  currentStatus,
  activeStatus,
  hasChange,
  isSavingThis,
  isSelected,
  onToggleSelect,
  onToggleExpand,
  onSelectStatus,
  onStatusUpdate,
  pendingStatus,
}: LogisticsOrderCardProps) {
  const getWhatsAppLink = (phone?: string | null) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/[^\d+]/g, '');
    const formatted = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
    return `https://wa.me/${formatted}`;
  };

  const actionButtonStyle: React.CSSProperties = {
    backgroundColor: '#111',
    color: '#ccc',
    border: '1px solid #222',
    padding: '4px 8px',
    fontSize: '9.5px',
    borderRadius: '3px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: isSelected ? '#0d1117' : 'transparent' }}>
      {/* MAIN UNEXPANDED CARD */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        
        {/* Selection Checkbox & Details */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            style={{ accentColor: '#2ecc71', cursor: 'pointer', marginTop: '3px' }}
          />

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Header ID & Arrow */}
            <div
              onClick={() => onToggleExpand(item.id)}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
                #{item.id.substring(0, 8)} ...
              </span>
              <span style={{ fontSize: '10px', color: '#888' }}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>

            <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
              {new Date(item.created_at).toLocaleString()}
            </div>

            {/* Customer Main Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                {item.customer_name || 'No Name'}
              </div>
              {item.customer_phone && (
                <div style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>
                  {item.customer_phone}
                </div>
              )}
              {item.customer_email && (
                <div style={{ fontSize: '10px', color: '#777' }}>
                  {item.customer_email}
                </div>
              )}
            </div>

            {/* Quick Action Buttons (Same Line) */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'nowrap' }}>
              {item.customer_phone && (
                <>
                  <a href={`tel:${item.customer_phone}`} style={actionButtonStyle}>
                    Call
                  </a>
                  <a
                    href={getWhatsAppLink(item.customer_phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={actionButtonStyle}
                  >
                    WhatsApp
                  </a>
                </>
              )}
              {item.customer_email && (
                <a href={`mailto:${item.customer_email}`} style={actionButtonStyle}>
                  Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge / Save Button */}
        <div style={{ flexShrink: 0 }}>
          {hasChange ? (
            <button
              onClick={() => pendingStatus && onStatusUpdate(item.id, pendingStatus)}
              disabled={isSavingThis}
              style={{
                backgroundColor: '#2ecc71',
                color: '#060606',
                border: 'none',
                padding: '5px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '3px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              {isSavingThis ? 'SAVING...' : 'SAVE'}
            </button>
          ) : (
            <div
              style={{
                backgroundColor: '#111',
                color: currentStatus === 'Received' ? '#2ecc71' : '#f39c12',
                border: '1px solid #222',
                padding: '4px 8px',
                fontSize: '10px',
                borderRadius: '3px',
              }}
            >
              {currentStatus}
            </div>
          )}
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: '#0a0a0a',
            borderTop: '1px solid #141414',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontWeight: '600', color: '#fff', fontSize: '12px' }}>
              Courier: {item.courier_name || '—'}
            </div>

            {item.order_items && item.order_items.length > 0 ? (
              item.order_items.map((prod) => (
                <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  <div style={{ color: '#ddd', fontSize: '11px', fontWeight: '500' }}>
                    {prod.product_name || 'Product'}
                  </div>
                  <div style={{ color: '#888', fontSize: '10px' }}>
                    {[prod.size, prod.color, `Qty: ${prod.quantity}`].filter(Boolean).join(' • ')}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#555', fontSize: '10px' }}>No products found</div>
            )}

            {item.return_reason && (
              <div style={{ color: '#e74c3c', fontSize: '10px', marginTop: '4px' }}>
                Reason: {item.return_reason}
              </div>
            )}
          </div>

          {/* Status Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingTop: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#f39c12' }}>
              <input
                type="checkbox"
                checked={activeStatus === 'Pending'}
                onChange={() => onSelectStatus(item.id, 'Pending')}
                style={{ accentColor: '#f39c12', cursor: 'pointer' }}
              />
              Pending
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#2ecc71' }}>
              <input
                type="checkbox"
                checked={activeStatus === 'Received'}
                onChange={() => onSelectStatus(item.id, 'Received')}
                style={{ accentColor: '#2ecc71', cursor: 'pointer' }}
              />
              Received
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
