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
      // ১. অর্ডার ডেটা ফেচ
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (orders) {
        setTotalOrders(orders.length);
        
        // মোট আয় (ক্যান্সেলড বাদে)
        const rev = orders
          .filter(o => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        setTotalRevenue(rev);

        // স্ট্যাটাস ফিল্টারিং
        const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
        const received = orders.filter(o => o.status === 'RECEIVED').length;
        const shipped = orders.filter(o => o.status === 'SHIPPED').length;
        const delivered = orders.filter(o => o.status === 'DELIVERED').length;

        setPendingOrders(pending);
        setReceivedOrders(received);
        setShippedOrders(shipped);
        setDeliveredOrders(delivered);

        // সাম্প্রতিক ৫টি অর্ডার
        setRecentOrders(orders.slice(0, 5));
      }

      // ২. প্রোডাক্ট ক্যাটালগ আইটেম ফেচ
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

  // স্ট্যাটাস ব্যাজের কালার ও স্টাইল হ্যান্ডলার
  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
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
      
      {/* 🔝 হেডার এবং রিফ্রেশ বাটন (একই লাইনে রেসপন্সিভভাবে সাজানো) */}
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

      {/* 📊 ১. ৪টি মূল মেট্রিক কার্ড (মোবাইলে ২-কলাম এবং ডেক্সটপে ৪-কলাম অটো-ফিট) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '25px'
      }}>
        
        {/* কার্ড ১: মোট আয় */}
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

        {/* কার্ড ২: মোট অর্ডার */}
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

        {/* কার্ড ৩: পেন্ডিং / রিসিভড */}
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

        {/* কার্ড ৪: এক্টিভ প্রোডাক্ট ক্যাটালগ */}
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

      {/* 📈 ২. ফুলফিলমেন্ট স্ট্যাটাস ব্রেকডাউন */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px', marginBottom: '25px' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
          FULFILLMENT STATUS BREAKDOWN
        </span>
        
        {/* ভিজ্যুয়াল প্রোগ্রেস বার */}
        <div style={{ display: 'flex', height: '6px', backgroundColor: '#111', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${totalOrders ? (pendingOrders/totalOrders)*100 : 0}%`, backgroundColor: '#a855f7' }} />
          <div style={{ width: `${totalOrders ? (receivedOrders/totalOrders)*100 : 0}%`, backgroundColor: '#3b82f6' }} />
          <div style={{ width: `${totalOrders ? (shippedOrders/totalOrders)*100 : 0}%`, backgroundColor: '#eab308' }} />
          <div style={{ width: `${totalOrders ? (deliveredOrders/totalOrders)*100 : 0}%`, backgroundColor: '#22c55e' }} />
        </div>

        {/* লেজেন্ডস (সব ডিভাইসে মানানসই) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '10px' }}>
          <span><strong style={{ color: '#a855f7' }}>● PENDING:</strong> {pendingOrders}</span>
          <span><strong style={{ color: '#3b82f6' }}>● RECEIVED:</strong> {receivedOrders}</span>
          <span><strong style={{ color: '#eab308' }}>● SHIPPED:</strong> {shippedOrders}</span>
          <span><strong style={{ color: '#22c55e' }}>● DELIVERED:</strong> {deliveredOrders}</span>
        </div>
      </div>

      {/* 📑 ৩. রিসেন্ট অর্ডার মেমোরেন্ডাম (টেবিল কেটে যাওয়া রোধ করার ফিক্সসহ) */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '15px' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', display: 'block', marginBottom: '15px' }}>
          RECENT ORDERS MEMORANDUM
        </span>

        {/* 🟢 টেবিলকে হরিজন্টাল স্ক্রোলযোগ্য করা হলো যেন ছোট স্ক্রিনেও কলাম না কাটে */}
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
