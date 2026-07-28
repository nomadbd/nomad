import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট পাথ নিশ্চিত করুন

// 🔹 ১. ডাটাবেজ রেসপন্সের জন্য টাইপস্ক্রিপ্ট ইন্টারফেস 
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

  // 🔹 ডাটাবেজ থেকে অর্ডার ডেটা ফেচ করা
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
        // 'any' এর বদলে সঠিক ইন্টারফেস কাস্টিং করা হয়েছে
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

  // 🔹 এক ক্লিকে সরাসরি ডাটাবেজে অর্ডার স্ট্যাটাস আপডেট
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

  // 🔹 ইউনিফাইড স্ট্যাটাস টেক্সট জেনারেটর
  const getUnifiedStatus = (rawStatus: string) => {
    if (!rawStatus) return 'PENDING';
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return 'RECEIVED';
    if (s === 'shipped') return 'SHIPPED';
    if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return 'DELIVERED';
    if (s === 'cancelled') return 'CANCELLED';
    return rawStatus.trim().toUpperCase();
  };

  // 🔹 স্ট্যাটাস অনুযায়ী ব্যাজের কালার
  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return '#3b82f6'; // Blue
    if (s === 'shipped') return '#eab308'; // Yellow
    if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return '#22c55e'; // Green
    if (s === 'cancelled') return '#ef4444'; // Red
    return '#a855f7'; // Purple for Pending
  };

  // 📄 ৩. অ্যাডমিন ইনভয়েস প্রিন্ট হ্যান্ডলার (উন্নত ক্লিনআপ লজিক)
  const handlePrintInvoice = (order: Order) => {
    const dateObj = new Date(order.created_at);
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryCharge = order.delivery_charge || 0;
    const vatAmount = order.vat_amount || 0;
    const grandTotal = order.total_amount;

    const unifiedStatus = getUnifiedStatus(order.status);
    const isDelivered = unifiedStatus === 'DELIVERED';
    const statusColor = isDelivered ? '#000000' : '#ff0000';
    const totalLabel = isDelivered ? 'TOTAL PAID' : 'AMOUNT DUE';

    const itemsHtml = order.items.map((item) => {
      const detailsArray = [];
      if (item.size && item.size !== 'N/A') detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
      if (item.color && item.color !== 'N/A') detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
      detailsArray.push(`QTY: ${item.quantity}`);

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
            <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${item.product_name.toUpperCase()}</strong>
            <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">৳${item.price * item.quantity}</td>
        </tr>
      `;
    }).join('');

    const printContainer = document.createElement('div');
    printContainer.id = 'nomad-admin-print-area';

    printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000;">NOMAD</div>
      <div style="text-align: center; font-size: 10px; letter-spacing: 3px; color: #666; margin-bottom: 40px; text-transform: uppercase;">Official Fulfillment Memorandum</div>
      
      <table style="width: 100%; margin-bottom: 30px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 4px 0; color: #000; font-size: 11px;">
            <span style="color: #666; font-size: 9px; letter-spacing: 1.5px; font-weight: bold; display: block;">CUSTOMER DETAILS</span>
          </td>
          <td style="text-align: right; padding: 4px 0; color: #000; font-size: 11px;">
            <strong>ORDER ID:</strong> #${order.id}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #000; font-weight: bold;">
            ${(order.customer_name || 'VALUED CUSTOMER').toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; color: #000;">
            <strong>DATE:</strong> ${formattedDate} &nbsp; <strong>TIME:</strong> ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #000;">
            TEL: ${order.customer_phone || 'N/A'}
          </td>
          <td style="text-align: right; padding: 4px 0; color: #000;">
            <strong>PAYMENT:</strong> CASH ON DELIVERY
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #000; line-height: 1.4; max-width: 300px;">
            ${(order.shipping_address || 'N/A').toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0;">
            <strong style="color: ${statusColor}; letter-spacing: 1px; text-transform: uppercase;">STATUS: ${unifiedStatus}</strong>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000;">DESCRIPTION</th>
            <th style="text-align: right; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width: 40%; margin-left: auto; font-size: 11px; line-height: 2; margin-bottom: 40px;">
        <tr><td>SUBTOTAL</td><td style="text-align: right; font-family: monospace;">৳${subtotal}</td></tr>
        <tr><td>SHIPPING</td><td style="text-align: right; font-family: monospace;">৳${deliveryCharge}</td></tr>
        <tr><td>VAT</td><td style="text-align: right; font-family: monospace;">৳${vatAmount}</td></tr>
        <tr style="font-weight: bold; font-size: 13px; color: ${statusColor};">
          <td style="padding-top: 10px; border-top: 1px solid #000;">${totalLabel}</td>
          <td style="text-align: right; padding-top: 10px; border-top: 1px solid #000; font-family: monospace;">৳${grandTotal}</td>
        </tr>
      </table>

      <div style="font-size: 9px; color: #777; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        NOMAD SYSTEM CONTROL & FULFILLMENT CENTER &bull; AUTOMATED INVOICE
      </div>
    `;

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @media print {
        @page { margin: 0mm; }
        body { background: #fff !important; color: #000 !important; margin: 0 !important; }
        body > *:not(#nomad-admin-print-area) { display: none !important; }
        #nomad-admin-print-area {
          display: block !important;
          position: absolute; left: 0; top: 0; width: 100%;
          background: #fff !important; color: #000 !important;
          padding: 50px 40px !important; box-sizing: border-box; font-family: sans-serif;
        }
      }
      @media screen { #nomad-admin-print-area { display: none !important; } }
    `;

    document.body.appendChild(printContainer);
    document.head.appendChild(styleSheet);

    // DOM রেন্ডার হওয়ার জন্য সময় বাড়ানো হয়েছে
    setTimeout(() => {
      window.print();
    }, 250);

    // ব্যবহারকারী প্রিন্ট উইন্ডো বন্ধ করলে বা প্রিন্ট সম্পন্ন করলে স্টাইল রিমুভ হবে
    window.onafterprint = () => {
      if (document.getElementById('nomad-admin-print-area')) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
      window.onafterprint = null; // ইভেন্ট ক্লিয়ার
    };
  };

  // 🔹 ২. পারফরম্যান্স অপটিমাইজেশন (useMemo)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

      {/* 🔝 টপ কন্ট্রোল ফিল্টার ও সার্চ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>

        {/* 🔍 সার্চ বার */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="SEARCH BY ID, NAME OR PHONE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#000',
              border: '1px solid #333',
              padding: '10px 15px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 🏷️ স্ট্যাটাস ফিল্টার ট্যাবস */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }}>
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
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📦 অর্ডার কাউন্টার */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold' }}>
          SHOWING {filteredOrders.length} OF {orders.length} ORDERS
        </span>
        <button 
          onClick={fetchAdminOrders}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          REFRESH LIST
        </button>
      </div>

      {/* 📋 অর্ডার লিস্ট / কার্ডস */}
      {loading ? (
        <div style={{ color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px', textAlign: 'center', padding: '50px 0' }}>
          FETCHING ORDER MEMORANDUMS...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '40px', textAlign: 'center', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px' }}>
          NO MATCHING ORDERS FOUND
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusColor = getStatusColor(order.status);
            const isUpdating = updatingOrderId === order.id;

            return (
              <div key={order.id} style={{ backgroundColor: '#050505', border: '1px solid #222', padding: '20px', transition: 'border 0.2s ease' }}>

                {/* কার্ড হেডার */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>

                  <div style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                        #{order.id.slice(0, 8)}... {/* বড় আইডি হলে ভেঙে না যাওয়ার জন্য ট্রাঙ্কেট করা হলো */}
                      </span>
                      <span style={{ fontSize: '9px', backgroundColor: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`, padding: '2px 8px', borderRadius: '2px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        ● {order.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', marginTop: '4px', display: 'block' }}>
                      {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  {/* গ্রাহকের তথ্য */}
                  <div style={{ minWidth: '150px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                      {order.customer_name || 'GUEST CUSTOMER'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>
                      {order.customer_phone || 'NO PHONE'}
                    </span>
                  </div>

                  {/* টাকার পরিমাণ */}
                  <div style={{ minWidth: '100px', textAlign: 'left' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'monospace', display: 'block' }}>
                      ৳{order.total_amount}
                    </span>
                    <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
                      {order.items.length} ITEM(S)
                    </span>
                  </div>

                  {/* ⚡ ইনস্ট্যান্ট স্ট্যাটাস ড্রপডাউন কন্ট্রোল */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        backgroundColor: '#000',
                        color: statusColor,
                        border: `1px solid ${statusColor}`,
                        padding: '8px 12px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: 'none',
                        letterSpacing: '1px'
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} style={{ backgroundColor: '#0a0a0a', color: '#fff' }}>
                          SET TO: {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handlePrintInvoice(order)}
                      title="Print Invoice"
                      style={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        color: '#fff',
                        padding: '8px 12px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        letterSpacing: '1px'
                      }}
                    >
                      PRINT
                    </button>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '6px 12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {isExpanded ? 'HIDE' : 'VIEW'}
                    </button>
                  </div>

                </div>

                {/* 🔽 এক্সপ্যান্ডেড ডিটেইলস (প্রোডাক্টস ও শিপিং এড্রেস) */}
                {isExpanded && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* ঠিকানা */}
                    <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', fontSize: '11px', color: '#aaa', fontFamily: 'monospace', lineHeight: '1.5' }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>SHIPPING ADDRESS:</strong>
                      {order.shipping_address || 'NO ADDRESS PROVIDED'}
                    </div>

                    {/* প্রোডাক্ট আইটেমসমূহ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', backgroundColor: '#000', padding: '10px', border: '1px solid #151515' }}>
                          <img src={item.product_image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover' }} />
                          <div style={{ flexGrow: 1, minWidth: '150px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', display: 'block', textTransform: 'uppercase' }}>
                              {item.product_name}
                            </span>
                            <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
                              SIZE: {item.size} &nbsp;|&nbsp; COLOR: {item.color} &nbsp;|&nbsp; QTY: {item.quantity}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            ৳{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
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
