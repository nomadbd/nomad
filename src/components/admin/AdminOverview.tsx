import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminOverviewProps {
  onNavigateToFinance?: () => void;
  onNavigateToProducts?: () => void;
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

const AdminOverview: React.FC<AdminOverviewProps> = ({ 
  onNavigateToFinance, 
  onNavigateToProducts 
}) => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [processingOrders, setProcessingOrders] = useState<number>(0);
  const [receivedOrders, setReceivedOrders] = useState<number>(0);
  const [shippedOrders, setShippedOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);
  const [activeCatalogItems, setActiveCatalogItems] = useState<number>(0);
  
  // Stock Alert States
  const [outOfStockCount, setOutOfStockCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const fetchMetricsData = async () => {
    try {
      // 1. Fetch Metrics from RPC
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

      // 2. Fetch Catalog Active Items
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productCount !== null) setActiveCatalogItems(productCount);

      // 3. Fetch Out of Stock Items (Stock = 0)
      const { count: outOfStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock', 0);

      if (outOfStock !== null) setOutOfStockCount(outOfStock);

      // 4. Fetch Low Stock Items (Stock >= 1 AND Stock <= 3)
      const { count: lowStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('stock', 1)
        .lte('stock', 3);

      if (lowStock !== null) setLowStockCount(lowStock);

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

  const calcPercent = (val: number) => {
    if (!totalOrders || totalOrders <= 0) return 0;
    const p = (val / totalOrders) * 100;
    return isNaN(p) ? 0 : Math.min(Math.max(p, 0), 100);
  };

  // Calculate Average Order Value (AOV)
  const validOrderCount = totalOrders - cancelledOrders;
  const avgOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;

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

        .clickable-card {
          cursor: pointer;
        }

        .clickable-card:hover {
          border-color: #444 !important;
          background-color: #0e0e0e;
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

        .secondary-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 20px;
          width: 100%;
        }
      `}</style>

      {/* Header Title */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#FFFFFF' }}>
          METRICS OVERVIEW
        </h2>
        <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px' }}>
          REAL-TIME INSIGHTS
        </span>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="metrics-grid">

        <div className="metric-card clickable-card" onClick={() => onNavigateToFinance && onNavigateToFinance()}>
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
            <span style={{ fontSize: '14px', color: '#CBD5E0' }}>{formatNumber(receivedOrders)} REC</span>
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * PENDING & PROC
          </span>
        </div>

        <div className="metric-card clickable-card" onClick={() => onNavigateToProducts && onNavigateToProducts()}>
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

      {/* Fulfillment Breakdown Section */}
      <div style={{ 
        backgroundColor: '#080808', 
        border: '1px solid #222222', 
        padding: '14px', 
        borderRadius: '2px', 
        width: '100%',
        maxWidth: '100%'
      }}>
        <span style={{ fontSize: '9px', color: '#CBD5E0', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          FULFILLMENT STATUS
        </span>

        {/* Multi-Color Progress Bar */}
        <div style={{ display: 'flex', height: '4px', backgroundColor: '#181818', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px', width: '100%' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#facc15' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#c084fc' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#60a5fa' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#22d3ee' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#4ade80' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#f87171' }} />
        </div>

        {/* 3x2 Status Breakdown */}
        <div className="status-grid">
          {statusItems.map((item) => {
            const percent = calcPercent(item.count).toFixed(0);
            const isZero = item.count === 0;

            return (
              <div key={item.key} className="status-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ color: isZero ? '#444' : item.color, fontSize: '9px' }}>●</span>
                  <span style={{ fontSize: '9px', color: isZero ? '#666' : '#A0AEC0', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 'bold', color: isZero ? '#555' : '#FFFFFF', paddingLeft: '15px' }}>
                  {formatNumber(item.count)}
                  <span style={{ fontSize: '9px', color: isZero ? '#444' : '#CBD5E0', marginLeft: '6px', fontWeight: 'normal' }}>
                    ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Insights Row (AOV & Split Stock Alerts) */}
      <div className="secondary-metrics-grid">
        <div className="metric-card">
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            AVG ORDER VALUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            ৳{formatNumber(avgOrderValue)}
          </div>
          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            * PER ACTIVE ORDER
          </span>
        </div>

        <div 
          className="metric-card clickable-card" 
          onClick={() => onNavigateToProducts && onNavigateToProducts()}
        >
          <span style={{ fontSize: '9px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            STOCK ALERTS
          </span>
          
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {outOfStockCount > 0 || lowStockCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ color: outOfStockCount > 0 ? '#f87171' : '#FFFFFF', fontSize: '20px' }}>
                  {formatNumber(outOfStockCount)} OUT
                </span>
                <span style={{ fontSize: '12px', color: '#718096' }}>/</span>
                <span style={{ color: lowStockCount > 0 ? '#facc15' : '#FFFFFF', fontSize: '14px' }}>
                  {formatNumber(lowStockCount)} LOW
                </span>
              </div>
            ) : (
              'ALL IN STOCK'
            )}
          </div>

          <span style={{ fontSize: '8px', color: '#718096', marginTop: '4px', display: 'block' }}>
            {outOfStockCount > 0 || lowStockCount > 0 
              ? `* ${outOfStockCount} OUT OF STOCK, ${lowStockCount} LOW (≤ 3)` 
              : '* ALL STOCKS HEALTHY'}
          </span>
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
