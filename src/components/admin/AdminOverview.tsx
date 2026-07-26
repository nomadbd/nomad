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
      
      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr; /* মোবাইল ১ কলাম */
          gap: 12px;
          margin-bottom: 25px;
        }

        /* 📱 মোবাইলে "Desktop Site" অন করলে বা ট্যাবলেটে ২ কলামে কার্ড থাকবে */
        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* 💻 বড় ডেস্কটপ স্ক্রিনে ৪ কলামে চমৎকার দেখাবে */
        @media (min-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .metric-card {
          background-color: #060606;
          border: 1px solid #1a1a1a;
          padding: 16px;
          border-radius: 2px;
          box-sizing: border-box;
          width: 100%;
        }
      `}</style>

      {/* 🔝 হেডার */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#fff' }}>
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
            padding: '7px 14px',
            fontSize: '10px',
            fontFamily: 'monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '1px'
          }}
        >
          {loading ? 'SYNCING...' : '↻ RELOAD'}
        </button>
      </div>

      {/* 📊 ১. ফ্লুইড ৪টি মেট্রিক কার্ড */}
      <div className="metrics-grid">
        
        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>TOTAL REVENUE</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e' }}>৳{totalRevenue.toLocaleString()}</div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* EXCLUDING CANCELLED</span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>TOTAL ORDERS</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{totalOrders}</div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* ALL-TIME LOGGED</span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>PENDING & REC</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
            <span style={{ color: '#a855f7' }}>{pendingOrders}</span>
            <span style={{ fontSize: '14px', color: '#444', margin: '0 4px' }}>/</span>
            <span style={{ color: '#3b82f6', fontSize: '16px' }}>{receivedOrders} REC</span>
          </div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* REQUIRES PROCESSING</span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>CATALOG ITEMS</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{activeCatalogItems}</div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* LIVE IN STORE</span>
        </div>

      </div>

      {/* 📈 ২. ফুলফিলমেন্ট ব্রেকডাউন */}
      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '16px', marginBottom: '25px', borderRadius: '2px' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          FULFILLMENT STATUS BREAKDOWN
        </span>
        
        <div style={{ display: 'flex', height: '6px', backgroundColor: '#111', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${totalOrders ? (pendingOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#a855f7' }} />
          <div style={{ width: `${totalOrders ? (receivedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#3b82f6' }} />
          <div style={{ width: `${totalOrders ? (shippedOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#eab308' }} />
          <div style={{ width: `${totalOrders ? (deliveredOrders / totalOrders) * 100 : 0}%`, backgroundColor: '#22c55e' }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '10px' }}>
          <span><strong style={{ color: '#a855f7' }}>● PENDING:</strong> {pendingOrders}</span>
          <span><strong style={{ color: '#3b82f6' }}>● RECEIVED:</strong> {receivedOrders}</span>
          <span><strong style={{ color: '#eab308' }}>● SHIPPED:</strong> {shippedOrders}</span>
          <span><strong style={{ color: '#22c55e' }}>● DELIVERED:</strong> {deliveredOrders}</span>
        </div>
      </div>

      {/* 📑 ৩. রিসেন্ট অর্ডারস টেবিল */}
      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '2px', overflowX: 'auto' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          RECENT ORDERS MEMORANDUM
        </span>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px', minWidth: '500px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222', color: '#555' }}>
              <th style={{ padding: '8px' }}>ORDER ID</th>
              <th style={{ padding: '8px' }}>CUSTOMER</th>
              <th style={{ padding: '8px' }}>DATE</th>
              <th style={{ padding: '8px' }}>AMOUNT</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '10px 8px', color: '#aaa' }}>#{order.id.slice(0, 8)}...</td>
                <td style={{ padding: '10px 8px', color: '#fff' }}>{order.customer_name || 'GUEST'}</td>
                <td style={{ padding: '10px 8px', color: '#666' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#fff' }}>৳{order.total_amount}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{renderStatusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminOverview;
