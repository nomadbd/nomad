import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface OrderItem {
  id: string;
  customer_name: string;
  created_at: string;
  total_amount: number;
  status: string;
}

const AdminOverview: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [receivedOrders, setReceivedOrders] = useState<number>(0);
  const [shippedOrders, setShippedOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [activeCatalogItems, setActiveCatalogItems] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);

  const fetchMetricsData = async () => {
    setLoading(true);
    try {
      // ১. সুপাবেস থেকে সব অর্ডার ফেচ
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (orders) {
        setTotalOrders(orders.length);
        
        // স্ট্যাটাস নরম্যালাইজার ফাংশন (Case Insensitive Matching)
        const normalize = (st: string) => (st || '').trim().toUpperCase();

        // মোট আয় (CANCELLED বাদে)
        const rev = orders
          .filter(o => normalize(o.status) !== 'CANCELLED')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        setTotalRevenue(rev);

        // 🟢 সঠিক ফিল্টারিং (স্মল লেটার/ক্যাপিটাল লেটার উভয় সাপোর্ট করবে)
        const pending = orders.filter(o => {
          const s = normalize(o.status);
          return s === 'PENDING' || s === 'PROCESSING' || s === 'HOLD';
        }).length;

        const received = orders.filter(o => normalize(o.status) === 'RECEIVED').length;
        const shipped = orders.filter(o => normalize(o.status) === 'SHIPPED').length;
        const delivered = orders.filter(o => normalize(o.status) === 'DELIVERED').length;

        setPendingOrders(pending);
        setReceivedOrders(received);
        setShippedOrders(shipped);
        setDeliveredOrders(delivered);

        // সাম্প্রতিক ৫টি অর্ডার
        setRecentOrders(orders.slice(0, 5));
      }

      // ২. ক্যাটালগ প্রোডাক্ট কাউন্ট ফেচ
      const { count: productCount, error: prodErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (!prodErr && productCount !== null) {
        setActiveCatalogItems(productCount);
      }

    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsData();
  }, []);

  // ডাইনামিক স্ট্যাটাস ব্যাজ
  const renderStatusBadge = (status: string) => {
    const s = (status || '').trim().toUpperCase();
    let color = '#aaa';
    let bg = '#111';

    if (s === 'PENDING' || s === 'PROCESSING') { color = '#a855f7'; bg = '#1e102a'; }
    else if (s === 'RECEIVED') { color = '#3b82f6'; bg = '#0d1d3a'; }
    else if (s === 'SHIPPED') { color = '#eab308'; bg = '#2a2208'; }
    else if (s === 'DELIVERED') { color = '#22c55e'; bg = '#092b15'; }

    return (
      <span style={{
        backgroundColor: bg,
        color: color,
        padding: '3px 8px',
        fontSize: '9px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: '1px',
        border: `1px solid ${color}44`,
        whiteSpace: 'nowrap'
      }}>
        ● {s}
      </span>
    );
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'monospace, sans-serif' }}>
      
      {/* 🔝 হেডার ও রিফ্রেশ বাটন */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', margin: 0 }}>
            HQ METRICS & OVERVIEW
          </h2>
          <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>
            REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
          </span>
        </div>

        <button
          onClick={fetchMetricsData}
          disabled={loading}
          style={{
            backgroundColor: '#050505',
            border: '1px solid #333',
            color: '#ccc',
            padding: '6px 12px',
            fontSize: '10px',
            fontFamily: 'monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '1px'
          }}
        >
          {loading ? 'REFRESHING...' : '↻ RELOAD'}
        </button>
      </div>

      {/* 📊 ১. ৪টি মূল মেট্রিক কার্ড */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '25px'
      }}>
        
        {/* মোট আয় */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            TOTAL GROSS REVENUE
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>
            ৳{totalRevenue.toLocaleString()}
          </span>
          <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '6px' }}>
            * EXCLUDING CANCELLED
          </span>
        </div>

        {/* মোট অর্ডার */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            TOTAL ORDERS LOGGED
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            {totalOrders}
          </span>
          <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '6px' }}>
            * ALL-TIME RECORD
          </span>
        </div>

        {/* পেন্ডিং / রিসিভড */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            PENDING & RECEIVED
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <span style={{ color: '#a855f7' }}>{pendingOrders}</span>
            <span style={{ fontSize: '12px', color: '#444', margin: '0 4px' }}>/</span>
            <span style={{ color: '#3b82f6', fontSize: '14px' }}>{receivedOrders} REC</span>
          </div>
          <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '6px' }}>
            * REQUIRES PROCESSING
          </span>
        </div>

        {/* ক্যাটালগ আইটেম */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            ACTIVE CATALOG ITEMS
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            {activeCatalogItems}
          </span>
          <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '6px' }}>
            * LIVE IN STORE
          </span>
        </div>

      </div>

      {/* 📈 ২. ফুলফিলমেন্ট স্ট্যাটাস প্রোগ্রেস বার (ফিক্সড) */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', marginBottom: '25px' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
          FULFILLMENT STATUS BREAKDOWN
        </span>
        
        {/* ডাইনামিক প্রোগ্রেস বার কন্টেইনার */}
        <div style={{ display: 'flex', height: '8px', backgroundColor: '#181818', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${totalOrders ? (pendingOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#a855f7', transition: 'width 0.4s ease' }} />
          <div style={{ width: `${totalOrders ? (receivedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#3b82f6', transition: 'width 0.4s ease' }} />
          <div style={{ width: `${totalOrders ? (shippedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#eab308', transition: 'width 0.4s ease' }} />
          <div style={{ width: `${totalOrders ? (deliveredOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#22c55e', transition: 'width 0.4s ease' }} />
        </div>

        {/* স্ট্যাটাস কাউন্ট লেবেল */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '10px' }}>
          <span><strong style={{ color: '#a855f7' }}>● PENDING:</strong> {pendingOrders}</span>
          <span><strong style={{ color: '#3b82f6' }}>● RECEIVED:</strong> {receivedOrders}</span>
          <span><strong style={{ color: '#eab308' }}>● SHIPPED:</strong> {shippedOrders}</span>
          <span><strong style={{ color: '#22c55e' }}>● DELIVERED:</strong> {deliveredOrders}</span>
        </div>
      </div>

      {/* 📑 ৩. রিসেন্ট অর্ডার মেমোরেন্ডাম টেবিল */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', display: 'block', marginBottom: '15px' }}>
          RECENT ORDERS MEMORANDUM
        </span>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222', color: '#666' }}>
                <th style={{ padding: '8px 10px' }}>ORDER ID</th>
                <th style={{ padding: '8px 10px' }}>CUSTOMER</th>
                <th style={{ padding: '8px 10px' }}>DATE</th>
                <th style={{ padding: '8px 10px' }}>AMOUNT</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#555' }}>
                    NO LOGGED ORDERS FOUND
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '10px', color: '#ccc' }}>
                      #{order.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '10px', color: '#fff' }}>
                      {order.customer_name || 'GUEST'}
                    </td>
                    <td style={{ padding: '10px', color: '#888' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      ৳{order.total_amount}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {renderStatusBadge(order.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
