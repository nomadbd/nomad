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

// 1K, 1M ফরম্যাটিং লজিক
const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
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

  // পার্সেন্টেজ দেখার জন্য সিলেক্টেড স্ট্যাটাসের স্টেট
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  // স্ট্যাটাস গ্রিড আইটেম ফিল্ড লিস্ট
  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#eab308' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#a855f7' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#3b82f6' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#06b6d4' },
    { key: 'DELIVERED', label: 'DELIVERED', count: deliveredOrders, color: '#22c55e' },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#ef4444' },
  ];

  return (
    <div style={{ 
      color: '#fff', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%', 
      maxWidth: '100%', 
      minWidth: 0, 
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>

      <style>{`
        * { box-sizing: border-box; }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 100%;
        }

        @media (min-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
        }

        .metric-card {
          background-color: #060606;
          border: 1px solid #1a1a1a;
          padding: 14px 12px;
          border-radius: 2px;
          width: 100%;
          min-width: 0;
        }

        .revenue-card-clickable {
          cursor: pointer;
        }

        .revenue-card-clickable:hover {
          border-color: #333 !important;
          background-color: #0a0a0a;
        }

        .table-wrapper {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 2px;
        }

        .recent-orders-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          text-align: left;
          font-size: 11px;
        }

        .recent-orders-table th, 
        .recent-orders-table td {
          padding: 10px 8px;
          white-space: nowrap;
        }

        /* 3x2 Grid (২ লাইনে ৩ টা করে) */
        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
        }

        .status-card {
          background-color: #0a0a0a;
          border: 1px solid #181818;
          padding: 8px 10px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .status-card:hover {
          border-color: #333;
          background-color: #111;
        }

        .status-card.active {
          border-color: #444;
          background-color: #141414;
        }
      `}</style>

      {/* টাইটেল এবং সাবটাইটেল */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#fff' }}>
          METRICS OVERVIEW
        </h2>
        <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>
          REAL-TIME INSIGHTS
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">

        {/* Card 1: Revenue */}
        <div className="metric-card revenue-card-clickable" onClick={() => onNavigateToFinance && onNavigateToFinance()}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL REVENUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            ৳{formatNumber(totalRevenue)}
          </div>
          <span style={{ fontSize: '8px', color: '#555', marginTop: '4px', display: 'block' }}>
            * NO CANCELLED
          </span>
        </div>

        {/* Card 2: Orders */}
        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL ORDERS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(totalOrders)}
          </div>
          <span style={{ fontSize: '8px', color: '#555', marginTop: '4px', display: 'block' }}>
            * ALL LOGGED
          </span>
        </div>

        {/* Card 3: Active Queue */}
        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            ACTIVE QUEUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(pendingOrders + processingOrders)}
            <span style={{ fontSize: '12px', color: '#555', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: '13px', color: '#aaa' }}>{formatNumber(receivedOrders)} REC</span>
          </div>
          <span style={{ fontSize: '8px', color: '#555', marginTop: '4px', display: 'block' }}>
            * PENDING & PROC
          </span>
        </div>

        {/* Card 4: Catalog Items */}
        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            CATALOG ITEMS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(activeCatalogItems)}
          </div>
          <span style={{ fontSize: '8px', color: '#555', marginTop: '4px', display: 'block' }}>
            * LIVE ITEMS
          </span>
        </div>

      </div>

      {/* Fulfillment Status */}
      <div style={{ 
        backgroundColor: '#060606', 
        border: '1px solid #1a1a1a', 
        padding: '14px', 
        marginBottom: '20px', 
        borderRadius: '2px', 
        width: '100%',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            FULFILLMENT STATUS
          </span>
          <span style={{ fontSize: '8px', color: '#555', letterSpacing: '1px' }}>
            CLICK ITEM FOR %
          </span>
        </div>

        {/* Single Stacked Progress Bar */}
        <div style={{ display: 'flex', height: '4px', backgroundColor: '#111', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px', width: '100%' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#eab308' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#a855f7' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#3b82f6' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#06b6d4' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#22c55e' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#ef4444' }} />
        </div>

        {/* 2 Lines x 3 Items Grid */}
        <div className="status-grid">
          {statusItems.map((item) => {
            const isSelected = selectedStatus === item.key;
            const percent = calcPercent(item.count).toFixed(1);
            const isZero = item.count === 0;

            return (
              <div 
                key={item.key}
                className={`status-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedStatus(isSelected ? null : item.key)}
                style={{ opacity: isZero ? 0.5 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ color: item.color, fontSize: '10px' }}>●</span>
                  <span style={{ fontSize: '9px', color: isZero ? '#777' : '#ccc', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', paddingLeft: '14px' }}>
                  {formatNumber(item.count)}
                  {isSelected && (
                    <span style={{ fontSize: '9px', color: item.color, marginLeft: '6px', fontWeight: 'normal' }}>
                      ({percent}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ 
        backgroundColor: '#060606', 
        border: '1px solid #1a1a1a', 
        padding: '14px', 
        borderRadius: '2px', 
        width: '100%',
        maxWidth: '100%'
      }}>
        <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          RECENT ORDERS
        </span>

        <div className="table-wrapper">
          <table className="recent-orders-table">
            <thead>
              <tr style={{ borderBottom: '1px solid #222', color: '#555' }}>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th style={{ textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #111' }}>
                  <td style={{ color: '#aaa' }}>#{order.id.slice(0, 8)}...</td>
                  <td style={{ color: '#fff' }}>{order.customer_name || 'GUEST'}</td>
                  <td style={{ color: '#666' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>৳{order.total_amount}</td>
                  <td style={{ textAlign: 'right' }}>{renderStatusBadge(order.status)}</td>
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
