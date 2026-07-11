import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface OrderHistoryProps {
  userId: string;
}

export default function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchOrderHistory();
    }
  }, [userId]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      // আসল কলাম নাম 'user_id' দিয়ে ফিল্টার এবং 'created_at' দিয়ে সর্ট করা হচ্ছে
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_hidden', false) // যদি অর্ডারের 'is_hidden' ট্রু না হয় তবেই দেখাবে
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // স্ট্যাটাস অনুযায়ী ডট ও টেক্সটের কালার নির্ধারণ
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return { color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)' };
    if (s === 'pending' || s === 'processing') return { color: '#f1c40f', bg: 'rgba(241, 196, 15, 0.1)' };
    if (s === 'cancelled' || s === 'failed') return { color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)' };
    return { color: '#aaa', bg: '#111' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ opacity: 0.3, width: '100%', marginTop: '20px' }}>
        <div style={{ height: '14px', width: '30%', background: '#333', marginBottom: '15px', borderRadius: '4px' }}></div>
        <div style={{ height: '50px', width: '100%', background: '#111', marginBottom: '10px', borderRadius: '4px' }}></div>
        <div style={{ height: '50px', width: '100%', background: '#111', borderRadius: '4px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '25px', fontFamily: "'Inter', sans-serif" }}>
      <p style={{ fontSize: '11px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '600' }}>
        Order History ({orders.length})
      </p>

      {orders.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#444', letterSpacing: '0.5px', marginTop: '10px' }}>
          No orders placed yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusStyle = getStatusStyle(order.status);

            return (
              <div 
                key={order.id}
                style={{ 
                  background: '#0a0a0a', 
                  border: '1px solid #161616', 
                  borderRadius: '6px', 
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleExpand(order.id)}
              >
                {/* মেইন রো (সংক্ষিপ্ত তথ্য) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#eee', letterSpacing: '0.5px' }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555' }}>
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        ৳{order.total_amount}
                      </p>
                    </div>
                    
                    {/* স্ট্যাটাস ব্যাজ */}
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      letterSpacing: '1px', 
                      textTransform: 'uppercase',
                      color: statusStyle.color,
                      backgroundColor: statusStyle.bg,
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {order.status || 'Pending'}
                    </span>

                    {/* অ্যারো আইকন */}
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#444" 
                      strokeWidth="2" 
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* এক্সপ্যান্ডেড সেকশন (বিস্তারিত তথ্য) */}
                {isExpanded && (
                  <div 
                    style={{ 
                      marginTop: '15px', 
                      paddingTop: '15px', 
                      borderTop: '1px solid #161616',
                      fontSize: '12px',
                      color: '#aaa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'default'
                    }}
                    onClick={(e) => e.stopPropagation()} // রো বন্ধ হওয়া আটকাবে ভিতরের ক্লিকে
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555' }}>Customer Name:</span>
                      <span style={{ color: '#fff' }}>{order.customer_name || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555' }}>Phone:</span>
                      <span style={{ color: '#fff' }}>{order.customer_phone || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555' }}>Shipping Address:</span>
                      <span style={{ color: '#fff', textAlign: 'right', maxWidth: '70%' }}>{order.shipping_address || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555' }}>Payment Method:</span>
                      <span style={{ color: '#fff', textTransform: 'uppercase' }}>{order.payment_method || 'COD'}</span>
                    </div>
                    {order.transaction_id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>Transaction ID:</span>
                        <span style={{ color: '#2ecc71', fontFamily: 'monospace' }}>{order.transaction_id}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px', color: '#444' }}>
                      <span>Vat: ৳{order.vat_amount || 0} | Delivery: ৳{order.delivery_charge || 0}</span>
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
}
