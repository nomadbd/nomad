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
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (orders) {
        setTotalOrders(orders.length);
        const normalize = (st: string) => (st || '').trim().toUpperCase();

        const rev = orders
          .filter(o => normalize(o.status) !== 'CANCELLED')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        setTotalRevenue(rev);

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

        setRecentOrders(orders.slice(0, 5));
      }

      const { count: productCount, error: prodErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (!prodErr && productCount !== null) {
        setActiveCatalogItems(productCount);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchMetricsData();
  }, []);

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
        borderRadius: '2px',
        whiteSpace: 'nowrap'
      }}>
        ● {s}
      </span>
    );
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'monospace, sans-serif', width: '100%' }}>
      
      {/* 🟢 ফ্লুইড রেসপন্সিভ সিএসএস রুলস */}
      <style>{`
        @keyframes shimmerAnimation {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        .skeleton-loader {
          background: linear-gradient(90deg, #0d0d0d 25%, #1f1f1f 50%, #0d0d0d 75%);
          background-size: 400px 100%;
          animation: shimmerAnimation 1.4s infinite ease-in-out;
          border-radius: 2px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr; /* মোবাইলে ১ কলাম */
          gap: 14px;
          margin-bottom: 25px;
        }

        @media (min-width: 550px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr); /* মাঝারি স্ক্রিনে ২ কলাম */
          }
        }

        @media (min-width: 1100px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr); /* বড় ডেস্কটপে ৪ কলাম */
          }
        }

        .metric-card {
          background-color: #060606;
          border: 1px solid #1a1a1a;
          padding: 18px;
          border-radius: 2px;
          box-sizing: border-box;
          width: 100%;
        }

        .card-revenue { box-shadow: 0 0 15px rgba(34, 197, 94, 0.06); }
        .card-pending { box-shadow: 0 0 15px rgba(168, 85, 247, 0.06); }
        .card-catalog { box-shadow: 0 0 15px rgba(59, 130, 246, 0.06); }

        .desktop-table-view { display: block; overflow-x: auto; }
        .mobile-card-view { display: none; }

        @media (max-width: 767px) {
          .desktop-table-view { display: none; }
          .mobile-card-view { display: flex; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* 🔝 টপ বার ও রিফ্রেশ কন্টাক্ট */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#fff' }}>
            HQ METRICS & OVERVIEW
          </h2>
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>
            REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
          </span>
        </div>

        <button
          onClick={fetchMetricsData}
          disabled={loading}
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222',
            color: '#ccc',
            padding: '8px 16px',
            fontSize: '10px',
            fontFamily: 'monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {loading ? 'SYNCING...' : 'RELOAD'}
        </button>
      </div>

      {/* 📊 ১. স্মার্ট ফ্লেক্সিবল কলাম মেট্রিক কার্ডস */}
      <div className="metrics-grid">
        
        {/* মোট আয় */}
        <div className="metric-card card-revenue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>TOTAL REVENUE</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          {loading ? (
            <div className="skeleton-loader" style={{ height: '30px', width: '80%', marginBottom: '8px' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', letterSpacing: '0.5px' }}>
              ৳{totalRevenue.toLocaleString()}
            </div>
          )}
          <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '6px' }}>
            * EXCLUDING CANCELLED
          </span>
        </div>

        {/* মোট অর্ডার */}
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>TOTAL ORDERS</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          </div>
          {loading ? (
            <div className="skeleton-loader" style={{ height: '30px', width: '60%', marginBottom: '8px' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
              {totalOrders}
            </div>
          )}
          <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '6px' }}>
            * ALL-TIME LOGGED
          </span>
        </div>

        {/* পেন্ডিং ও রিসিভড */}
        <div className="metric-card card-pending">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>PENDING & REC</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          {loading ? (
            <div className="skeleton-loader" style={{ height: '30px', width: '70%', marginBottom: '8px' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              <span style={{ color: '#a855f7' }}>{pendingOrders}</span>
              <span style={{ fontSize: '16px', color: '#444', margin: '0 6px' }}>/</span>
              <span style={{ color: '#3b82f6', fontSize: '18px' }}>{receivedOrders} REC</span>
            </div>
          )}
          <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '6px' }}>
            * REQUIRES PROCESSING
          </span>
        </div>

        {/* ক্যাটালগ আইটেম */}
        <div className="metric-card card-catalog">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>CATALOG ITEMS</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          {loading ? (
            <div className="skeleton-loader" style={{ height: '30px', width: '50%', marginBottom: '8px' }} />
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
              {activeCatalogItems}
            </div>
          )}
          <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '6px' }}>
            * LIVE IN STORE
          </span>
        </div>

      </div>

      {/* 📈 ২. ফুলফিলমেন্ট ব্রেকডাউন */}
      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '18px', marginBottom: '25px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            FULFILLMENT STATUS BREAKDOWN
          </span>
        </div>
        
        <div style={{ display: 'flex', height: '8px', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ width: `${totalOrders ? (pendingOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#a855f7' }} title="Pending" />
          <div style={{ width: `${totalOrders ? (receivedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#3b82f6' }} title="Received" />
          <div style={{ width: `${totalOrders ? (shippedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#eab308' }} title="Shipped" />
          <div style={{ width: `${totalOrders ? (deliveredOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#22c55e' }} title="Delivered" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '10px' }}>
          <span><strong style={{ color: '#a855f7' }}>● PENDING:</strong> {pendingOrders}</span>
          <span><strong style={{ color: '#3b82f6' }}>● RECEIVED:</strong> {receivedOrders}</span>
          <span><strong style={{ color: '#eab308' }}>● SHIPPED:</strong> {shippedOrders}</span>
          <span><strong style={{ color: '#22c55e' }}>● DELIVERED:</strong> {deliveredOrders}</span>
        </div>
      </div>

      {/* 📑 ৩. রিসেন্ট অর্ডারস (মোবাইলে কার্ড ভিউ & পিসিতে টেবিল ভিউ) */}
      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '18px', borderRadius: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            RECENT ORDERS MEMORANDUM
          </span>
        </div>

        {/* 💻 ডেস্কটপ টেবিল ভিউ */}
        <div className="desktop-table-view">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222', color: '#555' }}>
                <th style={{ padding: '10px' }}>ORDER ID</th>
                <th style={{ padding: '10px' }}>CUSTOMER</th>
                <th style={{ padding: '10px' }}>DATE</th>
                <th style={{ padding: '10px' }}>AMOUNT</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((n) => (
                  <tr key={n}>
                    <td colSpan={5} style={{ padding: '10px' }}>
                      <div className="skeleton-loader" style={{ height: '22px', width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ padding: '12px 10px', color: '#aaa', fontWeight: 'bold' }}>
                    #{order.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '12px 10px', color: '#fff' }}>
                    {order.customer_name || 'GUEST'}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#666' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#fff' }}>
                    ৳{order.total_amount}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {renderStatusBadge(order.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 মোবাইল কার্ড ভিউ */}
        <div className="mobile-card-view">
          {recentOrders.map((order) => (
            <div key={order.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 'bold' }}>#{order.id.slice(0, 8)}...</span>
                {renderStatusBadge(order.status)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                <span style={{ color: '#fff' }}>{order.customer_name || 'GUEST'}</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>৳{order.total_amount}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
