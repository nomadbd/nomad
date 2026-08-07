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
  items: OrderItem[];
}

const STATUS_OPTIONS = [
  'Pending',
  'Received',
  'Shipped',
  'Delivered / Completed',
  'Cancelled'
];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total_amount, 
          status,
          customer_name,
          customer_phone,
          shipping_address,
          delivery_charge,
          vat_amount,
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
            quantity: item.quantity || 1,
            price: item.price_at_purchase || 0
          }));

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status || 'Pending',
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            delivery_charge: order.delivery_charge,
            vat_amount: order.vat_amount,
            items: items
          };
        });
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getUnifiedStatus = (rawStatus: string) => {
    if (!rawStatus) return 'PENDING';
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return 'RECEIVED';
    if (s === 'shipped') return 'SHIPPED';
    if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return 'DELIVERED';
    if (s === 'cancelled') return 'CANCELLED';
    return rawStatus.trim().toUpperCase();
  };

  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return '#3b82f6';
    if (s === 'shipped') return '#eab308';
    if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return '#22c55e';
    if (s === 'cancelled') return '#ef4444';
    return '#a855f7';
  };

  // ----- UPDATE: New Print Functionality -----
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups in your browser to print the invoice.");
      return;
    }

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = order.delivery_charge || 0;
    const vat = order.vat_amount || 0;
    const orderDate = new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice #${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 30px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px dashed #000; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
          .header p { margin: 5px 0 0; font-size: 14px; color: #555; }
          .info-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .info-box { width: 45%; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border-bottom: 1px solid #ccc; padding: 12px 8px; text-align: left; font-size: 14px; }
          th { background-color: #f9f9f9; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { width: 50%; margin-left: auto; border-top: 2px solid #000; padding-top: 15px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .grand-total { font-weight: bold; font-size: 18px; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; border-top: 1px dashed #ccc; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NOMAD APPAREL</h1>
          <p>The one. Everywhere.</p>
          <h2>INVOICE</h2>
        </div>

        <div class="info-container">
          <div class="info-box">
            <p class="bold">Order Details:</p>
            <p>Order ID: <strong>#${order.id.slice(0, 8).toUpperCase()}</strong></p>
            <p>Date: ${orderDate}</p>
            <p>Status: ${order.status.toUpperCase()}</p>
          </div>
          <div class="info-box" style="text-align: right;">
            <p class="bold">Bill To / Ship To:</p>
            <p><strong>${order.customer_name || 'Guest Customer'}</strong></p>
            <p>${order.customer_phone || 'No phone provided'}</p>
            <p style="white-space: pre-wrap;">${order.shipping_address || 'No address provided'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <strong>${item.product_name}</strong><br/>
                  <span style="font-size: 12px; color: #555;">Size: ${item.size} | Color: ${item.color}</span>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">৳${item.price}</td>
                <td class="text-right">৳${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>৳${subtotal}</span>
          </div>
          <div class="totals-row">
            <span>Delivery Charge:</span>
            <span>৳${deliveryCharge}</span>
          </div>
          ${vat > 0 ? `
          <div class="totals-row">
            <span>VAT:</span>
            <span>৳${vat}</span>
          </div>
          ` : ''}
          <div class="totals-row grand-total">
            <span>Total Amount:</span>
            <span>৳${order.total_amount}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Nomad Apparel!</p>
          <p>If you have any questions about this invoice, please contact our support.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Optional: Close window after printing
            // setTimeout(function() { window.close(); }, 500); 
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  // ----- END UPDATE -----

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_phone && order.customer_phone.includes(searchTerm));

      if (selectedStatusFilter === 'ALL') return matchesSearch;
      return matchesSearch && order.status.toLowerCase().trim() === selectedStatusFilter.toLowerCase().trim();
    });
  }, [orders, searchTerm, selectedStatusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%' }}>

      {/* Top Controls */}
      <div style={{ 
        backgroundColor: '#050505', 
        border: '1px solid #1a1a1a', 
        padding: '16px', 
        borderRadius: '2px',
        width: '100%'
      }}>

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
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

        {/* Status Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '6px',
          scrollbarWidth: 'none'
        }}>
          {['ALL', ...STATUS_OPTIONS].map((status) => {
            const isActive = selectedStatusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                style={{
                  backgroundColor: isActive ? '#fff' : '#0a0a0a',
                  color: isActive ? '#000' : '#888',
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

      {/* Order Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#666' }}>
        <span>SHOWING {filteredOrders.length} OF {orders.length} ORDERS</span>
        <button 
          onClick={fetchAdminOrders}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
        >
          REFRESH
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontSize: '11px' }}>
          FETCHING ORDER MEMORANDUMS...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '50px 20px', textAlign: 'center', color: '#666' }}>
          NO MATCHING ORDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusColor = getStatusColor(order.status);
            const isUpdating = updatingOrderId === order.id;

            // Calculate total quantities across all items
            const totalItemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

            return (
              <div key={order.id} style={{ 
                backgroundColor: '#050505', 
                border: '1px solid #222', 
                padding: '16px', 
                borderRadius: '2px'
              }}>

                {/* Card Header */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                          #{order.id.slice(0, 8)}...
                        </span>
                        <span style={{ 
                          backgroundColor: `${statusColor}22`, 
                          color: statusColor, 
                          border: `1px solid ${statusColor}55`, 
                          padding: '2px 8px', 
                          borderRadius: '2px', 
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          ● {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                        ৳{order.total_amount}
                      </div>
                      <div style={{ fontSize: '9px', color: '#666' }}>
                        {totalItemsCount} ITEM(S)
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ fontSize: '12px', color: '#ddd' }}>
                    {order.customer_name || 'GUEST CUSTOMER'} 
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      {order.customer_phone || ''}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        backgroundColor: '#000',
                        color: statusColor,
                        border: `1px solid ${statusColor}`,
                        padding: '9px 12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        flex: 1,
                        minWidth: '140px'
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>

                    <button onClick={() => handlePrintInvoice(order)} style={{ padding: '9px 16px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>
                      PRINT
                    </button>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{ padding: '9px 16px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                    >
                      {isExpanded ? 'HIDE' : 'VIEW'}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #222' }}>
                    {/* Shipping Address */}
                    <div style={{ background: '#0a0a0a', padding: '12px', fontSize: '11px', color: '#ccc', marginBottom: '12px' }}>
                      <strong>SHIPPING ADDRESS:</strong><br />
                      {order.shipping_address || 'No address provided'}
                    </div>

                    {/* Items */}
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        background: '#000', 
                        padding: '10px', 
                        marginBottom: '8px',
                        border: '1px solid #151515'
                      }}>
                        <img 
                          src={item.product_image} 
                          alt="" 
                          style={{ width: '45px', height: '55px', objectFit: 'cover' }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.product_name}</div>
                          <div style={{ fontSize: '9.5px', color: '#777' }}>
                            {item.size} • {item.color} • QTY: {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', alignSelf: 'center' }}>
                          ৳{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
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
