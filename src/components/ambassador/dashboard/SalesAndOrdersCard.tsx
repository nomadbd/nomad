import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface SalesAndOrdersCardProps {
  ambassadorId: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price?: number;
  products?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  ambassador_commission: number;
  order_items?: OrderItem[];
}

export default function SalesAndOrdersCard({ ambassadorId }: SalesAndOrdersCardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // ফিল্টার ও বটম শীট মডালের স্টেট
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'CANCELLED' | null>(null);

  useEffect(() => {
    if (!ambassadorId) return;

    const fetchAmbassadorOrders = async () => {
      setLoading(true);
      try {
        //Supabase Query: গোপন তথ্য (নাম, ফোন, ঠিকানা) এড়িয়ে কেবল প্রয়োজনীয় কলাম ও প্রোডাক্ট টেনে আনা হচ্ছে
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total_amount,
            ambassador_commission,
            order_items (
              id,
              quantity,
              products (
                name
              )
            )
          `)
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data as unknown as Order[] || []);
      } catch (err) {
        console.error('Error fetching ambassador sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbassadorOrders();
  }, [ambassadorId]);

  // স্টেটাস অনুযায়ী গণনা
  const successfulOrders = orders.filter((o) => ['Delivered', 'Received', 'Completed'].includes(o.status));
  const pendingOrders = orders.filter((o) => ['Pending', 'Processing', 'Shipped'].includes(o.status));
  const cancelledOrders = orders.filter((o) => ['Cancelled', 'Returned', 'Failed'].includes(o.status));

  // মোট সেলস ভ্যালু
  const totalSalesAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // ফিল্টার অনুযায়ী প্রদর্শিত অর্ডার লিস্ট
  const getFilteredOrders = () => {
    if (activeFilter === 'SUCCESS') return successfulOrders;
    if (activeFilter === 'PENDING') return pendingOrders;
    if (activeFilter === 'CANCELLED') return cancelledOrders;
    return orders; // ALL
  };

  const filteredOrders = getFilteredOrders();

  // স্টেটাস অনুযায়ী কালার ব্যাকগ্রাউন্ড
  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (['delivered', 'received', 'completed'].includes(s)) {
      return { bg: '#082210', color: '#4dff88', border: '#115522' };
    }
    if (['pending', 'processing', 'shipped'].includes(s)) {
      return { bg: '#291d03', color: '#ffcc00', border: '#5c4308' };
    }
    return { bg: '#290909', color: '#ff4d4d', border: '#5c1111' };
  };

  return (
    <>
      <section
        style={{
          backgroundColor: '#050505',
          border: '1px solid #1a1a1a',
          padding: '16px 14px',
          borderRadius: '12px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* হেডার */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
              SALES & ORDERS PERFORMANCE
            </h2>
            <p style={{ fontSize: '10px', color: '#888', margin: '3px 0 0 0' }}>
              Track real-time status of orders placed through your link.
            </p>
          </div>
          <span
            style={{
              fontSize: '10px',
              color: '#34d399',
              backgroundColor: '#071f15',
              border: '1px solid #0f4f34',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            TOTAL VOLUME: ৳{totalSalesAmount.toLocaleString()}
          </span>
        </div>

        {/* কার্ডের গ্রিড (ক্লিকেবল) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '10px'
          }}
        >
          {/* সব অর্ডার */}
          <div
            onClick={() => setActiveFilter('ALL')}
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #222222',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>TOTAL ORDERS</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {loading ? '...' : orders.length}
            </div>
            <span style={{ fontSize: '9px', color: '#666', display: 'block', marginTop: '2px' }}>View all orders ›</span>
          </div>

          {/* সফল অর্ডার */}
          <div
            onClick={() => setActiveFilter('SUCCESS')}
            style={{
              backgroundColor: '#04140a',
              border: '1px solid #0a381b',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '10px', color: '#4dff88', textTransform: 'uppercase', fontWeight: '600' }}>SUCCESSFUL</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dff88', marginTop: '4px' }}>
              {loading ? '...' : successfulOrders.length}
            </div>
            <span style={{ fontSize: '9px', color: '#2d9953', display: 'block', marginTop: '2px' }}>Delivered ›</span>
          </div>

          {/* প্রসেসিং/পেন্ডিং অর্ডার */}
          <div
            onClick={() => setActiveFilter('PENDING')}
            style={{
              backgroundColor: '#171103',
              border: '1px solid #3d2d06',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '10px', color: '#ffcc00', textTransform: 'uppercase', fontWeight: '600' }}>PROCESSING</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffcc00', marginTop: '4px' }}>
              {loading ? '...' : pendingOrders.length}
            </div>
            <span style={{ fontSize: '9px', color: '#a38308', display: 'block', marginTop: '2px' }}>In Transit ›</span>
          </div>

          {/* ক্যানসেলড অর্ডার */}
          <div
            onClick={() => setActiveFilter('CANCELLED')}
            style={{
              backgroundColor: '#1c0808',
              border: '1px solid #401313',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '10px', color: '#ff4d4d', textTransform: 'uppercase', fontWeight: '600' }}>CANCELLED</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4d', marginTop: '4px' }}>
              {loading ? '...' : cancelledOrders.length}
            </div>
            <span style={{ fontSize: '9px', color: '#a33333', display: 'block', marginTop: '2px' }}>Failed/Returned ›</span>
          </div>
        </div>
      </section>

      {/* ----------------- BOTTMSHEET / MODAL FOR ORDER DETAILS ----------------- */}
      {activeFilter !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setActiveFilter(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()} // শীটের ভেতরে ক্লিক করলে যেন বন্ধ না হয়
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              backgroundColor: '#0a0a0a',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              border: '1px solid #222222',
              padding: '20px 16px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.25s ease-out'
            }}
          >
            {/* মডাল হেডার */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f1f1f', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {activeFilter === 'ALL' && 'ALL ORDERS HISTORY'}
                  {activeFilter === 'SUCCESS' && 'SUCCESSFUL DELIVERED ORDERS'}
                  {activeFilter === 'PENDING' && 'PROCESSING / IN-TRANSIT ORDERS'}
                  {activeFilter === 'CANCELLED' && 'CANCELLED / RETURNED ORDERS'}
                </h3>
                <span style={{ fontSize: '11px', color: '#888' }}>Showing {filteredOrders.length} items</span>
              </div>
              <button
                onClick={() => setActiveFilter(null)}
                style={{
                  backgroundColor: '#1f1f1f',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            </div>

            {/* মডাল বডি - অর্ডার লিস্ট */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666', fontSize: '12px' }}>
                  NO ORDERS FOUND IN THIS CATEGORY.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeStyle(order.status);
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: '#050505',
                        border: '1px solid #1a1a1a',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* টপ রো: অর্ডার আইডি, তারিখ ও স্টেটাস */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '10px', color: '#666', display: 'block', marginTop: '2px' }}>
                            {orderDate}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* প্রোডাক্টের তালিকা (গ্রাহকের নাম/ঠিকানা এখানে থাকবে না) */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div style={{ backgroundColor: '#0a0a0a', padding: '6px 8px', borderRadius: '4px', fontSize: '11px', color: '#ccc' }}>
                          {order.order_items.map((item, idx) => (
                            <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                              <span>• {item.products?.name || 'Item'}</span>
                              <span style={{ color: '#888' }}>x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* বটম রো: প্রোডাক্ট প্রাইস ও আপনার কমিশন */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #1f1f1f', paddingTop: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>
                          Order Total: <strong style={{ color: '#fff' }}>৳{(order.total_amount || 0).toLocaleString()}</strong>
                        </span>
                        <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>
                          Commission: ৳{(order.ambassador_commission || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
