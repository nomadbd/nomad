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
    // 1. Mandatory Note Check for Received Status
    if (activeStatus === 'Received' && !noteValue.trim()) {
      alert('Please enter a note before marking as Received.');
      return;
    }

    // 2. Confirmation Check
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
            <span style={{ fontSize: '9px', color: '#888' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>

          {/* Creation Date & Time (Ujjwal Gray) */}
          <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>
            {new Date(item.created_at).toLocaleString()}
          </div>

          {/* Courier Name & Quantity Only */}
          <div style={{ fontSize: '11px', color: '#ccc', fontWeight: '600', marginTop: '2px' }}>
            {item.courier_name || 'No Courier'} • {totalItemCount}
          </div>
        </div>

        {/* Status Badge & Received Timestamp (Ujjwal Gray) */}
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
              {/* Bright Gray (Ujjwal Gray) Received Time display right below the Badge */}
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

            {/* Custom Radio Selector or Simple Received Text */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
              {isAlreadyReceived ? (
                <div style={{ color: '#27ae60', fontSize: '11px', fontWeight: '600' }}>
                  Received
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Pending' ? '#e67e22' : '#888', fontWeight: '500' }}>
                    <input
                      type="radio"
                      name={`status-${item.id}`}
                      checked={activeStatus === 'Pending'}
                      onChange={() => onSelectStatus(item.id, 'Pending')}
                      style={{ accentColor: '#e67e22', cursor: 'pointer', width: '12px', height: '12px' }}
                    />
                    Pending
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: activeStatus === 'Received' ? '#27ae60' : '#888', fontWeight: '500' }}>
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
              )}
            </div>
          </div>

          {/* Cancel Reason Section */}
          {item.return_reason && (
            <div style={{ marginTop: '4px', borderTop: '1px solid #141414', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: '#888', fontWeight: '500', marginBottom: '2px' }}>
                Cancel Reason:
              </div>
              <div style={{ fontSize: '11px', color: '#e67e22', borderBottom: '1px solid #1a1a1a', paddingBottom: '4px' }}>
                {item.return_reason}
              </div>
            </div>
          )}

          {/* Mandatory Logistics Note Section */}
          <div style={{ marginTop: '2px', borderTop: '1px solid #141414', paddingTop: '8px' }}>
            {initialNote ? (
              /* PERMANENT LOCKED NOTE DISPLAY */
              <div style={{ fontSize: '11px', color: '#e0e0e0', fontFamily: 'sans-serif' }}>
                <span style={{ color: '#aaa', fontWeight: '500' }}>Note: </span>
                {initialNote}
              </div>
            ) : (
              /* INITIAL INPUT BEFORE FIRST SAVE (MANDATORY) */
              <input
                type="text"
                value={noteValue}
                onChange={(e) => onNoteChange(item.id, e.target.value)}
                placeholder="Write a note here (Required to receive)..."
                disabled={isAlreadyReceived}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#e0e0e0',
                  border: 'none',
                  borderBottom: '1px solid #333',
                  borderRadius: '0',
                  padding: '4px 0',
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
