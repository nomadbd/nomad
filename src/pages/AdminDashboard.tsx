import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('AUTHENTICATING...');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        } else {
          setUserEmail('ADMIN USER');
        }
      } catch (err) {
        setUserEmail('ADMIN USER');
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>
      
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .nomad-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
        }
        
        .nomad-sidebar {
          width: 100%;
          background-color: #060606;
          border-bottom: 1px solid #1a1a1a;
          padding: 15px 20px;
          flex-shrink: 0;
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
          padding: 16px;
          background-color: #030303;
          width: 100%;
          box-sizing: border-box;
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
          color: #888;
        }

        .nav-btn.active {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
        }

        /* 💻 শুধুমাত্র ৯৯২px বা তার বড় ডিসপ্লেতেই ডেস্কটপ সাইডবার লেআউট অন হবে */
        @media (min-width: 992px) {
          .nomad-layout {
            flex-direction: row;
          }
          .nomad-sidebar {
            width: 250px;
            min-height: 100vh;
            border-bottom: none;
            border-right: 1px solid #1a1a1a;
            padding: 25px 20px;
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
            padding: 30px;
          }
        }
      `}</style>

      <div className="nomad-layout">

        {/* 👈 সাইডবার / মোবাইল হেডার */}
        <aside className="nomad-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
                <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>NOMAD</h1>
              </div>
              <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1.5px', marginTop: '2px', display: 'block' }}>
                CONTROL PANEL v2.0
              </span>
            </div>

            {/* 📱 মোবাইল অনলি প্রতীক টগল */}
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
            <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
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

        {/* 👉 মেইন ওয়ার্কস্পেস */}
        <main className="nomad-main">
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ textAlign: 'right', fontSize: '10px' }}>
              <span style={{ color: '#aaa', display: 'block', wordBreak: 'break-all' }}>
                {userEmail}
              </span>
              <span style={{ color: '#22c55e', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold' }}>
                ● ONLINE (ENCRYPTED)
              </span>
            </div>
          </div>

          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'settings' && <AdminSettings />}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
