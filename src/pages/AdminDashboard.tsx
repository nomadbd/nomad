import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>(''); // 🟢 ডিফল্ট কোনো রোল নেই

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          // 🟢 শুধুমাত্র ইউজারের নির্ধারিত রোলটিই সেট হবে
          setUserRole(user.user_metadata?.role || ''); 
        }
      } catch (err) {
        console.error('Error fetching user:', err);
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

        /* 🟢 লোগো হোভার অ্যানিমেশন */
        .nomad-brand-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: opacity 0.2s ease;
        }

        .nomad-brand-link:hover {
          opacity: 0.8;
        }

        /* মোবাইলে মেনু হাইড/শো থাকবে */
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
          min-width: 0; /* ওভারফ্লো বন্ধ করার জন্য জরুরি */
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
          color: #cccccc; /* 🟢 উজ্জ্বল ধূসর */
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

        /* 💻 ৭৬৮px বা তার বেশি */
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

            {/* 🟢 NOMAD লোগো & স্লোগান */}
            <a href="/" className="nomad-brand-link" title="Go to Store Homepage">
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                NOMAD
              </h1>
              <span style={{ fontSize: '9px', color: '#aaaaaa', letterSpacing: '1.5px', marginTop: '2px', display: 'block' }}>
                The one. Everywhere.
              </span>
            </a>

            {/* 📱 শুধুমাত্র মোবাইল ভিউয়ের জন্য টগল বাটন */}
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

          {/* মেনু লিঙ্কস */}
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

        {/* 👉 মূল কন্টেন্ট এলাকা */}
        <main className="nomad-main">

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
            <div style={{ textAlign: 'right', fontSize: '10px' }}>
              <span style={{ color: '#dddddd', display: 'block', fontWeight: 'bold' }}>
                {userEmail}
              </span>

              {/* 🟢 সরাসরি ইউজারের রোল রেন্ডার হবে */}
              {userRole && (
                <span style={{ color: '#888888', fontSize: '9px', letterSpacing: '1px', display: 'block', margin: '2px 0', textTransform: 'uppercase' }}>
                  ROLE: {userRole}
                </span>
              )}

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
