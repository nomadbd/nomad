import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../supabaseClient';
import './admin-animations.css';

interface SupabaseProductMedia {
  media_url: string;
}

interface SupabaseProduct {
  name: string;
  product_media: SupabaseProductMedia[];
}

interface SupabaseOrderItem {
  quantity: number;
  size: string;
  color: string;
  price_at_purchase: number;
  product_name?: string;
  product_image?: string;
  products?: SupabaseProduct;
}

interface SupabaseOrderResponse {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  return_reason?: string;
  order_items: SupabaseOrderItem[];
}

interface OrderItem {
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  return_reason?: string;
  items: OrderItem[];
}

interface AdminOrdersProps {
  isSearchOpen?: boolean;
  isFilterOpen?: boolean;
  onToggleSearch?: () => void;
  onToggleFilter?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const STATUS_OPTIONS = [
  'Pending',
  'Received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

const PAYMENT_STATUS_OPTIONS = [
  'ALL',
  'Paid',
  'Unpaid / COD',
  'Partial Paid'
];

const DATE_FILTERS = ['ALL TIME', 'TODAY', 'LAST 7 DAYS', 'THIS MONTH'];

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

const TEMPLATE_PRESETS: { [key: string]: string } = {
  ALL: "Hello {{name}},\n\nThank you for choosing NOMAD. Your order status is: {{status}}.\n\nOrder ID: #{{order_id}}\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with us!",
  Pending: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) is currently PENDING. We are processing it soon!\n\nThank you for shopping with NOMAD.",
  Received: "Hello {{name}},\n\nWe have received your NOMAD order (#{{order_id}}). We are preparing it for processing.\n\nThank you for shopping with NOMAD.",
  Processing: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) is now being PROCESSED.\n\nThank you for shopping with NOMAD.",
  Shipped: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been SHIPPED!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD!",
  Delivered: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been DELIVERED successfully!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD!",
  Cancelled: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) status is CANCELLED. Please contact us for further details."
};

const formatWhatsAppNumber = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  if (digits.length === 10) return '880' + digits;
  return digits;
};

