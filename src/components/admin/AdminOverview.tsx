import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface OrderItem {
  id: string;
  customer_name: string;
  created_at: string;
  total_amount: number;
  status: string;
}

interface AdminOverviewProps {
  onNavigateToFinance?: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateToFinance }) => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [processingOrders, setProcessingOrders] = useState<number>(0);
  const [receivedOrders, setReceivedOrders] = useState<number>(0);
  const [shippedOrders, setShippedOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);

  const [activeCatalogItems, setActiveCatalogItems] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);

  const isDelivered = (st: string) => (st || '').trim().toUpperCase().includes('DELIVER');
  const isPending = (st: string) => (st || '').trim().toUpperCase().includes('PENDING');
  const isProcessing = (st: string) => (st || '').trim().toUpperCase().includes('PROCESS');
  const isReceived = (st: string) => (st || '').trim().toUpperCase().includes('RECEIV');
  const isShipped = (st: string) => (st || '').trim().toUpperCase().includes('SHIP');
  const isCancelled = (st: string) => (st || '').trim().toUpperCase().includes('CANCEL');

  const fetchMetricsData = async () => {
    try {
      const { data: metrics, error: rpcErr } = await supabase.rpc('get_admin_metrics');

      if (rpcErr) {
        console.error('RPC Error:', rpcErr);
      } else if (metrics) {
        setTotalOrders(Number(metrics.total_orders) || 0);
        setTotalRevenue(Number(metrics.total_revenue) || 0);
        setPendingOrders(Number(metrics.pending) || 0);
        setProcessingOrders(Number(metrics.processing) || 0);
        setReceivedOrders(Number(metrics.received) || 0);
        setShippedOrders(Number(metrics.shipped) || 0);
        setDeliveredOrders(Number(metrics.delivered) || 0);
        setCancelledOrders(Number(metrics.cancelled) || 0);
      }

      const { data: latestFive } = await supabase
        .from('orders')
        .select('id, customer_name, created_at, total_amount, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (latestFive) setRecentOrders(latestFive);

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productCount !== null) setActiveCatalogItems(productCount);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchMetricsData();

    const ordersSubscription = supabase
      .channel('admin-overview-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchMetricsData())
      .subscribe();

    const productsSubscription = supabase
      .channel('admin-overview-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchMetricsData())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, []);

  const renderStatusBadge = (status: string) => {
    const raw = (status || '').trim().toUpperCase();
    let displayStatus = raw;
    let color = '#aaa';
    let bg = '#111';

    if (isPending(raw)) { color = '#eab308'; bg = '#2a2208'; displayStatus = 'PENDING'; }
    else if (isProcessing(raw)) { color = '#a855f7'; bg = '#1e102a'; displayStatus = 'PROCESSING'; }
    else if (isReceived(raw)) { color = '#3b82f6'; bg = '#0d1d3a'; displayStatus = 'RECEIVED'; }
    else if (isShipped(raw)) { color = '#06b6d4'; bg = '#082f35'; displayStatus = 'SHIPPED'; }
    else if (isDelivered(raw)) { color = '#22c55e'; bg = '#092b15'; displayStatus = 'DELIVERED'; }
    else if (isCancelled(raw)) { color = '#ef4444'; bg = '#2d1212'; displayStatus = 'CANCELLED'; }

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
        ● {displayStatus}
      </span>
    );
  };

  const calcPercent = (val: number) => {
    if (!totalOrders || totalOrders <= 0) return 0;
    const p = (val / totalOrders) * 100;
    return isNaN(p) ? 0 : Math.min(Math.max(p, 0), 100);
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'monospace, sans-serif', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      <style>{`
        * { box-sizing: border-box; }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 25px;
          width: 100%;
        }

        @media (min-width: 480px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

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
          width: 100%;
          min-width: 0; /* কার্ডগুলোকে রেসপন্সিভ রাখতে */
        }

        .revenue-card-clickable {
          cursor: pointer;
        }

        .revenue-card-clickable:hover {
          border-color: #22c55e !important;
          background-color: #080a08;
        }

        .table-row-hover:hover {
          background-color: #0c0c0c;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto; /* টেবিল বড় হলে শুধু টেবিলের অংশ স্ক্রল হবে */
          -webkit-overflow-scrolling: touch;
        }

        /* টেবিলের কন্টেন্ট যেন ভেঙে না যায় তাই nowrap করা হয়েছে */
        .recent-orders-table th, 
        .recent-orders-table td {
          white-space: nowrap;
        }
      `}</style>

      <div style={{ marginBottom: '20px', width: '100%' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#fff' }}>
          HQ METRICS & OVERVIEW
        </h2>
        <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>
          REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
        </span>
      </div>

      <div className="metrics-grid">
        <div 
          className="metric-card revenue-card-clickable"
          onClick={() => onNavigateToFinance && onNavigateToFinance()}
        >
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
            TOTAL REVENUE
          </span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ৳{formatNumber(totalRevenue)}
          </div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>
            * EXCLUDING CANCELLED
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>TOTAL ORDERS</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatNumber(totalOrders)}
          </div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* ALL-TIME LOGGED</span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>ACTIVE QUEUE</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: '#a855f7' }}>{formatNumber(pendingOrders + processingOrders)}</span>
            <span style={{ fontSize: '14px', color: '#444', margin: '0 6px' }}>/</span>
            <span style={{ color: '#3b82f6', fontSize: '15px' }}>{formatNumber(receivedOrders)} REC</span>
          </div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* PENDING & PROCESSING</span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>CATALOG ITEMS</span>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatNumber(activeCatalogItems)}</div>
          <span style={{ fontSize: '9px', color: '#555', marginTop: '4px', display: 'block' }}>* LIVE IN STORE</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '16px', marginBottom: '25px', borderRadius: '2px', width: '100%' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          FULFILLMENT STATUS BREAKDOWN
        </span>

        <div style={{ display: 'flex', height: '6px', backgroundColor: '#111', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px', width: '100%' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, flexShrink: 0, backgroundColor: '#eab308' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, flexShrink: 0, backgroundColor: '#a855f7' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, flexShrink: 0, backgroundColor: '#3b82f6' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, flexShrink: 0, backgroundColor: '#06b6d4' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, flexShrink: 0, backgroundColor: '#22c55e' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, flexShrink: 0, backgroundColor: '#ef4444' }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '10px', width: '100%' }}>
          <span><strong style={{ color: '#eab308' }}>● PENDING:</strong> {formatNumber(pendingOrders)}</span>
          <span><strong style={{ color: '#a855f7' }}>● PROCESSING:</strong> {formatNumber(processingOrders)}</span>
          <span><strong style={{ color: '#3b82f6' }}>● RECEIVED:</strong> {formatNumber(receivedOrders)}</span>
          <span><strong style={{ color: '#06b6d4' }}>● SHIPPED:</strong> {formatNumber(shippedOrders)}</span>
          <span><strong style={{ color: '#22c55e' }}>● DELIVERED:</strong> {formatNumber(deliveredOrders)}</span>
          <span><strong style={{ color: '#ef4444' }}>● CANCELLED:</strong> {formatNumber(cancelledOrders)}</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '2px', width: '100%' }}>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>
          RECENT ORDERS MEMORANDUM
        </span>

        {/* 🟢 এখানে টেবিল র‍্যাপার দিয়ে ওভারফ্লো ফিক্স করা হয়েছে */}
        <div className="table-wrapper">
          <table className="recent-orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
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
                <tr key={order.id} className="table-row-hover" style={{ borderBottom: '1px solid #111' }}>
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

    </div>
  );
};

export default AdminOverview;
