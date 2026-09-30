import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface SalesAndOrdersCardProps {
  ambassadorId: string;
}

interface OrderItem {
  id: string;
  quantity: number;
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
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'CANCELLED' | null>(null);

  useEffect(() => {
    if (!ambassadorId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
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
              products ( name )
            )
          `)
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as unknown as Order[]) || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [ambassadorId]);

  const successfulOrders = orders.filter((o) => ['Delivered', 'Received', 'Completed'].includes(o.status));
  const pendingOrders = orders.filter((o) => ['Pending', 'Processing', 'Shipped'].includes(o.status));
  const cancelledOrders = orders.filter((o) => ['Cancelled', 'Returned', 'Failed'].includes(o.status));

  const getFilteredOrders = () => {
    if (activeFilter === 'SUCCESS') return successfulOrders;
    if (activeFilter === 'PENDING') return pendingOrders;
    if (activeFilter === 'CANCELLED') return cancelledOrders;
    return orders;
  };

  const filteredOrders = getFilteredOrders();

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

  const getFilterTitle = () => {
    switch (activeFilter) {
      case 'SUCCESS': return 'Successful Orders';
      case 'PENDING': return 'Pending Orders';
      case 'CANCELLED': return 'Cancelled Orders';
      default: return 'All Orders';
    }
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
        {/* মিনিমাল হেডার */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#888', fontWeight: '700' }}>
            ORDERS
          </h2>
        </div>

        {/* কার্ডের গ্রিড */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}
        >
          {/* Total Orders */}
          <div
            onClick={() => setActiveFilter('ALL')}
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #222',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>TOTAL</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
              {loading ? '...' : orders.length}
            </div>
          </div>

          {/* Successful */}
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
            <span style={{ fontSize: '10px', color: '#4dff88', textTransform: 'uppercase', fontWeight: '600' }}>SUCCESS</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4dff88', marginTop: '2px' }}>
              {loading ? '...' : successfulOrders.length}
            </div>
          </div>

          {/* Pending */}
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
            <span style={{ fontSize: '10px', color: '#ffcc00', textTransform: 'uppercase', fontWeight: '600' }}>PENDING</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffcc00', marginTop: '2px' }}>
              {loading ? '...' : pendingOrders.length}
            </div>
          </div>

          {/* Cancelled */}
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
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4d', marginTop: '2px' }}>
              {loading ? '...' : cancelledOrders.length}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- BOTTOM SHEET ----------------- */}
      {activeFilter !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setActiveFilter(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '75vh',
              backgroundColor: '#0a0a0a',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              border: '1px solid #222',
              padding: '16px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* বটম শীট হেডার */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #1f1f1f', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', margin: 0, color: '#fff', fontWeight: '600' }}>
                {getFilterTitle()} ({filteredOrders.length})
              </h3>
              <button
                onClick={() => setActiveFilter(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px'
                }}
              >
                ✕
              </button>
            </div>

            {/* অর্ডার লিস্ট */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#555', fontSize: '12px' }}>
                  No orders found.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeStyle(order.status);
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: '#050505',
                        border: '1px solid #1a1a1a',
                        borderRadius: '6px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#fff' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '10px', color: '#555', marginLeft: '8px' }}>
                            {orderDate}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {order.status}
                        </span>
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div style={{ fontSize: '10px', color: '#aaa', paddingLeft: '2px' }}>
                          {order.order_items.map((item, idx) => (
                            <div key={item.id || idx}>
                              • {item.products?.name || 'Item'} (x{item.quantity})
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #151515', paddingTop: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '10px', color: '#777' }}>
                          Total: <strong style={{ color: '#eee' }}>৳{(order.total_amount || 0).toLocaleString()}</strong>
                        </span>
                        <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>
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