const renderPersonalizedText = (template: string, order: Order): string => {
  let text = template
    .replace(/{{name}}/g, order.customer_name || 'Customer')
    .replace(/{{status}}/g, (order.status || 'Updated').toUpperCase())
    .replace(/{{order_id}}/g, order.id.slice(0, 8))
    .replace(/{{courier}}/g, order.courier_name || 'N/A')
    .replace(/{{tracking}}/g, order.tracking_id || 'N/A');

  if (order.customer_notes && order.customer_notes.trim() !== '') {
    text += `\n\nNote:\n${order.customer_notes.trim()}`;
  }

  return text;
};

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (orderId: string) => void;
  onSelectToggle: (orderId: string) => void;
  onOpenStatusModal: (order: Order) => void;
  onUpdateDetails: (orderId: string, updatedData: { 
    customer_name?: string;
    customer_phone?: string;
    shipping_address?: string;
    payment_status: string; 
    courier_name: string; 
    tracking_id: string; 
    admin_notes: string; 
    customer_notes: string 
  }) => Promise<void>;
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
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    shipping_address: order.shipping_address || '',
    payment_status: order.payment_status || 'Unpaid / COD',
    courier_name: order.courier_name || '',
    tracking_id: order.tracking_id || '',
    admin_notes: order.admin_notes || '',
    customer_notes: order.customer_notes || ''
  });

  useEffect(() => {
    setEditForm({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      shipping_address: order.shipping_address || '',
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
        customer_name: editForm.customer_name,
        customer_phone: editForm.customer_phone,
        shipping_address: editForm.shipping_address,
        payment_status: newPaymentStatus,
        courier_name: editForm.courier_name,
        tracking_id: editForm.tracking_id,
        admin_notes: editForm.admin_notes,
        customer_notes: editForm.customer_notes
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
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.trim(),
        shipping_address: editForm.shipping_address.trim(),
        payment_status: editForm.payment_status,
        courier_name: editForm.courier_name.trim(),
        tracking_id: editForm.tracking_id.trim(),
        admin_notes: editForm.admin_notes.trim(),
        customer_notes: editForm.customer_notes.trim()
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
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
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
                  <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1.5px', margin: 0, fontWeight: 'bold' }}>MANAGEMENT & CUSTOMER EDIT</h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(prev => !prev);
                    }}
                    title={isEditing ? "Cancel" : "Edit Details"}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      {isEditing ? (
                        <>
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </>
                      ) : (
                        <>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </>
                      )}
                    </svg>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>CUSTOMER NAME</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      placeholder={order.customer_name || "Customer Name"}
                      value={editForm.customer_name}
                      onChange={e => {
                        if (isEditing) setEditForm({ ...editForm, customer_name: e.target.value });
                      }}
                      style={smoothInputStyle(isEditing)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>CUSTOMER PHONE</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      placeholder={order.customer_phone || "Customer Phone"}
                      value={editForm.customer_phone}
                      onChange={e => {
                        if (isEditing) setEditForm({ ...editForm, customer_phone: e.target.value });
                      }}
                      style={smoothInputStyle(isEditing)}
                    />
                  </div>

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
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>SHIPPING ADDRESS</label>
                  <textarea
                    rows={2}
                    readOnly={!isEditing}
                    placeholder={order.shipping_address || "Add full shipping address..."}
                    value={editForm.shipping_address}
                    onChange={e => {
                      if (isEditing) setEditForm({ ...editForm, shipping_address: e.target.value });
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
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

const AdminOrders: React.FC<AdminOrdersProps> = ({
  isSearchOpen: propSearchOpen,
  isFilterOpen: propFilterOpen,
  onToggleSearch,
  onToggleFilter,
  searchQuery,
  onSearchChange
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');

  const searchTerm = searchQuery !== undefined ? searchQuery : internalSearchTerm;
  const setSearchTerm = (val: string) => {
    setInternalSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL TIME');

  const [internalSearchOpen, setInternalSearchOpen] = useState<boolean>(false);
  const [internalFilterOpen, setInternalFilterOpen] = useState<boolean>(false);

  const searchOpen = propSearchOpen !== undefined ? propSearchOpen : internalSearchOpen;
  const filterOpen = propFilterOpen !== undefined ? propFilterOpen : internalFilterOpen;

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalSelectedStatus, setModalSelectedStatus] = useState<string>('');
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkViewOpen, setIsBulkViewOpen] = useState<boolean>(false);
  const [bulkMessageType, setBulkMessageType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [bulkMessageText, setBulkMessageText] = useState<string>(TEMPLATE_PRESETS.ALL);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('ALL');
  const [bulkEmailSubject, setBulkEmailSubject] = useState<string>('Update Regarding Your NOMAD Order');
  const [sentIndexes, setSentIndexes] = useState<{ [key: string]: boolean }>({});
  const [expandedBulkItems, setExpandedBulkItems] = useState<{ [key: string]: boolean }>({});
  const [isMessageTemplateOpen, setIsMessageTemplateOpen] = useState<boolean>(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const cancelTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleGlobalSearchToggle = () => {
      if (onToggleSearch) {
        onToggleSearch();
      } else {
        setInternalSearchOpen(prev => !prev);
      }
    };

    const handleGlobalFilterToggle = () => {
      if (onToggleFilter) {
        onToggleFilter();
      } else {
        setInternalFilterOpen(prev => !prev);
      }
    };

    window.addEventListener('admin-toggle-search', handleGlobalSearchToggle);
    window.addEventListener('admin-toggle-filter', handleGlobalFilterToggle);

    return () => {
      window.removeEventListener('admin-toggle-search', handleGlobalSearchToggle);
      window.removeEventListener('admin-toggle-filter', handleGlobalFilterToggle);
    };
  }, [onToggleSearch, onToggleFilter]);

  useEffect(() => {
    if (modalSelectedStatus === 'Cancelled' && cancelTextareaRef.current) {
      setTimeout(() => {
        cancelTextareaRef.current?.focus();
        cancelTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [modalSelectedStatus]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  const toggleBulkItemExpand = (orderId: string) => {
    setExpandedBulkItems(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity, 
            size, 
            color, 
            price_at_purchase,
            product_name,
            product_image,
            products:product_id (
              name,
              product_media (
                media_url
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = (data as unknown as SupabaseOrderResponse[]).map((order) => {
          const items = (order.order_items || []).map((item) => ({
            product_name: item.product_name || item.products?.name || 'NOMAD APPAREL',
            product_image: item.product_image || item.products?.product_media?.[0]?.media_url || 'https://via.placeholder.com/80x100',
            size: item.size || 'N/A',
            color: item.color || 'N/A',
            quantity: item.quantity ? Number(item.quantity) : 1,
            price: item.price_at_purchase || 0
          }));

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status === 'Delivered / Completed' ? 'Delivered' : (order.status || 'Pending'),
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            shipping_address: order.shipping_address,
            delivery_charge: order.delivery_charge,
            vat_amount: order.vat_amount,
            payment_status: order.payment_status || 'Unpaid / COD',
            courier_name: order.courier_name || '',
            tracking_id: order.tracking_id || '',
            admin_notes: order.admin_notes || '',
            customer_notes: order.customer_notes || '',
            return_reason: order.return_reason || '',
            items: items
          };
        });
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast('Failed to fetch orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();

    const channel = supabase
      .channel('orders-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAdminOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedStatusFilter !== 'ALL' && TEMPLATE_PRESETS[selectedStatusFilter]) {
      setBulkMessageText(TEMPLATE_PRESETS[selectedStatusFilter]);
      setSelectedPresetKey(selectedStatusFilter);
    } else {
      setBulkMessageText(TEMPLATE_PRESETS.ALL);
      setSelectedPresetKey('ALL');
    }
  }, [selectedStatusFilter]);

  const handleUpdateDetails = async (
    orderId: string, 
    updatedFields: { 
      customer_name?: string;
      customer_phone?: string;
      shipping_address?: string;
      payment_status: string; 
      courier_name: string; 
      tracking_id: string; 
      admin_notes: string; 
      customer_notes: string 
    }
  ) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: updatedFields.customer_name,
          customer_phone: updatedFields.customer_phone,
          shipping_address: updatedFields.shipping_address,
          payment_status: updatedFields.payment_status,
          courier_name: updatedFields.courier_name,
          tracking_id: updatedFields.tracking_id,
          admin_notes: updatedFields.admin_notes,
          customer_notes: updatedFields.customer_notes
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o));
      showToast('Order details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update order details:', err);
      showToast('Failed to update details.', 'error');
    }
  };

  const handleBulkPaymentStatusChange = async (newPaymentStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

      setOrders(prev => prev.map(o =>
        selectedOrderIds.includes(o.id) ? { ...o, payment_status: newPaymentStatus } : o
      ));

      showToast(`Updated payment status to "${newPaymentStatus}" for ${selectedOrderIds.length} orders.`, 'success');
    } catch (err) {
      console.error('Failed to bulk update payment status:', err);
      showToast('Failed to update payment status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

      setOrders(prev => prev.map(o =>
        selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o
      ));

      showToast(`Updated order status to "${newStatus}" for ${selectedOrderIds.length} orders.`, 'success');
    } catch (err) {
      console.error('Failed to bulk update order status:', err);
      showToast('Failed to update status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, cancelReason?: string) => {
    try {
      const updateData: { status: string; return_reason?: string | null } = { status: newStatus };
      if (newStatus === 'Cancelled') {
        updateData.return_reason = cancelReason || null;
      } else {
        updateData.return_reason = null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, return_reason: cancelReason || '' } : o));
      showToast(`Order marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s.includes('rec')) return '#7C4DFF';
    if (s.includes('proc')) return '#E040FB';
    if (s.includes('shipped')) return '#00B0FF';
    if (s.includes('delivered') || s.includes('completed')) return '#008000';
    if (s.includes('cancel')) return '#FF5252';
    return '#FFB800';
  };

  const handleOpenStatusModal = (order: Order) => {
    setActiveModalOrder(order);
    setModalSelectedStatus(order.status);
    setCancelReasonText(order.return_reason || '');
  };

  const handleConfirmCancelSubmit = async () => {
    if (!activeModalOrder || !cancelReasonText.trim() || isSubmittingCancel) return;
    setIsSubmittingCancel(true);
    try {
      await handleStatusChange(activeModalOrder.id, 'Cancelled', cancelReasonText.trim());
      setActiveModalOrder(null);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=850,height=900,left=150,top=50');
    if (!printWindow) {
      showToast("Please allow pop-ups in your browser to print the invoice.", 'error');
      return;
    }

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = order.delivery_charge || 0;
    const vat = order.vat_amount || 0;

    const dateObj = new Date(order.created_at);
    const dateStr = dateObj.toLocaleDateString('en-CA');
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const paymentMethodText = order.payment_status?.toUpperCase() || "CASH ON DELIVERY";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${order.id.slice(0, 8)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { 
            font-family: 'Inter', sans-serif; 
            color: #000; 
            padding: 30px; 
            max-width: 800px; 
            width: 100%;
            margin: 0 auto; 
            font-size: 11px; 
            line-height: 1.5;
            background-color: #fff;
            box-sizing: border-box;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { font-size: 20px; letter-spacing: 6px; margin: 0 0 5px 0; font-weight: 700; }
          .header h2 { font-size: 9px; letter-spacing: 2px; margin: 10px 0 0 0; color: #555; text-transform: uppercase; font-weight: 600;}
          
          .top-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .shipping-info { flex: 1; min-width: 220px; }
          .order-info { text-align: right; flex: 1; min-width: 250px; }
          .shipping-info p, .order-info p { margin: 3px 0; word-break: break-word; }
          .bold { font-weight: 700; }
          .small-title { font-size: 10px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
          .text-red { color: #d93025; }
          
          .table-header { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
            font-weight: 700; 
            font-size: 11px; 
            text-transform: uppercase;
          }
          .item-row { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
          .item-details { display: flex; flex-direction: column; flex: 1; }
          .item-meta { color: #555; font-size: 10px; margin-top: 4px; text-transform: uppercase; }
          
          .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
          .totals-table { width: 100%; max-width: 300px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
          .totals-border { border-top: 1px solid #000; margin: 10px 0; }
          .grand-total { font-weight: 700; font-size: 12px; }
          
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 9px; 
            color: #333; 
            line-height: 1.5; 
          }
          
          @media print {
            @page { margin: 0; }
            body { 
              width: 100% !important; 
              max-width: 100% !important;
              padding: 1cm !important; 
              margin: 0 !important; 
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>N O M A D</h1>
          <h2>PROFORMA INVOICE / ORDER MEMORANDUM</h2>
        </div>

        <div class="top-section">
          <div class="shipping-info">
            <div class="small-title">SHIPPING TO</div>
            <p class="bold" style="text-transform: uppercase;">${order.customer_name || 'GUEST CUSTOMER'}</p>
            <p>${order.customer_phone || ''}</p>
            ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
            <p style="text-transform: uppercase; white-space: pre-wrap;">${order.shipping_address || ''}</p>
          </div>
          <div class="order-info">
            <p><span class="bold">ORDER ID:</span> #${order.id}</p>
            <p><span class="bold">DATE:</span> ${dateStr} &nbsp;&nbsp; <span class="bold">TIME:</span> ${timeStr}</p>
            <p><span class="bold">PAYMENT:</span> ${paymentMethodText}</p>
            <p class="bold text-red" style="margin-top: 6px;">STATUS: ${order.status.toUpperCase()}</p>
          </div>
        </div>

        <div class="table-header">
          <div>DESCRIPTION</div>
          <div>TOTAL</div>
        </div>

        ${order.items.length > 0 ? order.items.map(item => `
          <div class="item-row">
            <div class="item-details">
              <span class="bold" style="text-transform: uppercase;">${item.product_name}</span>
              <span class="item-meta">SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} x ৳${item.price}</span>
            </div>
            <div style="font-weight: 600; white-space: nowrap;">৳${item.price * item.quantity}</div>
          </div>
        `).join('') : '<div style="margin-bottom: 15px;">No item details available.</div>'}

        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row">
              <span>SUBTOTAL</span>
              <span>৳${subtotal > 0 ? subtotal : order.total_amount - deliveryCharge - vat}</span>
            </div>
            <div class="totals-row">
              <span>SHIPPING</span>
              <span>৳${deliveryCharge}</span>
            </div>
            ${vat > 0 ? `
            <div class="totals-row">
              <span>VAT</span>
              <span>৳${vat}</span>
            </div>
            ` : ''}
            <div class="totals-border"></div>
            <div class="totals-row grand-total text-red">
              <span>AMOUNT DUE</span>
              <span>৳${order.total_amount}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="bold">LEGAL NOTICE:</span> This is a computer-generated order memorandum.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 200);
            window.onafterprint = function() { window.close(); };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const handlePrintBulkInvoices = (ordersToPrint: Order[]) => {
    if (ordersToPrint.length === 0) {
      showToast("No orders available to print.", 'error');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=900,left=150,top=50');
    if (!printWindow) {
      showToast("Please allow pop-ups in your browser to print invoices.", 'error');
      return;
    }

    const invoicesHtml = ordersToPrint.map(order => {
      const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryCharge = order.delivery_charge || 0;
      const vat = order.vat_amount || 0;

      const dateObj = new Date(order.created_at);
      const dateStr = dateObj.toLocaleDateString('en-CA');
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const paymentMethodText = order.payment_status?.toUpperCase() || "CASH ON DELIVERY";

      return `
        <div class="invoice-page">
          <div class="header">
            <h1>N O M A D</h1>
            <h2>PROFORMA INVOICE / ORDER MEMORANDUM</h2>
          </div>

          <div class="top-section">
            <div class="shipping-info">
              <div class="small-title">SHIPPING TO</div>
              <p class="bold" style="text-transform: uppercase;">${order.customer_name || 'GUEST CUSTOMER'}</p>
              <p>${order.customer_phone || ''}</p>
              ${order.customer_email ? `<p>${order.customer_email}</p>` : ''}
              <p style="text-transform: uppercase; white-space: pre-wrap;">${order.shipping_address || ''}</p>
            </div>
            <div class="order-info">
              <p><span class="bold">ORDER ID:</span> #${order.id}</p>
              <p><span class="bold">DATE:</span> ${dateStr} &nbsp;&nbsp; <span class="bold">TIME:</span> ${timeStr}</p>
              <p><span class="bold">PAYMENT:</span> ${paymentMethodText}</p>
              <p class="bold text-red" style="margin-top: 6px;">STATUS: ${order.status.toUpperCase()}</p>
            </div>
          </div>

          <div class="table-header">
            <div>DESCRIPTION</div>
            <div>TOTAL</div>
          </div>

          ${order.items.length > 0 ? order.items.map(item => `
            <div class="item-row">
              <div class="item-details">
                <span class="bold" style="text-transform: uppercase;">${item.product_name}</span>
                <span class="item-meta">SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} x ৳${item.price}</span>
              </div>
              <div style="font-weight: 600; white-space: nowrap;">৳${item.price * item.quantity}</div>
            </div>
          `).join('') : '<div style="margin-bottom: 15px;">No item details available.</div>'}

          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span>SUBTOTAL</span>
                <span>৳${subtotal > 0 ? subtotal : order.total_amount - deliveryCharge - vat}</span>
              </div>
              <div class="totals-row">
                <span>SHIPPING</span>
                <span>৳${deliveryCharge}</span>
              </div>
              ${vat > 0 ? `
              <div class="totals-row">
                <span>VAT</span>
                <span>৳${vat}</span>
              </div>
              ` : ''}
              <div class="totals-border"></div>
              <div class="totals-row grand-total text-red">
                <span>AMOUNT DUE</span>
                <span>৳${order.total_amount}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <span class="bold">LEGAL NOTICE:</span> This is a computer-generated order memorandum.
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bulk Invoices (${ordersToPrint.length})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { 
            font-family: 'Inter', sans-serif; 
            color: #000; 
            margin: 0;
            padding: 0;
            font-size: 11px; 
            line-height: 1.5;
            background-color: #fff;
          }
          .invoice-page {
            padding: 30px; 
            max-width: 800px; 
            width: 100%;
            margin: 0 auto; 
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
          }
          .invoice-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { font-size: 20px; letter-spacing: 6px; margin: 0 0 5px 0; font-weight: 700; }
          .header h2 { font-size: 9px; letter-spacing: 2px; margin: 10px 0 0 0; color: #555; text-transform: uppercase; font-weight: 600;}
          
          .top-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .shipping-info { flex: 1; min-width: 220px; }
          .order-info { text-align: right; flex: 1; min-width: 250px; }
          .shipping-info p, .order-info p { margin: 3px 0; word-break: break-word; }
          .bold { font-weight: 700; }
          .small-title { font-size: 10px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
          .text-red { color: #d93025; }
          
          .table-header { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
            font-weight: 700; 
            font-size: 11px; 
            text-transform: uppercase;
          }
          .item-row { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
          .item-details { display: flex; flex-direction: column; flex: 1; }
          .item-meta { color: #555; font-size: 10px; margin-top: 4px; text-transform: uppercase; }
          
          .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
          .totals-table { width: 100%; max-width: 300px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; }
          .totals-border { border-top: 1px solid #000; margin: 10px 0; }
          .grand-total { font-weight: 700; font-size: 12px; }
          
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 9px; 
            color: #333; 
            line-height: 1.5; 
          }
          
          @media print {
            @page { margin: 0; }
            body { 
              width: 100% !important; 
              max-width: 100% !important;
              padding: 0 !important; 
              margin: 0 !important; 
            }
            .invoice-page {
              padding: 1cm !important;
            }
          }
        </style>
      </head>
      <body>
        ${invoicesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 200);
            window.onafterprint = function() { window.close(); };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTermDigits = term.replace(/[^0-9]/g, '');

    return orders.filter(order => {
      let matchesSearch = !term;

      if (term) {
        const idMatch = order.id.toLowerCase().includes(term);
        const nameMatch = order.customer_name ? order.customer_name.toLowerCase().includes(term) : false;
        const emailMatch = order.customer_email ? order.customer_email.toLowerCase().includes(term) : false;
        const addressMatch = order.shipping_address ? order.shipping_address.toLowerCase().includes(term) : false;
        const courierMatch = order.courier_name ? order.courier_name.toLowerCase().includes(term) : false;
        const trackingMatch = order.tracking_id ? order.tracking_id.toLowerCase().includes(term) : false;
        const customerNotesMatch = order.customer_notes ? order.customer_notes.toLowerCase().includes(term) : false;
        const adminNotesMatch = order.admin_notes ? order.admin_notes.toLowerCase().includes(term) : false;
        const returnReasonMatch = order.return_reason ? order.return_reason.toLowerCase().includes(term) : false;
        const itemMatch = order.items.some(item => item.product_name && item.product_name.toLowerCase().includes(term));

        let phoneMatch = false;
        if (order.customer_phone) {
          const rawPhone = order.customer_phone.toLowerCase();
          const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');

          phoneMatch = rawPhone.includes(term);
          if (!phoneMatch && cleanTermDigits.length > 0) {
            const termNoLeadingZero = cleanTermDigits.replace(/^0+/, '');
            phoneMatch = cleanPhoneDigits.includes(cleanTermDigits) || 
                         (termNoLeadingZero.length >= 3 && cleanPhoneDigits.includes(termNoLeadingZero));
          }
        }

        matchesSearch = Boolean(
          idMatch ||
          nameMatch ||
          emailMatch ||
          addressMatch ||
          courierMatch ||
          trackingMatch ||
          customerNotesMatch ||
          adminNotesMatch ||
          returnReasonMatch ||
          itemMatch ||
          phoneMatch
        );
      }

      const matchesStatus = selectedStatusFilter === 'ALL' || order.status.toLowerCase().trim() === selectedStatusFilter.toLowerCase().trim();

      const orderPaymentStatus = order.payment_status || 'Unpaid / COD';
      const matchesPaymentStatus = selectedPaymentStatusFilter === 'ALL' || orderPaymentStatus.toLowerCase().trim() === selectedPaymentStatusFilter.toLowerCase().trim();

      const orderDate = new Date(order.created_at);
      const today = new Date();
      let matchesDate = true;

      if (selectedDateFilter === 'TODAY') {
        matchesDate = orderDate.toDateString() === today.toDateString();
      } else if (selectedDateFilter === 'LAST 7 DAYS') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = orderDate >= sevenDaysAgo;
      } else if (selectedDateFilter === 'THIS MONTH') {
        matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
    });
  }, [orders, searchTerm, selectedStatusFilter, selectedPaymentStatusFilter, selectedDateFilter]);

  const handleSelectToggle = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredOrders.map(o => o.id);
      setSelectedOrderIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredOrders.map(o => o.id);
      const newSet = new Set([...selectedOrderIds, ...filteredIds]);
      setSelectedOrderIds(Array.from(newSet));
    }
  };

  const selectedOrdersList = useMemo(() => {
    return orders.filter(o => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const handleSendSingleWhatsApp = (order: Order) => {
    const waPhone = formatWhatsAppNumber(order.customer_phone || '');
    if (!waPhone) {
      showToast("Invalid phone number", 'error');
      return;
    }

    const personalizedMessage = renderPersonalizedText(bulkMessageText, order);
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');

    setSentIndexes(prev => ({ ...prev, [order.id]: true }));
  };

  const isFilterVisible = filterOpen || selectedOrderIds.length > 0;

  if (isBulkViewOpen) {
    const activeBulkOrders = (selectedPresetKey === 'ALL' || !selectedPresetKey
      ? selectedOrdersList
      : selectedOrdersList.filter(o => o.status.toLowerCase().trim() === selectedPresetKey.toLowerCase().trim())
    ).filter(o => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      return (
        (o.customer_name && o.customer_name.toLowerCase().includes(term)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(term)) ||
        (o.id && o.id.toLowerCase().includes(term)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(term))
      );
    });

    const activeBulkEmails = activeBulkOrders
      .map(o => o.customer_email)
      .filter((email): email is string => Boolean(email && email.trim()));

    const bulkEmailBccList = Array.from(new Set(activeBulkEmails)).join(',');
    const bulkEmailHref = `mailto:?bcc=${encodeURIComponent(bulkEmailBccList)}&subject=${encodeURIComponent(bulkEmailSubject)}&body=${encodeURIComponent(bulkMessageText.replace(/{{name}}/g, 'Valued Customer').replace(/{{status}}/g, selectedPresetKey !== 'ALL' ? selectedPresetKey : 'Updated'))}`;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', position: 'relative', minHeight: '80vh', backgroundColor: '#050505', padding: '0px', boxSizing: 'border-box', borderRadius: '0px', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
          <div style={{ flex: 1, marginRight: '10px' }}>
            {searchOpen ? (
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  backgroundColor: '#000',
                  border: '1px solid #333',
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  borderRadius: '25px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ) : (
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', letterSpacing: '1px', fontWeight: 'bold' }}>
                {(selectedPresetKey || 'ALL').toUpperCase()} {activeBulkOrders.length}
              </h3>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsBulkViewOpen(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '6px 10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'transform 0.2s ease, color 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        <div className={`filter-expand-wrapper ${filterOpen ? 'open' : ''}`}>
          <div className="filter-expand-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginBottom: filterOpen ? '16px' : '0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>STATUS</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap', paddingBottom: '4px', width: '100%' }}>
                {Object.keys(TEMPLATE_PRESETS).map((key) => {
                  const isPresetActive = selectedPresetKey === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setBulkMessageText(TEMPLATE_PRESETS[key]);
                        setSelectedPresetKey(key);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: isPresetActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '6px 10px',
                        fontSize: '9.5px',
                        fontWeight: isPresetActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsMessageTemplateOpen(prev => !prev)}
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  letterSpacing: '1px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>MESSAGE TEMPLATE</span>
                <span style={{ 
                  transform: isMessageTemplateOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontSize: '9px' 
                }}>▼</span>
              </button>

              <div className={`filter-expand-wrapper ${isMessageTemplateOpen ? 'open' : ''}`}>
                <div className="filter-expand-content" style={{ paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bulkMessageType === 'email' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>EMAIL SUBJECT</label>
                      <input
                        type="text"
                        value={bulkEmailSubject}
                        onChange={(e) => setBulkEmailSubject(e.target.value)}
                        style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '10px 12px', fontSize: '11px', outline: 'none', boxSizing: 'border-box', borderRadius: '2px', transition: 'border-color 0.2s ease' }}
                      />
                    </div>
                  )}

                  <div>
                    <textarea
                      rows={5}
                      value={bulkMessageText}
                      onChange={(e) => {
                        setBulkMessageText(e.target.value);
                        setSelectedPresetKey('');
                      }}
                      style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '10px 12px', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', borderRadius: '2px', transition: 'border-color 0.2s ease' }}
                    />
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>
                      Variables: <code>{"{{name}}"}</code>, <code>{"{{status}}"}</code>, <code>{"{{order_id}}"}</code>, <code>{"{{courier}}"}</code>, <code>{"{{tracking}}"}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {bulkMessageType === 'email' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={bulkEmailHref}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
              >
                Send Email ({activeBulkEmails.length})
              </a>

              <div style={{ fontSize: '9.5px', color: '#888', textAlign: 'center' }}>
                Found {activeBulkEmails.length} valid emails out of {activeBulkOrders.length} selected orders.
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '8px' }}>RECIPIENT DISPATCH QUEUE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeBulkOrders.map((ord) => {
                  const isSent = Boolean(sentIndexes[ord.id]);
                  const isItemExpanded = Boolean(expandedBulkItems[ord.id]);
                  const phone = ord.customer_phone || 'No phone';
                  const personalizedPreview = renderPersonalizedText(bulkMessageText, ord);
                  const statusColor = getStatusColor(ord.status);

                  return (
                    <div
                      key={ord.id}
                      onClick={() => toggleBulkItemExpand(ord.id)}
                      className="table-row-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: '#000',
                        padding: '12px',
                        border: '1px solid #222',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {ord.customer_name || 'Customer'}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: statusColor, border: `1px solid ${statusColor}`, padding: '1px 5px', borderRadius: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {ord.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', fontFamily: 'monospace' }}>{phone}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSingleWhatsApp(ord);
                          }}
                          style={{
                            backgroundColor: isSent ? '#222' : '#111',
                            color: isSent ? '#888' : '#ccc',
                            border: isSent ? '1px solid #444' : '1px solid #333',
                            padding: '6px 14px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isSent ? 'SENT' : 'SEND'}
                        </button>
                      </div>
                      <div className={`filter-expand-wrapper ${isItemExpanded ? 'open' : ''}`}>
                        <div className="filter-expand-content">
                          <div style={{ fontSize: '10px', color: '#ccc', background: '#050505', padding: '10px', border: '1px solid #1a1a1a', borderRadius: '2px', whiteSpace: 'pre-wrap', marginTop: '6px' }}>
                            {personalizedPreview}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', position: 'relative' }}>

      {toast && (
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: toast.type === 'success' ? '#fff' : '#333',
            color: toast.type === 'success' ? '#000' : '#fff',
            border: '1px solid #444',
            padding: '12px 20px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <div className={`filter-expand-wrapper ${searchOpen ? 'open' : ''}`}>
        <div className="filter-expand-content animate-fade-in">
          <input
            type="text"
            placeholder="SEARCH BY ID, NAME, PHONE, EMAIL, ITEM OR TRACKING..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#000',
              border: '1px solid #333',
              padding: '11px 16px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              outline: 'none',
              boxSizing: 'border-box',
              borderRadius: '25px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>
      </div>

      <div className={`filter-expand-wrapper ${isFilterVisible ? 'open' : ''}`}>
        <div className="filter-expand-content animate-fade-in">
          <div
            style={{
              backgroundColor: '#050505',
              border: '1px solid #222',
              padding: '16px',
              borderRadius: '2px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {DATE_FILTERS.map((dateFilter) => {
                  const isActive = selectedDateFilter === dateFilter;
                  return (
                    <button
                      type="button"
                      key={dateFilter}
                      onClick={() => setSelectedDateFilter(dateFilter)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {dateFilter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>ORDER STATUS</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {['ALL', ...STATUS_OPTIONS].map((status) => {
                  const isActive = selectedStatusFilter === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setSelectedStatusFilter(status)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>PAYMENT STATUS</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {PAYMENT_STATUS_OPTIONS.map((pStatus) => {
                  const isActive = selectedPaymentStatusFilter === pStatus;
                  return (
                    <button
                      type="button"
                      key={pStatus}
                      onClick={() => setSelectedPaymentStatusFilter(pStatus)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {pStatus}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: selectedOrderIds.length > 0 ? '#111' : '#0a0a0a',
              border: '1px solid #222',
              padding: '12px 16px',
              borderRadius: '2px',
              marginTop: '14px',
              transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={handleSelectAllFiltered}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '3px',
                  border: isAllFilteredSelected ? '1px solid #fff' : '1px solid #444',
                  backgroundColor: isAllFilteredSelected ? '#fff' : '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {isAllFilteredSelected && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span onClick={handleSelectAllFiltered} style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                SELECT ALL FILTERED ({filteredOrders.length})
              </span>
            </div>

            <div className={`filter-expand-wrapper ${selectedOrderIds.length > 0 ? 'open' : ''}`}>
              <div className="filter-expand-content animate-fade-in">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkStatusChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <option value="" style={{ background: '#000', color: '#fff' }}>MARK STATUS AS...</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt} style={{ background: '#000', color: '#fff' }}>{opt.toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkPaymentStatusChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <option value="" style={{ background: '#000', color: '#fff' }}>MARK PAYMENT AS...</option>
                    <option value="Paid" style={{ background: '#000', color: '#fff' }}>PAID</option>
                    <option value="Unpaid / COD" style={{ background: '#000', color: '#fff' }}>UNPAID / COD</option>
                    <option value="Partial Paid" style={{ background: '#000', color: '#fff' }}>PARTIAL PAID</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handlePrintBulkInvoices(selectedOrdersList)}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    BULK PRINT ({selectedOrderIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkMessageType('whatsapp');
                      setIsBulkViewOpen(true);
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    WhatsApp ({selectedOrderIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkMessageType('email');
                      setIsBulkViewOpen(true);
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Email ({selectedOrderIds.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
            LOADING ORDERS...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
            NO ORDERS FOUND
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrderIds.includes(order.id)}
              isExpanded={expandedOrderId === order.id}
              onToggleExpand={handleToggleExpand}
              onSelectToggle={handleSelectToggle}
              onOpenStatusModal={handleOpenStatusModal}
              onUpdateDetails={handleUpdateDetails}
              onPrintInvoice={handlePrintInvoice}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {activeModalOrder && ReactDOM.createPortal(
        <div
          className="animate-fade-in"
          onClick={() => setActiveModalOrder(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            ref={modalContainerRef}
            className="animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#23212c',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '340px',
              padding: '20px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = modalSelectedStatus.toLowerCase() === opt.toLowerCase();
                return (
                  <div key={opt} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      onClick={async () => {
                        if (opt === 'Cancelled') {
                          setModalSelectedStatus('Cancelled');
                        } else {
                          setModalSelectedStatus(opt);
                          const currentOrderId = activeModalOrder.id;
                          setActiveModalOrder(null);
                          await handleStatusChange(currentOrderId, opt);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 8px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', color: '#fff' }}>
                        {opt.toUpperCase()}
                      </span>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #a855f7' : '2px solid #555',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border-color 0.2s ease'
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#a855f7', transition: 'all 0.2s ease' }} />
                        )}
                      </div>
                    </div>

                    {opt === 'Cancelled' && modalSelectedStatus === 'Cancelled' && (
                      <div className="filter-expand-wrapper open">
                        <div className="filter-expand-content animate-fade-in" style={{ padding: '8px 0 4px 0' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              backgroundColor: '#14131a',
                              border: '1px solid #3b3848',
                              borderRadius: '16px',
                              padding: '6px 6px 6px 14px',
                              gap: '8px'
                            }}
                          >
                            <textarea
                              ref={cancelTextareaRef}
                              rows={2}
                              autoFocus
                              placeholder="Type cancellation reason..."
                              value={cancelReasonText}
                              onChange={(e) => setCancelReasonText(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '11px',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                            />
                            <button
                              type="button"
                              disabled={!cancelReasonText.trim() || isSubmittingCancel}
                              onClick={handleConfirmCancelSubmit}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: cancelReasonText.trim() ? '#FF5252' : '#2a2836',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: cancelReasonText.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminOrders;
