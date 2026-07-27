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
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN'); // 🟢 ইউজার রোল স্টেট

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          // Supabase metadata থেকে রোল ফেচ করা (ডিফল্ট: SUPER ADMIN)
          const role = user.user_metadata?.role || 'SUPER ADMIN';
          setUserRole(role.toUpperCase());
        } else {
          setUserEmail('ADMIN USER');
          setUserRole('SUPER ADMIN');
        }
      } catch (err) {
        setUserEmail('ADMIN USER');
        setUserRole('SUPER ADMIN');
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>

      {/* 🟢 ফ্লুইড রেসপন্সিভ সিএসএস লেআউট */}
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
          padding: 16px;
          background-color: #030303;
          width: 100%;
          min-width: 0;
        }

        /* 🟢 উজ্জ্বল নাভ বাটন টেক্সট (#d4d4d4) */
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
          color: #d4d4d4;
          border-radius: 2px;
          transition: all 0.2s ease;
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

        @media (min-width: 768px) {
          .nomad-layout {
            flex-direction: row;
          }
          .nomad-sidebar {
            width: 230px;
            min-height: 100vh;
            border-bottom: none;
            border-right: 1px solid #1a1a1a;
            padding: 25px 18px;
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
            padding: 25px 30px;
          }
        }
      `}</style>

      <div className="nomad-layout">

        {/* 👈 সাইডবার */}
        <aside className="nomad-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <a href="/" className="nomad-brand-link" title="Go to Store Homepage">
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                NOMAD
              </h1>
              {/* 🟢 উজ্জ্বল লাইট ধূসর রঙ (#a3a3a3) */}
              <span style={{ fontSize: '10px', color: '#a3a3a3', letterSpacing: '1.5px', marginTop: '3px', display: 'block' }}>
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
            {/* 🟢 উজ্জ্বল ধূসর ক্যাটাগরি লেবেল (#a3a3a3) */}
            <span style={{ fontSize: '9px', color: '#a3a3a3', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
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

        {/* 👉 মূল কন্টেন্ট এলাকা */}
        <main className="nomad-main">

          {/* 🟢 আপডেটেড হেডার (ইউজার রোল দেখানোর জন্য) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1a1a1a', paddingBottom: '12px' }}>
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <span style={{ color: '#e5e5e5', display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>
                {userEmail}
              </span>
              <span style={{ color: '#38bdf8', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>
                ROLE: {userRole}
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
