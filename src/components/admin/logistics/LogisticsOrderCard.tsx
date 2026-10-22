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
  noteValue: string;
  onNoteChange: (orderId: string, note: string) => void;
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
  noteValue,
  onNoteChange,
  onToggleExpand,
  onSelectStatus,
  onStatusUpdate,
  pendingStatus,
}: LogisticsOrderCardProps) {
  const totalItemCount = item.order_items
    ? item.order_items.reduce((sum, prod) => sum + (Number(prod.quantity) || 0), 0)
    : 0;

  const initialNote = item.admin_notes || '';
  const isNoteChanged = noteValue !== initialNote;
  const canSave = hasChange || isNoteChanged;

  return (
    <div style={{ borderBottom: '1px solid #141414' }}>
      {/* MAIN UNEXPANDED CARD */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            <span style={{ fontWeight: '700', color: '#e5e5e5', fontSize: '13px', fontFamily: 'monospace' }}>
              #{item.id.substring(0, 8)} ...
            </span>
            <span style={{ fontSize: '9px', color: '#666' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>

          {/* Date & Time */}
          <div style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>

          {/* Courier Name & Total Items Count */}
          <div style={{ fontSize: '11px', color: '#b0b0b0', fontWeight: '600', marginTop: '2px' }}>
            {item.courier_name || 'No Courier'} • {totalItemCount} {totalItemCount > 1 ? 'Items' : 'Item'}
          </div>
        </div>

        {/* Status Badge / Pill-Shaped White SAVE Button */}
        <div style={{ flexShrink: 0 }}>
          {canSave ? (
            <button
              onClick={() => onStatusUpdate(item.id, activeStatus)}
              disabled={isSavingThis}
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: '1px solid #e5e5e5',
                padding: '4px 14px',
                fontSize: '10px',
                fontWeight: '600',
                borderRadius: '20px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
              }}
            >
              {isSavingThis ? 'SAVING...' : 'SAVE'}
            </button>
          ) : (
            <div
              style={{
                backgroundColor: '#0d0d0d',
                color: currentStatus === 'Received' ? '#27ae60' : '#e67e22',
                border: '1px solid #1c1c1c',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: '500',
                borderRadius: '12px',
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
            backgroundColor: '#080808',
            borderTop: '1px solid #121212',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            {/* Detailed Product List */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {item.order_items && item.order_items.length > 0 ? (
                item.order_items.map((prod) => (
                  <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: '600', fontFamily: 'sans-serif' }}>
                      {prod.product_name || 'Product'}
                    </div>
                    <div style={{ color: '#b0b0b0', fontSize: '10.5px', fontWeight: '600', fontFamily: 'sans-serif' }}>
                      {[
                        prod.size && `Size: ${prod.size}`,
                        prod.color && `Color: ${prod.color}`,
                        `Qty: ${prod.quantity}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#555', fontSize: '10px' }}>No products found</div>
              )}

              {/* Cancel Reason from Order Management */}
              {item.return_reason && (
                <div style={{ color: '#d9534f', fontSize: '10.5px', marginTop: '2px', fontFamily: 'sans-serif' }}>
                  Cancel Reason: {item.return_reason}
                </div>
              )}
            </div>

            {/* Radio Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Pending' ? '#e67e22' : '#666', fontWeight: '500' }}>
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={activeStatus === 'Pending'}
                  onChange={() => onSelectStatus(item.id, 'Pending')}
                  style={{ accentColor: '#e67e22', cursor: 'pointer', width: '12px', height: '12px' }}
                />
                Pending
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Received' ? '#27ae60' : '#666', fontWeight: '500' }}>
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={activeStatus === 'Received'}
                  onChange={() => onSelectStatus(item.id, 'Received')}
                  style={{ accentColor: '#27ae60', cursor: 'pointer', width: '12px', height: '12px' }}
                />
                Received
              </label>
            </div>
          </div>

          {/* Logistics Note Section (LOCKED AFTER SAVE) */}
          <div style={{ marginTop: '6px', borderTop: '1px solid #141414', paddingTop: '8px' }}>
            {initialNote ? (
              /* PERMANENT LOCKED NOTE DISPLAY */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '11px', color: '#d1d1d1', fontFamily: 'sans-serif' }}>
                  <span style={{ color: '#888', fontWeight: '500' }}>Note: </span>
                  {initialNote}
                </div>
                <div style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>
                  Saved on {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              /* INITIAL INPUT BEFORE FIRST SAVE */
              <input
                type="text"
                value={noteValue}
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                placeholder="Write a note here..."
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#d1d1d1',
                  border: 'none',
                  borderBottom: '1px solid #262626',
                  borderRadius: '0',
                  padding: '4px 0',
                  fontSize: '11px',
                  outline: 'none',
                  fontFamily: 'sans-serif',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
