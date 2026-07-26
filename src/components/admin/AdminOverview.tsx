import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট পাথ নিশ্চিত করুন

interface SummaryMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  receivedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    receivedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // ১. সব অর্ডার ফেচ করা
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, customer_name')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // ২. সব প্রোডাক্টের সংখ্যা ফেচ করা
      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) console.error('Error fetching product count:', productsError);

      if (orders) {
        let rev = 0;
        let pending = 0;
        let received = 0;
        let shipped = 0;
        let delivered = 0;

        orders.forEach((ord: any) => {
          const st = (ord.status || '').toLowerCase().trim();
          
          // মোট রেভিনিউ হিসাব (ক্যান্সেলড ছাড়া বাকি সব)
          if (st !== 'cancelled') {
            rev += (ord.total_amount || 0);
          }

          if (st === 'pending') pending++;
          else if (st === 'received') received++;
          else if (st === 'shipped') shipped++;
          else if (st === 'delivered' || st === 'completed' || st === 'delivered / completed') delivered++;
        });

        setMetrics({
          totalRevenue: rev,
          totalOrders: orders.length,
          pendingOrders: pending,
          receivedOrders: received,
          shippedOrders: shipped,
          deliveredOrders: delivered,
          totalProducts: productCount || 0
        });

        // সাম্প্রতিক ৫টি অর্ডার
        const recent = orders.slice(0, 5).map((ord: any) => ({
          id: ord.id,
          customer_name: ord.customer_name || 'VALUED CUSTOMER',
          total_amount: ord.total_amount,
          status: ord.status || 'Pending',
          created_at: ord.created_at
        }));

        setRecentOrders(recent);
      }

    } catch (err) {
      console.error('Error loading overview analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const getStatusBadgeColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s === 'received') return '#3b82f6';
    if (s === 'shipped') return '#eab308';
    if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return '#22c55e';
    if (s === 'cancelled') return '#ef4444';
    return '#a855f7';
  };

  if (loading) {
    return (
      <div style={{ color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px', textAlign: 'center', padding: '50px 0' }}>
        CALCULATING SYSTEM METRICS...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 🔝 হেডার টাইটেল */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>
            HQ METRICS & OVERVIEW
          </h2>
          <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', letterSpacing: '1px' }}>
            REAL-TIME FINANCIAL & FULFILLMENT INSIGHTS
          </span>
        </div>
        <button
          onClick={fetchOverviewData}
          style={{
            backgroundColor: '#050505',
            border: '1px solid #222',
            color: '#888',
            padding: '8px 14px',
            fontSize: '10px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            cursor: 'pointer'
          }}
        >
          RELOAD ANALYTICS
        </button>
      </div>

      {/* 📊 ৪টি প্রধান কি-পারফরম্যান্স কার্ড (KPI Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
        
        {/* Card 1: Total Revenue */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            TOTAL GROSS REVENUE
          </span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#00ff66', fontFamily: 'monospace', letterSpacing: '1px' }}>
            ৳{metrics.totalRevenue.toLocaleString()}
          </span>
          <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
            • EXCLUDING CANCELLED ORDERS
          </span>
        </div>

        {/* Card 2: Total Orders */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            TOTAL ORDERS LOGGED
          </span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {metrics.totalOrders}
          </span>
          <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
            • ALL-TIME SYSTEM RECORD
          </span>
        </div>

        {/* Card 3: Pending & Received Action Needed */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            PENDING & RECEIVED
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#a855f7', fontFamily: 'monospace' }}>
              {metrics.pendingOrders}
            </span>
            <span style={{ fontSize: '11px', color: '#3b82f6', fontFamily: 'monospace' }}>
              / {metrics.receivedOrders} REC
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
            • REQUIRES PROCESSING
          </span>
        </div>

        {/* Card 4: Catalog Products */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            ACTIVE CATALOG ITEMS
          </span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {metrics.totalProducts}
          </span>
          <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
            • LIVE IN STORE
          </span>
        </div>

      </div>

      {/* 📈 স্ট্যাটাস ডিসট্রিবিউশন প্রোগ্রেস বার (Order Breakdown) */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
        <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>
          FULFILLMENT STATUS BREAKDOWN
        </span>

        {/* Visual Bar */}
        <div style={{ height: '8px', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '20px' }}>
          <div style={{ width: `${metrics.totalOrders ? (metrics.deliveredOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: '#22c55e' }} title="Delivered" />
          <div style={{ width: `${metrics.totalOrders ? (metrics.shippedOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: '#eab308' }} title="Shipped" />
          <div style={{ width: `${metrics.totalOrders ? (metrics.receivedOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: '#3b82f6' }} title="Received" />
          <div style={{ width: `${metrics.totalOrders ? (metrics.pendingOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: '#a855f7' }} title="Pending" />
        </div>

        {/* Legend Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa' }}>
            <span style={{ color: '#a855f7' }}>●</span> PENDING: <strong>{metrics.pendingOrders}</strong>
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa' }}>
            <span style={{ color: '#3b82f6' }}>●</span> RECEIVED: <strong>{metrics.receivedOrders}</strong>
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa' }}>
            <span style={{ color: '#eab308' }}>●</span> SHIPPED: <strong>{metrics.shippedOrders}</strong>
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa' }}>
            <span style={{ color: '#22c55e' }}>●</span> DELIVERED: <strong>{metrics.deliveredOrders}</strong>
          </div>
        </div>
      </div>

      {/* 🕒 রিসেন্ট ৫টি অর্ডার টেবিল */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px' }}>
        <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>
          RECENT ORDERS MEMORANDUM
        </span>

        {recentOrders.length === 0 ? (
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '11px', padding: '20px 0' }}>
            NO RECENT ORDERS AVAILABLE
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#555', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 5px' }}>ORDER ID</th>
                  <th style={{ padding: '10px 5px' }}>CUSTOMER</th>
                  <th style={{ padding: '10px 5px' }}>DATE</th>
                  <th style={{ padding: '10px 5px' }}>AMOUNT</th>
                  <th style={{ padding: '10px 5px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => {
                  const badgeColor = getStatusBadgeColor(ord.status);
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #111', color: '#ccc' }}>
                      <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#fff' }}>#{ord.id}</td>
                      <td style={{ padding: '12px 5px' }}>{ord.customer_name}</td>
                      <td style={{ padding: '12px 5px', color: '#666' }}>
                        {new Date(ord.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 5px', color: '#fff', fontWeight: 'bold' }}>৳{ord.total_amount}</td>
                      <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                        <span style={{ fontSize: '9px', backgroundColor: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}55`, padding: '2px 8px', borderRadius: '2px', fontWeight: 'bold' }}>
                          ● {ord.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminOverview;
