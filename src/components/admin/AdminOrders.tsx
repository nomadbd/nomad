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
  products: SupabaseProduct;
}

interface SupabaseOrderResponse {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
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
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  'Pending',
  'Received',
  'Shipped',
  'Delivered',
  'Cancelled'
];

const DATE_FILTERS = ['ALL TIME', 'TODAY', 'LAST 7 DAYS', 'THIS MONTH'];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL TIME');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [editForm, setEditForm] = useState({
    payment_status: '',
    courier_name: '',
    tracking_id: '',
    admin_notes: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
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
            product_name: item.products?.name || 'NOMAD APPAREL',
            product_image: item.products?.product_media?.[0]?.media_url || 'https://via.placeholder.com/80x100',
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
            shipping_address: order.shipping_address,
            delivery_charge: order.delivery_charge,
            vat_amount: order.vat_amount,
            payment_status: order.payment_status || 'Unpaid / COD',
            courier_name: order.courier_name || '',
            tracking_id: order.tracking_id || '',
            admin_notes: order.admin_notes || '',
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

  const handleExpandClick = (order: Order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(order.id);
      setEditForm({
        payment_status: order.payment_status || 'Unpaid / COD',
        courier_name: order.courier_name || '',
        tracking_id: order.tracking_id || '',
        admin_notes: order.admin_notes || ''
      });
    }
  };

  const handleUpdateDetails = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: editForm.payment_status,
          courier_name: editForm.courier_name,
          tracking_id: editForm.tracking_id,
          admin_notes: editForm.admin_notes
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...editForm } : o));
      showToast('Order details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update order details:', err);
      showToast('Failed to update details.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
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
    } finally {
      setUpdatingOrderId(null);
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
        <title>Invoice #${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: sans-serif; color: #000; padding: 30px; max-width: 800px; margin: 0 auto; font-size: 11px; line-height: 1.5; background: #fff; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { font-size: 20px; letter-spacing: 6px; margin: 0 0 5px 0; font-weight: 700; }
          .top-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
          .bold { font-weight: 700; }
          .table-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; font-weight: 700; text-transform: uppercase; }
          .item-row { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
          .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
          .totals-table { width: 100%; max-width: 300px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; text-transform: uppercase; }
          .totals-border { border-top: 1px solid #000; margin: 10px 0; }
          .footer { margin-top: 50px; text-align: center; font-size: 9px; color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>N O M A D</h1>
          <h2>PROFORMA INVOICE</h2>
        </div>
        <div class="top-section">
          <div>
            <div class="bold">SHIPPING TO</div>
            <div class="bold">${order.customer_name || 'GUEST CUSTOMER'}</div>
            <div>${order.customer_phone || ''}</div>
            <div>${order.shipping_address || ''}</div>
          </div>
          <div style="text-align: right;">
            <div><span class="bold">ORDER ID:</span> #${order.id}</div>
            <div><span class="bold">DATE:</span> ${dateStr}</div>
            <div class="bold" style="color: red; margin-top: 6px;">STATUS: ${order.status.toUpperCase()}</div>
          </div>
        </div>
        <div class="table-header">
          <div>DESCRIPTION</div>
          <div>TOTAL</div>
        </div>
        ${order.items.length > 0 ? order.items.map(item => `
          <div class="item-row">
            <div>
              <span class="bold">${item.product_name}</span><br/>
              <span style="font-size: 10px; color: #555;">SIZE: ${item.size} | COLOR: ${item.color} | QTY: ${item.quantity} x ৳${item.price}</span>
            </div>
            <div class="bold">৳${item.price * item.quantity}</div>
          </div>
        `).join('') : '<div>No item details available.</div>'}
        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row"><span>SUBTOTAL</span><span>৳${subtotal > 0 ? subtotal : order.total_amount - deliveryCharge - vat}</span></div>
            <div class="totals-row"><span>SHIPPING</span><span>৳${deliveryCharge}</span></div>
            <div class="totals-border"></div>
            <div class="totals-row bold" style="color: red;"><span>AMOUNT DUE</span><span>৳${order.total_amount}</span></div>
          </div>
        </div>
        <div class="footer">Computer-generated invoice memorandum.</div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_phone && order.customer_phone.includes(searchTerm));

      const matchesStatus = selectedStatusFilter === 'ALL' || order.status.toLowerCase().trim() === selectedStatusFilter.toLowerCase().trim();

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

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, selectedStatusFilter, selectedDateFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', position: 'relative' }}>
      
      {toast && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px',
          backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: '4px',
          fontSize: '12px', fontWeight: 'bold', zIndex: 9999
        }}>
          {toast.message}
        </div>
      )}

      {/* Top Controls */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="SEARCH BY ID, NAME OR PHONE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '11px 14px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {DATE_FILTERS.map((dateFilter) => (
            <button
              key={dateFilter}
              onClick={() => setSelectedDateFilter(dateFilter)}
              style={{
                backgroundColor: selectedDateFilter === dateFilter ? '#333' : '#000',
                color: selectedDateFilter === dateFilter ? '#fff' : '#666',
                border: '1px solid #222', padding: '6px 12px', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {dateFilter}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {['ALL', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              style={{
                backgroundColor: selectedStatusFilter === status ? '#fff' : '#0a0a0a',
                color: selectedStatusFilter === status ? '#000' : '#888',
                border: '1px solid #222', padding: '8px 14px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
        <span>SHOWING {filteredOrders.length} OF {orders.length} ORDERS</span>
        <button onClick={fetchAdminOrders} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>REFRESH</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>FETCHING ORDERS...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '50px 20px', textAlign: 'center', color: '#666' }}>NO MATCHING ORDERS FOUND</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusColor = getStatusColor(order.status);
            const isUpdating = updatingOrderId === order.id;
            const totalItemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const isPaid = order.payment_status?.toLowerCase().includes('paid') && !order.payment_status?.toLowerCase().includes('unpaid');

            return (
              <div key={order.id} style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '16px', borderRadius: '2px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>#{order.id.slice(0, 8)}...</span>
                        <span style={{ backgroundColor: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`, padding: '2px 8px', fontSize: '9px', fontWeight: 'bold' }}>● {order.status.toUpperCase()}</span>
                        <span style={{ backgroundColor: isPaid ? '#22c55e22' : '#f9731622', color: isPaid ? '#22c55e' : '#f97316', border: '1px solid #333', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold' }}>{order.payment_status?.toUpperCase() || 'UNPAID'}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>৳{order.total_amount}</div>
                      <div style={{ fontSize: '9px', color: '#666' }}>{totalItemsCount > 0 ? totalItemsCount : '1+'} ITEM(S)</div>
                    </div>
                  </div>

                  {/* Customer Info & Contact Actions (Icons Removed, No SMS) */}
                  <div style={{ fontSize: '12px', color: '#ddd', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span>{order.customer_name || 'GUEST CUSTOMER'}</span>
                    
                    {order.customer_phone && (() => {
                      const messageBody = encodeURIComponent(
                        `Hello ${order.customer_name || 'Customer'},\nYour NOMAD order (#${order.id.slice(0, 8)}) status is: ${order.status}.\nCourier: ${order.courier_name || 'N/A'}\nTracking ID: ${order.tracking_id || 'N/A'}\nThank you!`
                      );
                      const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
                      const waPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;

                      const textBtnStyle = {
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        textDecoration: 'none',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      };

                      return (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`tel:${order.customer_phone}`} style={{ ...textBtnStyle, color: '#22c55e' }}>
                            CALL
                          </a>
                          <a href={`https://wa.me/${waPhone}?text=${messageBody}`} target="_blank" rel="noopener noreferrer" style={{ ...textBtnStyle, color: '#22c55e' }}>
                            WHATSAPP
                          </a>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ backgroundColor: '#000', color: statusColor, border: `1px solid ${statusColor}`, padding: '9px 12px', fontSize: '10px', fontWeight: 'bold', flex: 1, minWidth: '140px', cursor: 'pointer' }}
                    >
                      {STATUS_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt.toUpperCase()}</option>))}
                    </select>
                    <button onClick={() => handlePrintInvoice(order)} style={{ padding: '9px 16px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>PRINT</button>
                    <button onClick={() => handleExpandClick(order)} style={{ padding: '9px 16px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>{isExpanded ? 'HIDE' : 'VIEW'}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h4 style={{ color: '#888', fontSize: '10px', marginBottom: '8px', marginTop: '0' }}>ORDERED ITEMS</h4>
                      {order.items.length > 0 ? order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', background: '#000', padding: '10px', marginBottom: '8px', border: '1px solid #151515' }}>
                          <img src={item.product_image} alt="" style={{ width: '45px', height: '55px', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.product_name}</div>
                            <div style={{ fontSize: '9.5px', color: '#777', marginTop: '4px' }}>SIZE: {item.size} • COLOR: {item.color} • QTY: {item.quantity}</div>
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '12px', alignSelf: 'center' }}>৳{item.price * item.quantity}</div>
                        </div>
                      )) : (
                        <div style={{ color: '#555', fontSize: '11px', fontStyle: 'italic', padding: '10px', background: '#000', border: '1px solid #111' }}>
                          No items found for this order (Mock order entry).
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px' }}>
                       <h4 style={{ color: '#888', fontSize: '10px', marginBottom: '12px', marginTop: '0' }}>MANAGEMENT DETAILS</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                         <div>
                            <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>PAYMENT STATUS</label>
                            <select value={editForm.payment_status} onChange={e => setEditForm({...editForm, payment_status: e.target.value})} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px' }}>
                              <option value="Unpaid / COD">UNPAID / COD</option>
                              <option value="Paid">PAID</option>
                              <option value="Partial Paid">PARTIAL PAID</option>
                            </select>
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>COURIER NAME</label>
                            <input type="text" placeholder="e.g. Steadfast, Pathao" value={editForm.courier_name} onChange={e => setEditForm({...editForm, courier_name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px' }} />
                         </div>
                         <div>
                            <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>TRACKING ID</label>
                            <input type="text" placeholder="Tracking / Memo No." value={editForm.tracking_id} onChange={e => setEditForm({...editForm, tracking_id: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px' }} />
                         </div>
                       </div>

                       <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '9px', color: '#555', marginBottom: '4px' }}>ADMIN NOTES</label>
                          <textarea rows={2} placeholder="Add notes here..." value={editForm.admin_notes} onChange={e => setEditForm({...editForm, admin_notes: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '11px' }} />
                       </div>

                       <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '12px', background: '#000', padding: '10px', border: '1px dashed #333' }}>
                          <strong style={{ color: '#888' }}>SHIPPING ADDRESS:</strong><br />
                          <span style={{ color: '#fff', display: 'block', marginTop: '4px' }}>{order.shipping_address || 'No address provided'}</span>
                       </div>

                       <button onClick={() => handleUpdateDetails(order.id)} disabled={isUpdating} style={{ width: '100%', padding: '10px', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', fontSize: '10px', cursor: 'pointer' }}>
                          {isUpdating ? 'SAVING...' : 'SAVE DETAILS'}
                        </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
