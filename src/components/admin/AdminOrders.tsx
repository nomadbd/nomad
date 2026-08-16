import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';

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
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  'Pending',
  'Received',
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

const TEMPLATE_PRESETS: { [key: string]: string } = {
  DEFAULT: "Hello {{name}},\n\nThank you for choosing NOMAD. Your order status is: {{status}}.\n\nOrder ID: #{{order_id}}\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with us!",
  Pending: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) is currently PENDING. We are processing it soon!\n\nThank you for shopping with NOMAD.",
  Shipped: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been SHIPPED!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD!",
  Delivered: "Hello {{name}},\n\nYour NOMAD order (#{{order_id}}) has been DELIVERED successfully!\n\nCourier: {{courier}}\nTracking ID: {{tracking}}\n\nThank you for shopping with NOMAD.",
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
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
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
  onStatusChange,
  onUpdateDetails,
  onPrintInvoice,
  getStatusColor
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
  
  const paymentColor = isPaid ? '#22c55e' : isPartial ? '#3b82f6' : '#f97316';

  const totalItemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const displayItemCount = totalItemsCount > 0 ? totalItemsCount : '1+';

  const rawPhone = order.customer_phone || '';
  const cleanPhoneForDial = rawPhone.replace(/[^0-9+]/g, '');
  const waPhone = formatWhatsAppNumber(rawPhone);

  const activeTemplate = TEMPLATE_PRESETS[order.status] || TEMPLATE_PRESETS.DEFAULT;
  const messageText = renderPersonalizedText(activeTemplate, order);
  const encodedMessage = encodeURIComponent(messageText);
  const emailSubject = encodeURIComponent(`Update Regarding Your NOMAD Order #${order.id.slice(0, 8)}`);

  const customerInfoText = `Name: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.shipping_address || 'N/A'}`;

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    setIsUpdating(true);
    try {
      await onStatusChange(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newPaymentStatus = e.target.value;
    setIsUpdating(true);
    try {
      await onUpdateDetails(order.id, {
        ...editForm,
        payment_status: newPaymentStatus
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await onUpdateDetails(order.id, editForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(customerInfoText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
    } else {
      handleCopy(e);
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
    flexShrink: 0
  };

  const cleanInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#121212',
    color: '#fff',
    border: 'none',
    padding: '10px 12px',
    fontSize: '11px',
    outline: 'none',
    borderRadius: '3px'
  };

  return (
    <div style={{
      backgroundColor: '#050505',
      border: isSelected ? '1px solid #3b82f6' : '1px solid #222',
      padding: '16px',
      borderRadius: '2px',
      transition: 'border-color 0.2s ease'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectToggle(order.id)}
              style={{ marginTop: '3px', cursor: 'pointer', width: '15px', height: '15px', accentColor: '#fff' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  #{order.id.slice(0, 8)}...
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

        {/* VIEW SECTION PLACED BETWEEN ORDER ID AND CUSTOMER INFO */}
        {isExpanded && (
          <div style={{ paddingTop: '4px', paddingBottom: '4px', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', marginBottom: '10px', marginTop: '10px', fontWeight: 'bold' }}>ORDERED ITEMS</h4>
              {order.items.length > 0 ? order.items.map((item, idx) => (
                <div key={`${item.product_name}-${idx}`} style={{
                  display: 'flex',
                  gap: '12px',
                  background: '#0a0a0a',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '3px'
                }}>
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff' }}>{item.product_name}</div>
                    <div style={{ fontSize: '9.5px', color: '#bbb', marginTop: '4px' }}>
                      SIZE: {item.size} • COLOR: {item.color} • QTY: {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', alignSelf: 'center', color: '#fff' }}>
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
              <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1.5px', margin: 0, fontWeight: 'bold' }}>MANAGEMENT DETAILS</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>PAYMENT STATUS</label>
                  <select
                    value={editForm.payment_status}
                    onChange={e => setEditForm({ ...editForm, payment_status: e.target.value })}
                    style={{ ...cleanInputStyle, cursor: 'pointer' }}
                  >
                    <option value="Unpaid / COD">UNPAID / COD</option>
                    <option value="Paid">PAID</option>
                    <option value="Partial Paid">PARTIAL PAID</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>COURIER NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Steadfast, Pathao"
                    value={editForm.courier_name}
                    onChange={e => setEditForm({ ...editForm, courier_name: e.target.value })}
                    style={cleanInputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>TRACKING ID</label>
                  <input
                    type="text"
                    placeholder="Tracking / Memo No."
                    value={editForm.tracking_id}
                    onChange={e => setEditForm({ ...editForm, tracking_id: e.target.value })}
                    style={cleanInputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>CUSTOMER NOTES</label>
                <textarea
                  rows={2}
                  placeholder="Add customer note to send in messages..."
                  value={editForm.customer_notes}
                  onChange={e => setEditForm({ ...editForm, customer_notes: e.target.value })}
                  style={{ ...cleanInputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>ADMIN NOTES</label>
                <textarea
                  rows={2}
                  placeholder="Add private admin notes here..."
                  value={editForm.admin_notes}
                  onChange={e => setEditForm({ ...editForm, admin_notes: e.target.value })}
                  style={{ ...cleanInputStyle, resize: 'vertical' }}
                />
              </div>

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
                  marginTop: '4px'
                }}
              >
                {isUpdating ? 'SAVING...' : 'SAVE DETAILS'}
              </button>
            </div>
          </div>
        )}

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

            <button
              type="button"
              onClick={handleCopy}
              title={isCopied ? "Copied!" : "Copy Customer Info"}
              style={{ ...actionLinkStyle, padding: '4px 6px', color: isCopied ? '#22c55e' : '#fff' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isCopied ? (
                  <polyline points="20 6 9 17 4 12"></polyline>
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* EQUAL SIZED DROPDOWNS AND VIEW BUTTON */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', width: '100%' }}>
          <select
            value={order.status}
            disabled={isUpdating}
            onChange={handleStatusSelect}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              color: statusColor,
              border: `1px solid ${statusColor}`,
              padding: '6px 2px 6px 4px',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={paymentStatusVal}
            disabled={isUpdating}
            onChange={handlePaymentStatusSelect}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              color: paymentColor,
              border: `1px solid ${paymentColor}`,
              padding: '6px 2px 6px 4px',
              fontSize: '9px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1
            }}
          >
            <option value="Unpaid / COD">UNPAID / COD</option>
            <option value="Paid">PAID</option>
            <option value="Partial Paid">PARTIAL PAID</option>
          </select>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrintInvoice(order); }}
            style={{ padding: '6px 8px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '9px', cursor: 'pointer', borderRadius: '2px', fontWeight: 'bold', flexShrink: 0 }}
          >
            PRINT
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(order.id); }}
            style={{ padding: '6px 8px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '9px', cursor: 'pointer', borderRadius: '2px', fontWeight: 'bold', flexShrink: 0 }}
          >
            {isExpanded ? 'HIDE' : 'VIEW'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL TIME');

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkMessageType, setBulkMessageType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [bulkMessageText, setBulkMessageText] = useState<string>(TEMPLATE_PRESETS.DEFAULT);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('DEFAULT');
  const [bulkEmailSubject, setBulkEmailSubject] = useState<string>('Update Regarding Your NOMAD Order');
  const [sentIndexes, setSentIndexes] = useState<{ [key: string]: boolean }>({});

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
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
  }, []);

  useEffect(() => {
    if (selectedStatusFilter !== 'ALL' && TEMPLATE_PRESETS[selectedStatusFilter]) {
      setBulkMessageText(TEMPLATE_PRESETS[selectedStatusFilter]);
      setSelectedPresetKey(selectedStatusFilter);
    } else {
      setBulkMessageText(TEMPLATE_PRESETS.DEFAULT);
      setSelectedPresetKey('DEFAULT');
    }
  }, [selectedStatusFilter]);

  const handleUpdateDetails = async (orderId: string, updatedFields: { payment_status: string; courier_name: string; tracking_id: string; admin_notes: string; customer_notes: string }) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return '#3b82f6';
    if (s === 'shipped') return '#eab308';
    if (s === 'delivered') return '#22c55e';
    if (s === 'cancelled') return '#ef4444';
    return '#a855f7';
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
    return orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_phone && order.customer_phone.includes(searchTerm));

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

  const getSelectedEmailsList = () => {
    return selectedOrdersList
      .map(o => o.customer_email)
      .filter((email): email is string => Boolean(email && email.trim()));
  };

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

  const bulkEmailBccList = Array.from(new Set(getSelectedEmailsList())).join(',');
  const bulkEmailHref = `mailto:?bcc=${encodeURIComponent(bulkEmailBccList)}&subject=${encodeURIComponent(bulkEmailSubject)}&body=${encodeURIComponent(bulkMessageText.replace(/{{name}}/g, 'Valued Customer').replace(/{{status}}/g, selectedStatusFilter !== 'ALL' ? selectedStatusFilter : 'Updated'))}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', position: 'relative' }}>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '2px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        backgroundColor: '#050505',
        border: '1px solid #1a1a1a',
        padding: '16px',
        borderRadius: '2px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div>
          <input
            type="text"
            placeholder="SEARCH BY ID, NAME OR PHONE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#000',
              border: '1px solid #333',
              padding: '11px 14px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '9px', color: '#aaa', marginBottom: '4px', letterSpacing: '1px' }}>DATE RANGE</label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
            {DATE_FILTERS.map((dateFilter) => {
              const isActive = selectedDateFilter === dateFilter;
              return (
                <button
                  type="button"
                  key={dateFilter}
                  onClick={() => setSelectedDateFilter(dateFilter)}
                  style={{
                    backgroundColor: isActive ? '#fff' : '#0a0a0a',
                    color: isActive ? '#000' : '#bbb',
                    border: isActive ? '1px solid #fff' : '1px solid #222',
                    padding: '8px 14px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    borderRadius: '2px'
                  }}
                >
                  {dateFilter}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '9px', color: '#aaa', marginBottom: '4px', letterSpacing: '1px' }}>ORDER STATUS</label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
            {['ALL', ...STATUS_OPTIONS].map((status) => {
              const isActive = selectedStatusFilter === status;
              return (
                <button
                  type="button"
                  key={status}
                  onClick={() => setSelectedStatusFilter(status)}
                  style={{
                    backgroundColor: isActive ? '#fff' : '#0a0a0a',
                    color: isActive ? '#000' : '#bbb',
                    border: isActive ? '1px solid #fff' : '1px solid #222',
                    padding: '8px 14px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    borderRadius: '2px'
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '9px', color: '#aaa', marginBottom: '4px', letterSpacing: '1px' }}>PAYMENT STATUS</label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
            {PAYMENT_STATUS_OPTIONS.map((pStatus) => {
              const isActive = selectedPaymentStatusFilter === pStatus;
              return (
                <button
                  type="button"
                  key={pStatus}
                  onClick={() => setSelectedPaymentStatusFilter(pStatus)}
                  style={{
                    backgroundColor: isActive ? '#fff' : '#0a0a0a',
                    color: isActive ? '#000' : '#bbb',
                    border: isActive ? '1px solid #fff' : '1px solid #222',
                    padding: '8px 14px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    borderRadius: '2px'
                  }}
                >
                  {pStatus}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        backgroundColor: selectedOrderIds.length > 0 ? '#111' : '#050505',
        border: '1px solid #222',
        padding: '12px 16px',
        borderRadius: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="selectAllFiltered"
            checked={isAllFilteredSelected}
            onChange={handleSelectAllFiltered}
            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#fff' }}
          />
          <label htmlFor="selectAllFiltered" style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
            SELECT ALL FILTERED ({filteredOrders.length})
          </label>
        </div>

        {selectedOrderIds.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkPaymentStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '7px 10px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px',
                outline: 'none'
              }}
            >
              <option value="">MARK PAYMENT AS...</option>
              <option value="Paid">PAID</option>
              <option value="Unpaid / COD">UNPAID / COD</option>
              <option value="Partial Paid">PARTIAL PAID</option>
            </select>

            <button
              type="button"
              onClick={() => handlePrintBulkInvoices(selectedOrdersList)}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '7px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              BULK PRINT ({selectedOrderIds.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkMessageType('whatsapp');
                setIsBulkModalOpen(true);
              }}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '7px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              BULK WHATSAPP ({selectedOrderIds.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkMessageType('email');
                setIsBulkModalOpen(true);
              }}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '7px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              BULK EMAIL ({selectedOrderIds.length})
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#aaa' }}>
        <span>SHOWING {filteredOrders.length} OF {orders.length} ORDERS</span>
        <button
          type="button"
          onClick={fetchAdminOrders}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
        >
          REFRESH
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: '11px' }}>
          FETCHING ORDER MEMORANDUMS...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '50px 20px', textAlign: 'center', color: '#aaa' }}>
          NO MATCHING ORDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrderIds.includes(order.id)}
              isExpanded={expandedOrderId === order.id}
              onToggleExpand={handleToggleExpand}
              onSelectToggle={handleSelectToggle}
              onStatusChange={handleStatusChange}
              onUpdateDetails={handleUpdateDetails}
              onPrintInvoice={handlePrintInvoice}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}

      {isBulkModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', letterSpacing: '1px' }}>
                BULK {bulkMessageType.toUpperCase()} BROADCAST ({selectedOrdersList.length} RECIPIENTS)
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#aaa', marginBottom: '6px' }}>LOAD STATUS TEMPLATE PRESET</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(TEMPLATE_PRESETS).map((key) => {
                  const isPresetActive = selectedPresetKey === key || bulkMessageText === TEMPLATE_PRESETS[key];
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setBulkMessageText(TEMPLATE_PRESETS[key]);
                        setSelectedPresetKey(key);
                      }}
                      style={{
                        backgroundColor: isPresetActive ? '#fff' : '#111',
                        color: isPresetActive ? '#000' : '#ddd',
                        border: isPresetActive ? '1px solid #fff' : '1px solid #333',
                        padding: '4px 8px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '2px'
                      }}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {bulkMessageType === 'email' && (
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>EMAIL SUBJECT</label>
                <input
                  type="text"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>MESSAGE TEMPLATE</label>
              <textarea
                rows={4}
                value={bulkMessageText}
                onChange={(e) => {
                  setBulkMessageText(e.target.value);
                  setSelectedPresetKey('');
                }}
                style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px' }}>
                Variables: <code>{"{{name}}"}</code>, <code>{"{{status}}"}</code>, <code>{"{{order_id}}"}</code>, <code>{"{{courier}}"}</code>, <code>{"{{tracking}}"}</code>
              </div>
            </div>

            {bulkMessageType === 'email' ? (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={bulkEmailHref}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    width: '100%',
                    padding: '12px',
                    background: '#fff',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  OPEN DEFAULT MAIL APP ({getSelectedEmailsList().length} RECIPIENTS VIA BCC)
                </a>

                <div style={{ fontSize: '9.5px', color: '#aaa', textAlign: 'center' }}>
                  Found {getSelectedEmailsList().length} valid emails out of {selectedOrdersList.length} selected orders.
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#aaa', marginBottom: '8px' }}>RECIPIENT DISPATCH QUEUE</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {selectedOrdersList.map((ord) => {
                    const isSent = Boolean(sentIndexes[ord.id]);
                    const phone = ord.customer_phone || 'No phone';
                    const personalizedPreview = renderPersonalizedText(bulkMessageText, ord);

                    return (
                      <div key={ord.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#000', padding: '10px', border: '1px solid #1a1a1a', borderRadius: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{ord.customer_name || 'Customer'} (#{ord.id.slice(0, 8)})</span>
                            <span style={{ fontSize: '9px', color: '#aaa', marginLeft: '6px' }}>{phone} • {ord.status.toUpperCase()}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendSingleWhatsApp(ord)}
                            style={{
                              backgroundColor: isSent ? '#333' : '#25D366',
                              color: isSent ? '#aaa' : '#000',
                              border: 'none',
                              padding: '6px 12px',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              borderRadius: '2px'
                            }}
                          >
                            {isSent ? 'SENT ✓' : 'SEND WHATSAPP'}
                          </button>
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#22c55e', background: '#050505', padding: '6px', border: '1px dashed #222', borderRadius: '2px', whiteSpace: 'pre-wrap' }}>
                          {personalizedPreview}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
