import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminOverviewProps {
  userRole?: string;
  profile?: any;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ userRole, profile }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      // Fetch Total Orders & Revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status');

      if (ordersError) throw ordersError;

      const totalOrders = orders ? orders.length : 0;
      const totalRevenue = orders
        ? orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
        : 0;

      // Fetch Total Products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Fetch Total Customers/Profiles
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (profilesError) throw profilesError;

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalProducts: productsCount || 0,
        totalCustomers: profilesCount || 0,
      });
    } catch (err) {
      console.error('Error loading overview analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1f1f1f',
    padding: '20px',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#888888',
    letterSpacing: '1.5px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    color: '#ffffff',
    fontWeight: '900',
    fontFamily: 'monospace',
  };

  if (loading) {
    return (
      <div style={{ color: '#888888', fontSize: '11px', letterSpacing: '1px', padding: '20px 0' }}>
        LOADING OVERVIEW DATA...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Info */}
      <div style={{ borderBottom: '1px solid #1f1f1f', paddingBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', color: '#fff', textTransform: 'uppercase' }}>
          SYSTEM OVERVIEW & ANALYTICS
        </h2>
        <span style={{ fontSize: '10px', color: '#666666', letterSpacing: '1px', marginTop: '4px', display: 'block' }}>
          LOGGED IN AS: {profile?.email || 'OPERATOR'} ({userRole || 'STAFF'})
        </span>
      </div>

      {/* Analytics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        <div style={cardStyle}>
          <span style={labelStyle}>TOTAL REVENUE</span>
          <span style={valueStyle}>৳{analytics.totalRevenue.toLocaleString()}</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>TOTAL ORDERS</span>
          <span style={valueStyle}>{analytics.totalOrders}</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>PRODUCTS IN STOCK</span>
          <span style={valueStyle}>{analytics.totalProducts}</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>REGISTERED USERS</span>
          <span style={valueStyle}>{analytics.totalCustomers}</span>
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
