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
    <div style={{ borderBottom: '1px solid #1a1a1a' }}>
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
            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
              #{item.id.substring(0, 8)} ...
            </span>
            <span style={{ fontSize: '10px', color: '#888' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>

          {/* Date & Time */}
          <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>

          {/* Courier Name & Total Items Count */}
          <div style={{ fontSize: '11px', color: '#ccc', fontWeight: '600', marginTop: '2px' }}>
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
                backgroundColor: '#111',
                color: '#fff',
                border: '1px solid #ffffff',
                padding: '5px 16px',
                fontSize: '10px',
                fontWeight: '600',
                borderRadius: '20px', // ডিম্বাকার / Pill Shape
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 0 5px rgba(255,255,255,0.2)',
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
                padding: '4px 10px',
                fontSize: '10px',
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
            backgroundColor: '#0a0a0a',
            borderTop: '1px solid #141414',
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
                  <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ color: '#ddd', fontSize: '11px', fontWeight: '500' }}>
                      {prod.product_name || 'Product'}
                    </div>
                    <div style={{ color: '#888', fontSize: '10px' }}>
                      {[prod.size && `Size: ${prod.size}`, prod.color && `Color: ${prod.color}`, `Qty: ${prod.quantity}`]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#555', fontSize: '10px' }}>No products found</div>
              )}

              {/* Reason from Order Management */}
              {item.return_reason && (
                <div style={{ color: '#e74c3c', fontSize: '10px', marginTop: '4px' }}>
                  Cancel Reason: {item.return_reason}
                </div>
              )}
            </div>

            {/* Custom Styled Status Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Pending' ? '#f39c12' : '#777' }}>
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={activeStatus === 'Pending'}
                  onChange={() => onSelectStatus(item.id, 'Pending')}
                  style={{ accentColor: '#f39c12', cursor: 'pointer' }}
                />
                Pending
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Received' ? '#2ecc71' : '#777' }}>
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={activeStatus === 'Received'}
                  onChange={() => onSelectStatus(item.id, 'Received')}
                  style={{ accentColor: '#2ecc71', cursor: 'pointer' }}
                />
                Received
              </label>
            </div>
          </div>

          {/* Logistics Note Input */}
          <div style={{ marginTop: '4px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
              Logistics Note (Optional):
            </label>
            <textarea
              rows={2}
              value={noteValue}
              onChange={(e) => onNoteChange(item.id, e.target.value)}
              placeholder="e.g. Received in good condition / Packaging damaged"
              style={{
                width: '100%',
                backgroundColor: '#121212',
                color: '#ccc',
                border: '1px solid #222',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '11px',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
