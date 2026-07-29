import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';
import StaffProfile from '../components/StaffProfile';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const fetchCurrentUserAndRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || '');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          if (profile.name) setUserName(profile.name);
          if (profile.role) setUserRole(profile.role);
          setProfileData({ ...profile, email: user.email });
        } else {
          setProfileData({ email: user.email });
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUserAndRole();
  }, []);

  const subTextStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#888888',
    fontWeight: 600,
    letterSpacing: '1px',
    display: 'block',
  };

  return (
    <div style={{ 
      backgroundColor: '#030303', 
      color: '#fff', 
      minHeight: '100dvh', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>

      {/* CSS Overrides & Strict Mobile Rules */}
      <style>{`
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

        /* 📱 MOBILE STYLES (Screen width up to 767px) */
        @media screen and (max-width: 767px) {
          .nomad-layout {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-height: 100dvh;
          }

          .nomad-sidebar {
            width: 100% !important;
            height: auto !important;
            position: relative !important;
            background-color: #060606;
            border-bottom: 1px solid #1a1a1a;
            padding: 14px 16px;
            box-sizing: border-box;
          }

          .nomad-menu-toggle {
            display: flex !important;
          }

          .nomad-nav {
            display: ${menuOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            gap: 8px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #181818;
          }

          .user-footer-block {
            display: ${menuOpen ? 'block' : 'none'} !important;
            margin-top: 15px;
            padding-top: 12px;
            border-top: 1px solid #1f1f1f;
          }

          .nomad-main {
            width: 100% !important;
            padding: 16px 12px 40px 12px;
          }
        }

        /* 💻 DESKTOP STYLES (Screen width 768px and above) */
        @media screen and (min-width: 768px) {
          .nomad-layout {
            display: grid !important;
            grid-template-columns: 220px minmax(0, 1fr) !important;
            min-height: 100dvh;
          }

          .nomad-sidebar {
            width: 220px !important;
            height: 100dvh;
            position: sticky;
            top: 0;
            border-bottom: none;
            border-right: 1px solid #1a1a1a;
            padding: 20px 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow-y: auto;
          }

          .nomad-menu-toggle {
            display: none !important;
          }

          .nomad-nav {
            display: flex !important;
            flex-direction: column;
            gap: 8px;
            margin-top: 25px;
          }

          .user-footer-block {
            display: block !important;
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid #1a1a1a;
          }

          .nomad-main {
            padding: 24px 28px;
          }
        }

        .nomad-brand-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .nomad-main {
          flex: 1;
          background-color: #030303;
          box-sizing: border-box;
          overflow-x: hidden;
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

        .user-text-container {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <div className="nomad-layout">

        {/* SIDEBAR */}
        <aside className="nomad-sidebar">

          {/* TOP SECTION: BRAND & NAVIGATION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/" className="nomad-brand-link" title="Go to Store Homepage">
                <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                  NOMAD
                </h1>
                <span style={{ ...subTextStyle, marginTop: '2px', color: '#cccccc' }}>
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

              {userRole === 'ADMINISTRATOR' && (
                <button
                  className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
                >
                  ROLES & SETTINGS
                </button>
              )}
            </nav>
          </div>

          {/* BOTTOM SECTION: USER ACCOUNT FOOTER */}
          <div className="user-footer-block">
            <div 
              onClick={() => setIsProfileOpen(true)}
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                padding: '10px 12px',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
              title="Click to view Staff Profile & Options"
            >
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <span 
                  className="user-text-container"
                  style={{ 
                    color: '#ffffff', 
                    display: 'block', 
                    fontWeight: 'bold',
                    textTransform: userName ? 'uppercase' : 'none',
                    fontSize: '10px',
                    letterSpacing: '1px'
                  }}
                >
                  {loading ? '...' : (userName || userEmail || 'OPERATOR')}
                </span>

                {userRole && (
                  <span style={{ ...subTextStyle, marginTop: '2px', textTransform: 'uppercase', color: '#888888' }}>
                    {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="nomad-main">
          {activeTab === 'overview' && <AdminOverview key="overview" />}
          {activeTab === 'orders' && <AdminOrders key="orders" />}
          {activeTab === 'products' && <AdminProducts key="products" />}
          {activeTab === 'settings' && <AdminSettings key="settings" />}
        </main>

      </div>

      {/* 👤 STAFF PROFILE MODAL */}
      <StaffProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={profileData}
        onRefreshProfile={fetchCurrentUserAndRole}
      />

    </div>
  );
};

export default AdminDashboard;
