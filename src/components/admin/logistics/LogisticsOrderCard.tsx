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
}: LogisticsOrderCardProps) {
  const totalItemCount = item.order_items
    ? item.order_items.reduce((sum, prod) => sum + (Number(prod.quantity) || 0), 0)
    : 0;

  const initialNote = item.admin_notes || '';
  const isNoteChanged = noteValue !== initialNote;
  const canSave = hasChange || isNoteChanged;

  const isAlreadyReceived = currentStatus === 'Received';

  const handleConfirmSave = () => {
    if (activeStatus === 'Received' && !noteValue.trim()) {
      alert('Please enter a note before marking as Received.');
      return;
    }

    if (activeStatus === 'Received' && !isAlreadyReceived) {
      const confirmAction = window.confirm(
        'Are you sure you want to mark this item as RECEIVED? Once received, stock will be updated and notes will be locked.'
      );
      if (!confirmAction) return;
    }

    onStatusUpdate(item.id, activeStatus);
  };

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

          {/* Creation Date & Time */}
          <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>

          {/* Courier Name & Quantity Only */}
          <div style={{ fontSize: '11px', color: '#ccc', fontWeight: '600', marginTop: '2px' }}>
            {item.courier_name || 'No Courier'} • {totalItemCount}
          </div>
        </div>

        {/* Status Badge & Received Timestamp */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          {canSave ? (
            <button
              onClick={handleConfirmSave}
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
            <>
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  color: isAlreadyReceived ? '#27ae60' : '#e67e22',
                  border: '1px solid #1c1c1c',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: '500',
                  borderRadius: '12px',
                }}
              >
                {currentStatus}
              </div>
              {isAlreadyReceived && (
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '2px' }}>
                  <span style={{ fontSize: '9.5px', color: '#aaa', fontFamily: 'monospace', fontWeight: '500' }}>
                    {new Date().toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EXPANDED SECTION (UNIFIED FLOW WITHOUT LINES) */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: '#080808',
            borderTop: '1px solid #121212',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px', // সুষম গ্যাপ যা প্রতিটি সেকশনকে সুন্দরভাবে আলাদা রাখবে কিন্তু কোনো দাগ লাগবে না
          }}
        >
          {/* Detailed Product List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {item.order_items && item.order_items.length > 0 ? (
              item.order_items.map((prod) => (
                <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ color: '#e0e0e0', fontSize: '12px', fontWeight: '600', fontFamily: 'sans-serif', wordBreak: 'break-word' }}>
                    {prod.product_name || 'Product'}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '10.5px', fontWeight: '600', fontFamily: 'sans-serif' }}>
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
              <div style={{ color: '#777', fontSize: '10px' }}>No products found</div>
            )}
          </div>

          {/* Cancel Reason Section */}
          {item.return_reason && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', color: '#888', fontWeight: '500' }}>
                Cancel Reason:
              </div>
              <div style={{ fontSize: '11px', color: '#e67e22', fontFamily: 'sans-serif' }}>
                {item.return_reason}
              </div>
            </div>
          )}

          {/* Mandatory Logistics Note Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '10px', color: '#888', fontWeight: '500' }}>
              Note:
            </div>
            {initialNote ? (
              <div style={{ fontSize: '11px', color: '#e0e0e0', fontFamily: 'sans-serif' }}>
                {initialNote}
              </div>
            ) : (
              <input
                type="text"
                value={noteValue}
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                placeholder="Write a note here (Required to receive)..."
                disabled={isAlreadyReceived}
                style={{
                  width: '100%',
                  backgroundColor: '#111',
                  color: '#e0e0e0',
                  border: '1px solid #222',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  outline: 'none',
                  fontFamily: 'sans-serif',
                  opacity: isAlreadyReceived ? 0.5 : 1,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
