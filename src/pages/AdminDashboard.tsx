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
    <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100vh', fontFamily: 'monospace, sans-serif', width: '100%' }}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        html, body {
          width: 100%;
          overflow-x: hidden;
        }

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
          flex-shrink: 0; /* সাইডবার যেন কোনোভাবেই ছোট না হয় */
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
          flex: 1; /* খালি জায়গা পুরোটাই নিয়ে নিবে */
          min-width: 0; /* ফ্লেক্সবক্সে কন্টেন্ট বাইরে যাওয়া আটকাতে এটি জাদুর মতো কাজ করে */
          padding: 16px;
          background-color: #030303;
          display: flex;
          flex-direction: column;
        }

        .content-scrollable {
          width: 100%;
          overflow-x: auto; /* ভেতরের টেবিল বা বড় কন্টেন্ট শুধু এই অংশের ভেতরেই স্ক্রোল হবে */
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

        @media (min-width: 768px) {
          .nomad-layout {
            flex-direction: row;
          }
          .nomad-sidebar {
            width: 200px; /* সাইডবারের ফিক্সড মাপ */
            min-height: 100vh;
            border-bottom: none;
            border-right: 1px solid #1a1a1a;
            padding: 20px 15px;
            flex-shrink: 0; /* ডেক্সটপ ভিউতে সাইডবার যেন চুপসে না যায় */
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
            /* এখান থেকে max-width ক্যালকুলেশন বাদ দেওয়া হয়েছে যাতে flexbox নিজেই সব হ্যান্ডেল করে */
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

          {/* ইমেইল এবং রোলের অংশটি */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px', width: '100%', flexWrap: 'wrap' }}>
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

          {/* চাইল্ড কম্পোনেন্টগুলো */}
          <div className="content-scrollable">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
