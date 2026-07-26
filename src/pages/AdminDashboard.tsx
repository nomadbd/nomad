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
        console.error('Error fetching user info:', err);
        setUserEmail('ADMIN USER');
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>
      
      {/* 🟢 বিশুদ্ধ CSS Media Query (যা মোবাইলে শতভাগ রেসপন্সিভ নিশ্চিত করে) */}
      <style>{`
        .nomad-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .nomad-sidebar {
          width: 100%;
          background-color: #050505;
          border-bottom: 1px solid #1f1f1f;
          padding: 15px 20px;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .nomad-menu-toggle {
          display: block;
        }
        .nomad-nav {
          display: ${menuOpen ? 'flex' : 'none'};
          flex-direction: column;
          gap: 8px;
          margin-top: 15px;
        }
        .nomad-main {
          flex: 1;
          padding: 15px;
          background-color: #000;
          overflow-x: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        /* 💻 ডেস্কটপ ও ট্যাবলেট ভিউ (768px এর ওপরে) */
        @media (min-width: 768px) {
          .nomad-layout {
            flex-direction: row;
          }
          .nomad-sidebar {
            width: 260px;
            border-bottom: none;
            border-right: 1px solid #1f1f1f;
            padding: 20px;
          }
          .nomad-menu-toggle {
            display: none;
          }
          .nomad-nav {
            display: flex !important;
            margin-top: 20px;
          }
          .nomad-main {
            padding: 30px;
          }
        }
      `}</style>

      {/* 📱💻 মেইন লেআউট */}
      <div className="nomad-layout">

        {/* 👈 সাইডবার */}
        <aside className="nomad-sidebar">
          
          {/* হেডার ও মোবাইল মেনু টগল */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>NOMAD</h1>
              <span style={{ fontSize: '9px', color: '#aaa', letterSpacing: '1px' }}>CONTROL PANEL</span>
            </div>

            {/* মোবাইলে মেনু খুলতে বোতাম */}
            <button
              className="nomad-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                backgroundColor: '#111',
                border: '1px solid #333',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {menuOpen ? 'CLOSE ✕' : 'MENU ☰'}
            </button>
          </div>

          {/* ন্যাভিগেশন মেনু */}
          <nav className="nomad-nav">
            <span style={{ fontSize: '9px', color: '#666', letterSpacing: '2px', marginBottom: '4px' }}>
              NAVIGATION
            </span>
            
            <button
              onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: activeTab === 'overview' ? '#fff' : 'transparent',
                color: activeTab === 'overview' ? '#000' : '#ccc',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '1px'
              }}
            >
              ░ OVERVIEW & ANALYTICS
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: activeTab === 'orders' ? '#fff' : 'transparent',
                color: activeTab === 'orders' ? '#000' : '#ccc',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '1px'
              }}
            >
              ▤ ORDER MANAGEMENT
            </button>

            <button
              onClick={() => { setActiveTab('products'); setMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: activeTab === 'products' ? '#fff' : 'transparent',
                color: activeTab === 'products' ? '#000' : '#ccc',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '1px'
              }}
            >
              ⬡ PRODUCTS & STOCK
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: activeTab === 'settings' ? '#fff' : 'transparent',
                color: activeTab === 'settings' ? '#000' : '#ccc',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '1px'
              }}
            >
              ⚙ ROLES & SETTINGS
            </button>
          </nav>
        </aside>

        {/* 👉 মূল কন্টেন্ট এলাকা */}
        <main className="nomad-main">
          
          {/* 🔝 টপ ইউজার হেডার (ফিক্সড ইমেইল রেসপন্সিভ) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
            <div style={{ textAlign: 'right', fontSize: '10px' }}>
              <span style={{ color: '#ccc', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }} title={userEmail}>
                {userEmail}
              </span>
              <span style={{ color: '#22c55e', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold' }}>
                ● SYSTEM ACTIVE
              </span>
            </div>
          </div>

          {/* এক্টিভ ট্যাব রেন্ডারিং */}
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
