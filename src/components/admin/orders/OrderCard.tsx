import React, { useState, useEffect } from 'react';
import { CheckIcon, CloseIcon, EditIcon, ShareIcon } from '../icons';
import { Order, TEMPLATE_PRESETS, formatWhatsAppNumber, renderPersonalizedText } from '../../utils/messageUtils';

const BD_COURIERS = [
  'Steadfast',
  'Pathao',
  'Paperfly',
  'RedX',
  'Sundarban Express',
  'SA Paribahan',
  'Korotoa',
  'Janani Express',
  'eCourier'
];

export interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (orderId: string) => void;
  onSelectToggle: (orderId: string) => void;
  onOpenStatusModal: (order: Order) => void;
  onUpdateDetails: (orderId: string, updatedData: { payment_status: string; courier_name: string; tracking_id: string; admin_notes: string; customer_notes: string }) => Promise<void>;
  onPrintInvoice: (order: Order) => void;
  getStatusColor: (status: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelectToggle,
  onOpenStatusModal,
  onUpdateDetails,
  onPrintInvoice,
  getStatusColor
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [editForm, setEditForm] = useState({
    payment_status: order.payment_status || 'Unpaid / COD',
    courier_name: order.courier_name || '',
    tracking_id: order.tracking_id || '',
    admin_notes: order.admin_notes || '',
    customer_notes: order.customer_notes || ''
  });

  useEffect(() => {
    setEditForm({
      payment_status: order.payment_status || 'Unpaid / COD',
      courier_name: order.courier_name || '',
      tracking_id: order.tracking_id || '',
      admin_notes: order.admin_notes || '',
      customer_notes: order.customer_notes || ''
    });
  }, [order]);

  const statusColor = getStatusColor(order.status);
  const paymentStatusVal = order.payment_status || 'Unpaid / COD';
  const isPaid = paymentStatusVal.toLowerCase().includes('paid') && !paymentStatusVal.toLowerCase().includes('unpaid');
  const isPartial = paymentStatusVal.toLowerCase().includes('partial');

  const paymentColor = isPaid ? '#008000' : isPartial ? '#3b82f6' : '#FF5252';

  const totalItemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const displayItemCount = totalItemsCount > 0 ? totalItemsCount : '1+';

  const rawPhone = order.customer_phone || '';
  const cleanPhoneForDial = rawPhone.replace(/[^0-9+]/g, '');
  const waPhone = formatWhatsAppNumber(rawPhone);

  const activeTemplate = TEMPLATE_PRESETS[order.status] || TEMPLATE_PRESETS.ALL;
  const messageText = renderPersonalizedText(activeTemplate, order);
  const encodedMessage = encodeURIComponent(messageText);
  const emailSubject = encodeURIComponent(`Update Regarding Your NOMAD Order #${order.id.slice(0, 8)}`);

  const customerInfoText = `Name: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.shipping_address || 'N/A'}`;

  const handlePaymentStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newPaymentStatus = e.target.value;
    setIsUpdating(true);
    try {
      await onUpdateDetails(order.id, {
        payment_status: newPaymentStatus,
        courier_name: order.courier_name || '',
        tracking_id: order.tracking_id || '',
        admin_notes: order.admin_notes || '',
        customer_notes: order.customer_notes || ''
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const payload = {
        payment_status: editForm.payment_status,
        courier_name: editForm.courier_name.trim() !== '' ? editForm.courier_name.trim() : (order.courier_name || ''),
        tracking_id: editForm.tracking_id.trim() !== '' ? editForm.tracking_id.trim() : (order.tracking_id || ''),
        admin_notes: editForm.admin_notes.trim() !== '' ? editForm.admin_notes.trim() : (order.admin_notes || ''),
        customer_notes: editForm.customer_notes.trim() !== '' ? editForm.customer_notes.trim() : (order.customer_notes || '')
      };

      await onUpdateDetails(order.id, payload);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Customer Details - ${order.customer_name || 'NOMAD Order'}`,
          text: customerInfoText,
        });
      } catch (err) {
        console.error('Error sharing order:', err);
      }
    }
  };

  const actionLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    border: '1px solid #333',
    color: '#fff',
    padding: '4px 7px',
    borderRadius: '2px',
    fontSize: '9.5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const smoothInputStyle = (editable: boolean): React.CSSProperties => ({
    width: '100%',
    boxSizing: 'border-box',
    background: editable ? '#121212' : '#080808',
    color: editable ? '#fff' : '#aaa',
    border: editable ? '1px solid #555' : '1px solid #1c1c1c',
    padding: '10px 12px',
    fontSize: '11px',
    outline: 'none',
    borderRadius: '3px',
    transition: 'background 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: editable ? 'text' : 'default',
    userSelect: editable ? 'auto' : 'none',
    minHeight: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center'
  });

  return (
    <div
      className="animate-fade-in table-row-hover"
      style={{
        backgroundColor: '#050505',
        border: isSelected ? '1px solid #fff' : '1px solid #222',
        padding: '16px',
        borderRadius: '2px',
        transition: 'border 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              onClick={() => onSelectToggle(order.id)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                border: isSelected ? '1px solid #fff' : '1px solid #444',
                backgroundColor: isSelected ? '#fff' : '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: '2px',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isSelected && (
                <CheckIcon width="11" height="11" stroke="#000" strokeWidth="3.5" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  onClick={() => onToggleExpand(order.id)}
                  title="Click to toggle details"
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  #{order.id.slice(0, 8)}... 
                  <span style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-block',
                    fontSize: '10px'
                  }}>▼</span>
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
                {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              ৳{order.total_amount}
            </div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              {displayItemCount} ITEM(S)
            </div>
          </div>
        </div>

        <div className={`filter-expand-wrapper ${isExpanded ? 'open' : ''}`}>
          <div className="filter-expand-content">
            <div style={{ paddingTop: '8px', paddingBottom: '8px', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', marginBottom: '10px', marginTop: '10px', fontWeight: 'bold' }}>ORDERED ITEMS</h4>
                {order.items.length > 0 ? order.items.map((item, idx) => (
                  <div key={`${item.product_name}-${idx}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#0a0a0a',
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '3px'
                  }}>
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff', lineHeight: '1.3' }}>{item.product_name}</div>
                      <div style={{ fontSize: '9.5px', color: '#bbb', marginTop: '4px' }}>
                        SIZE: {item.size} • COLOR: {item.color} • QTY: {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                      ৳{item.price * item.quantity}
                    </div>
                  </div>
                )) : (
                  <div style={{ color: '#666', fontSize: '11px', fontStyle: 'italic', padding: '10px' }}>
                    No items found for this order.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1.5px', margin: 0, fontWeight: 'bold' }}>MANAGEMENT DETAILS</h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(prev => !prev);
                    }}
                    title={isEditing ? "Cancel" : "Edit"}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: isEditing ? '#FF5252' : '#fff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      outline: 'none',
                      transition: 'color 0.2s ease, transform 0.2s ease'
                    }}
                  >
                    {isEditing ? (
                      <CloseIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    ) : (
                      <EditIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    )}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>COURIER NAME</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      placeholder={order.courier_name || "e.g. Steadfast, Pathao"}
                      value={editForm.courier_name}
                      onChange={e => {
                        if (isEditing) setEditForm({ ...editForm, courier_name: e.target.value });
                      }}
                      style={smoothInputStyle(isEditing)}
                    />
                    <div className={`filter-expand-wrapper ${isEditing ? 'open' : ''}`}>
                      <div className="filter-expand-content">
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 0', marginTop: '4px' }}>
                          {BD_COURIERS.map((courier) => {
                            const selectedName = editForm.courier_name || '';
                            const isChecked = selectedName.toLowerCase() === courier.toLowerCase();
                            return (
                              <button
                                type="button"
                                key={courier}
                                onClick={() => {
                                  if (!isEditing) return;
                                  setEditForm(prev => ({
                                    ...prev,
                                    courier_name: isChecked ? '' : courier
                                  }));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isChecked ? '#111' : '#0d0d0d',
                                  border: isChecked ? '1px solid #ffffff' : '1px solid #222222',
                                  color: isChecked ? '#ffffff' : '#888888',
                                  padding: '6px 10px',
                                  borderRadius: '3px',
                                  fontSize: '9px',
                                  fontWeight: isChecked ? 'bold' : 'normal',
                                  whiteSpace: 'nowrap',
                                  cursor: isEditing ? 'pointer' : 'default',
                                  flexShrink: 0,
                                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                  outline: 'none'
                                }}
                              >
                                {courier}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>TRACKING ID</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      placeholder={order.tracking_id || "Tracking / Memo No."}
                      value={editForm.tracking_id}
                      onChange={e => {
                        if (isEditing) setEditForm({ ...editForm, tracking_id: e.target.value });
                      }}
                      style={smoothInputStyle(isEditing)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>CUSTOMER NOTES</label>
                  <textarea
                    rows={2}
                    readOnly={!isEditing}
                    placeholder={order.customer_notes || "Add customer note to send in messages..."}
                    value={editForm.customer_notes}
                    onChange={e => {
                      if (isEditing) setEditForm({ ...editForm, customer_notes: e.target.value });
                    }}
                    style={{ 
                      ...smoothInputStyle(isEditing), 
                      height: 'auto', 
                      minHeight: '38px', 
                      resize: isEditing ? 'vertical' : 'none', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word', 
                      display: 'block' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>ADMIN NOTES</label>
                  <textarea
                    rows={2}
                    readOnly={!isEditing}
                    placeholder={order.admin_notes || "Add private admin notes here..."}
                    value={editForm.admin_notes}
                    onChange={e => {
                      if (isEditing) setEditForm({ ...editForm, admin_notes: e.target.value });
                    }}
                    style={{ 
                      ...smoothInputStyle(isEditing), 
                      height: 'auto', 
                      minHeight: '38px', 
                      resize: isEditing ? 'vertical' : 'none', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word', 
                      display: 'block' 
                    }}
                  />
                </div>

                {order.return_reason && (
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#FF5252', marginBottom: '6px', letterSpacing: '0.5px', fontWeight: 'bold' }}>CANCELLATION REASON</label>
                    <div style={{ ...smoothInputStyle(false), height: 'auto', border: '1px solid #FF5252', color: '#FF5252', wordBreak: 'break-word', display: 'block' }}>
                      {order.return_reason}
                    </div>
                  </div>
                )}

                <div className={`filter-expand-wrapper ${isEditing ? 'open' : ''}`}>
                  <div className="filter-expand-content" style={{ paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={isUpdating}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#fff',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        borderRadius: '3px',
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {isUpdating ? 'SAVING...' : 'SAVE DETAILS'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
              {order.customer_name || 'GUEST CUSTOMER'}
            </span>
            {order.customer_phone && (
              <span style={{ fontSize: '11px', color: '#bbb', fontFamily: 'monospace' }}>
                {order.customer_phone}
              </span>
            )}
            {order.customer_email && (
              <span style={{ fontSize: '10px', color: '#bbb' }}>
                • {order.customer_email}
              </span>
            )}
          </div>

          {order.shipping_address && (
            <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>
              {order.shipping_address}
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {cleanPhoneForDial && (
              <a
                href={`tel:${cleanPhoneForDial}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call ${rawPhone}`}
                style={actionLinkStyle}
              >
                Call
              </a>
            )}

            {order.customer_email && (
              <a
                href={`mailto:${order.customer_email}?subject=${emailSubject}&body=${encodedMessage}`}
                onClick={(e) => e.stopPropagation()}
                title={`Email ${order.customer_email}`}
                style={actionLinkStyle}
              >
                Email
              </a>
            )}

            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodedMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="WhatsApp Customer"
                style={actionLinkStyle}
              >
                WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              title="Share Customer Info"
              style={{ ...actionLinkStyle, padding: '4px 6px' }}
            >
              <ShareIcon width="12" height="12" stroke="currentColor" strokeWidth="2" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', width: '100%' }}>
          <button
            type="button"
            disabled={isUpdating}
            onClick={(e) => {
              e.stopPropagation();
              onOpenStatusModal(order);
            }}
            style={{
              backgroundColor: '#000',
              color: statusColor,
              border: `1px solid ${statusColor}`,
              padding: '6px 4px',
              fontSize: '8.5px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1,
              textAlign: 'center',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span>{order.status.toUpperCase()}</span>
            <span style={{ fontSize: '7px' }}>▼</span>
          </button>

          <select
            value={paymentStatusVal}
            disabled={isUpdating}
            onChange={handlePaymentStatusSelect}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              color: paymentColor,
              border: `1px solid ${paymentColor}`,
              padding: '6px 4px',
              fontSize: '8.5px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1,
              textAlign: 'center',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <option value="Unpaid / COD">UNPAID / COD</option>
            <option value="Paid">PAID</option>
            <option value="Partial Paid">PARTIAL PAID</option>
          </select>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrintInvoice(order); }}
            style={{ padding: '6px 12px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '9px', cursor: 'pointer', borderRadius: '2px', fontWeight: 'bold', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            PRINT
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;