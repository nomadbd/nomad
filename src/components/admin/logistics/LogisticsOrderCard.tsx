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
      {/* MAIN UNEXPANDED CARD - PERFECT GRID ALIGNMENT */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        
        {/* LEFT COLUMN (3 EXACT ROWS) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Line 1: Header ID & Arrow */}
          <div
            onClick={() => onToggleExpand(item.id)}
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '20px', // Fixed Row Height for Exact Alignment
            }}
          >
            <span style={{ fontWeight: '700', color: '#e5e5e5', fontSize: '13px', fontFamily: 'monospace', lineHeight: '20px' }}>
              #{item.id.substring(0, 8)} ...
            </span>
            <span style={{ fontSize: '9px', color: '#aaa', lineHeight: '20px' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>

          {/* Line 2: Creation Date & Time */}
          <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', height: '16px', lineHeight: '16px' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>

          {/* Line 3: Courier Name & Quantity */}
          <div style={{ fontSize: '11px', color: '#ccc', fontWeight: '600', fontFamily: 'monospace', height: '16px', lineHeight: '16px' }}>
            {item.courier_name || 'No Courier'} • {totalItemCount}
          </div>
        </div>

        {/* RIGHT COLUMN (3 EXACT ROWS - MATCHES LEFT POSITIONS PERFECTLY) */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          {canSave ? (
            <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={handleConfirmSave}
                disabled={isSavingThis}
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #e5e5e5',
                  padding: '2px 12px',
                  fontSize: '10px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  height: '20px',
                  lineHeight: '1',
                }}
              >
                {isSavingThis ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          ) : (
            <>
              {/* Line 1: Status Badge Aligned with ID */}
              <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    backgroundColor: '#0d0d0d',
                    color: isAlreadyReceived ? '#27ae60' : '#e67e22',
                    border: '1px solid #1c1c1c',
                    padding: '2px 10px',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    lineHeight: '1',
                  }}
                >
                  {currentStatus}
                </div>
              </div>

              {/* Line 2: Received Date (Matches Left Line 2 Height & Position) */}
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', height: '16px', lineHeight: '16px' }}>
                {isAlreadyReceived ? new Date().toLocaleDateString() : '-'}
              </div>

              {/* Line 3: Received Time (Matches Left Line 3 Height & Position) */}
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', height: '16px', lineHeight: '16px' }}>
                {isAlreadyReceived ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: '#080808',
            borderTop: '1px solid #121212',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
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
