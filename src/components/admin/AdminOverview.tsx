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
    let color = '#ccc';
    let bg = '#181818';

    if (isPending(raw)) { color = '#facc15'; bg = '#2a2208'; displayStatus = 'PENDING'; }
    else if (isProcessing(raw)) { color = '#c084fc'; bg = '#1e102a'; displayStatus = 'PROCESSING'; }
    else if (isReceived(raw)) { color = '#60a5fa'; bg = '#0d1d3a'; displayStatus = 'RECEIVED'; }
    else if (isShipped(raw)) { color = '#22d3ee'; bg = '#082f35'; displayStatus = 'SHIPPED'; }
    else if (isDelivered(raw)) { color = '#4ade80'; bg = '#092b15'; displayStatus = 'DELIVERED'; }
    else if (isCancelled(raw)) { color = '#f87171'; bg = '#2d1212'; displayStatus = 'CANCELLED'; }

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

  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#facc15' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#c084fc' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#60a5fa' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#22d3ee' },
    { key: 'DELIVERED', label: 'DELIVERED', count: deliveredOrders, color: '#4ade80' },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#f87171' },
  ];

  return (
    <div style={{ 
      color: '#FFFFFF', 
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
          background-color: #080808;
          border: 1px solid #222222;
          padding: 14px 12px;
          border-radius: 2px;
          width: 100%;
          min-width: 0;
        }

        .revenue-card-clickable {
          cursor: pointer;
        }

        .revenue-card-clickable:hover {
          border-color: #444 !important;
          background-color: #0e0e0e;
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

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
        }

        .status-card {
          background-color: #0d0d0d;
          border: 1px solid #222222;
          padding: 10px;
          border-radius: 2px;
        }
      `}</style>

      {/* Title */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#FFFFFF' }}>
          METRICS OVERVIEW
        </h2>
        <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px' }}>
          REAL-TIME INSIGHTS
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">

        <div className="metric-card revenue-card-clickable" onClick={() => onNavigateToFinance && onNavigateToFinance()}>
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL REVENUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            ৳{formatNumber(totalRevenue)}
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * NO CANCELLED
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL ORDERS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(totalOrders)}
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * ALL LOGGED
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            ACTIVE QUEUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(pendingOrders + processingOrders)}
            <span style={{ fontSize: '12px', color: '#718096', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: '13px', color: '#CBD5E0' }}>{formatNumber(receivedOrders)} REC</span>
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * PENDING & PROC
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            CATALOG ITEMS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(activeCatalogItems)}
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * LIVE ITEMS
          </span>
        </div>

      </div>

      {/* Fulfillment Status Section */}
      <div style={{ 
        backgroundColor: '#080808', 
        border: '1px solid #222222', 
        padding: '14px', 
        marginBottom: '20px', 
        borderRadius: '2px', 
        width: '100%',
        maxWidth: '100%'
      }}>
        <span style={{ fontSize: '9px', color: '#CBD5E0', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          FULFILLMENT STATUS
        </span>

        {/* Progress Bar */}
        <div style={{ display: 'flex', height: '4px', backgroundColor: '#181818', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px', width: '100%' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#facc15' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#c084fc' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#60a5fa' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#22d3ee' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#4ade80' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#f87171' }} />
        </div>

        {/* Status Cards (Bright White/Grey Text) */}
        <div className="status-grid">
          {statusItems.map((item) => {
            const percent = calcPercent(item.count).toFixed(0);
            const isZero = item.count === 0;

            return (
              <div 
                key={item.key}
                className="status-card"
                style={{ opacity: isZero ? 0.55 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ color: item.color, fontSize: '9px' }}>●</span>
                  <span style={{ fontSize: '9px', color: '#A0AEC0', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', paddingLeft: '15px' }}>
                  {formatNumber(item.count)}
                  <span style={{ fontSize: '9px', color: '#CBD5E0', marginLeft: '6px', fontWeight: 'normal' }}>
                    ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ 
        backgroundColor: '#080808', 
        border: '1px solid #222222', 
        padding: '14px', 
        borderRadius: '2px', 
        width: '100%',
        maxWidth: '100%'
      }}>
        <span style={{ fontSize: '9px', color: '#CBD5E0', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          RECENT ORDERS
        </span>

        <div className="table-wrapper">
          <table className="recent-orders-table">
            <thead>
              <tr style={{ borderBottom: '1px solid #222222', color: '#A0AEC0' }}>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th style={{ textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ color: '#CBD5E0' }}>#{order.id.slice(0, 8)}...</td>
                  <td style={{ color: '#FFFFFF' }}>{order.customer_name || 'GUEST'}</td>
                  <td style={{ color: '#A0AEC0' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold', color: '#FFFFFF' }}>৳{order.total_amount}</td>
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
