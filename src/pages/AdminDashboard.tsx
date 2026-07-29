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
      width: '100vw',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>

      {/* Viewport Meta Enforcer & Global CSS Override */}
      <style>{`
        @viewport {
          width: device-width;
          initial-scale: 1.0;
        }

        *, *::before, *::after { 
          box-sizing: border-box !important; 
          margin: 0; 
          padding: 0; 
        }
        
        html, body {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
          background-color: #030303;
        }

        /* Responsive Fluid Layout System */
        .nomad-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
        }
        
        .nomad-sidebar {
          width: 100%;
          background-color: #060606;
          border-bottom: 1px solid #1a1a1a;
          padding: 15px 14px;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .nomad-brand-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: opacity 0.2s ease;
        }

        .nomad-brand-link:hover {
          opacity: 0.8;
        }

        .nomad-nav {
          display: ${menuOpen ? 'flex' : 'none'};
          flex-direction: column;
          gap: 8px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #181818;
        }

        .nomad-main {
          flex: 1;
          min-width: 0; /* Prevents flex children from overflowing */
          padding: 12px 14px;
          background-color: #030303;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .content-scrollable {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Strict boundary protection for all nested components */
        .metrics-grid,
        .metric-card,
        .table-wrapper,
        .recent-orders-table,
        table {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid transparent;
          font-weight: bold;
          font-size: 11px;
          text-align: left;
          cursor: pointer;
          letter-spacing: 1px;
          background: transparent;
          color: #cccccc;
          border-radius: 2px;
          transition: all 0.2s ease;
          width: 100%;
        }

        .nav-btn.active {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
        }

        .nav-btn:hover:not(.active) {
          background-color: #111;
          color: #fff;
        }

        .user-text-container {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Desktop Optimization & Desktop Mode Enforcement */
        @media (min-width: 768px) {
          .nomad-layout {
            display: grid;
            grid-template-columns: 200px minmax(0, 1fr);
            min-height: 100vh;
          }
          .nomad-sidebar {
            width: 200px;
            height: 100vh;
            position: sticky;
            top: 0;
            border-bottom: none;
            border-right: 1px solid #1a1a1a;
            padding: 20px 15px;
          }
          .nomad-menu-toggle {
            display: none !important;
          }
          .nomad-nav {
            display: flex !important;
            margin-top: 25px;
            padding-top: 0;
            border-top: none;
          }
          .nomad-main {
            padding: 20px 24px;
          }
        }
      `}</style>

      <div className="nomad-layout">

        <aside className="nomad-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            <a href="/" className="nomad-brand-link" title="Go to Store Homepage">
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                NOMAD
              </h1>
              <span style={{ ...subTextStyle, marginTop: '2px' }}>
                The one. Everywhere.
              </span>
            </a>

            <button
              className="nomad-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                backgroundColor: '#111',
                border: '1px solid #333',
                color: '#fff',
                width: '38px',
                height: '38px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px'
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          <nav className="nomad-nav">
            <span style={{ fontSize: '9px', color: '#888888', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
              MAIN MENU
            </span>

            <button
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}
            >
              OVERVIEW & ANALYTICS
            </button>

            <button
              className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setMenuOpen(false); }}
            >
              ORDER MANAGEMENT
            </button>

            <button
              className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setMenuOpen(false); }}
            >
              PRODUCTS & STOCK
            </button>

            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
            >
              ROLES & SETTINGS
            </button>
          </nav>
        </aside>

        <main className="nomad-main">

          {/* User Info Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            marginBottom: '20px', 
            borderBottom: '1px solid #111', 
            paddingBottom: '10px', 
            width: '100%' 
          }}>
            <div style={{ textAlign: 'right', fontSize: '10px', width: '100%' }}>

              <span 
                className="user-text-container"
                style={{ 
                  color: '#ffffff', 
                  display: 'block', 
                  fontWeight: 'bold',
                  textTransform: userName ? 'uppercase' : 'none',
                  fontSize: '10px'
                }}
              >
                {userName || userEmail}
              </span>

              {userRole && (
                <span style={{ ...subTextStyle, marginTop: '2px', textTransform: 'uppercase' }}>
                  {userRole}
                </span>
              )}
            </div>
          </div>

          {/* Child Components Container */}
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
