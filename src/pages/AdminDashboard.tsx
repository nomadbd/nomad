import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchCurrentUserAndRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email || '');

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .single();

          if (!error && profile) {
            if (profile.name) setUserName(profile.name);
            if (profile.role) setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchCurrentUserAndRole();
  }, []);

  // Resize listener - ডেস্কটপ মোড টগল বা ভিউপোর্ট চেঞ্জ হলে লেআউট ফিক্স করবে
  useEffect(() => {
    const handleResize = () => {
      // Force layout recalculation
      document.body.style.width = '100%';
      setTimeout(() => {
        document.body.style.width = '';
      }, 10);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subTextStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#cccccc',
    fontWeight: 600,
    letterSpacing: '1px',
    display: 'block',
  };

  return (
    <div style={{ 
      backgroundColor: '#030303', 
      color: '#fff', 
      minHeight: '100vh', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>

      <style>{`
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        
        html, body, .nomad-layout, .nomad-main, .content-scrollable {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        .nomad-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden;
        }
        
        .nomad-sidebar {
          width: 100%;
          background-color: #060606;
          border-bottom: 1px solid #1a1a1a;
          padding: 15px 14px;
          flex-shrink: 0;
        }

        .nomad-main {
          flex: 1;
          min-width: 0;
          padding: 12px 14px;
          background-color: #030303;
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden;
        }

        .content-scrollable {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* চাইল্ড কম্পোনেন্ট সুরক্ষা */
        .metrics-grid, .metric-card, .table-wrapper, .recent-orders-table {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
        }

        .nav-btn { ... } /* আগের মতো রাখুন */

        .user-text-container {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .nomad-main { padding: 12px 14px; }
        }

        @media (min-width: 768px) {
          .nomad-layout { flex-direction: row; }
          .nomad-sidebar { width: 200px; min-height: 100vh; border-right: 1px solid #1a1a1a; padding: 20px 15px; }
          .nomad-main { padding: 20px 24px; }
        }
      `}</style>

      <div className="nomad-layout">
        {/* Sidebar এবং অন্যান্য অংশ আগের মতোই রাখুন */}
        {/* ... (আপনার আগের কোড থেকে sidebar, user info, nav ইত্যাদি কপি করে নিন) ... */}

        <main className="nomad-main">
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px', width: '100%' }}>
            <div style={{ textAlign: 'right', fontSize: '10px', width: '100%' }}>
              <span className="user-text-container" style={{ color: '#ffffff', display: 'block', fontWeight: 'bold', fontSize: '10px' }}>
                {userName || userEmail}
              </span>
              {userRole && <span style={{ ...subTextStyle, textTransform: 'uppercase' }}>{userRole}</span>}
            </div>
          </div>

          <div className="content-scrollable">
            {activeTab === 'overview' && <AdminOverview key="overview" />}
            {activeTab === 'orders' && <AdminOrders key="orders" />}
            {activeTab === 'products' && <AdminProducts key="products" />}
            {activeTab === 'settings' && <AdminSettings key="settings" />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;