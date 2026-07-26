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
    <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100vh', fontFamily: 'monospace, sans-serif' }}>
      
      {/* 🟢 ফিক্সড পিওর সিএসএস লেআউট */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .nomad-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100vw;
          overflow-x: hidden;
        }
        
        .nomad-sidebar {
          width: 100%;
          background-color: #060606;
          border-bottom: 1px solid #1a1a1a;
          padding: 15px 20px;
          flex-shrink: 0;
          z-index: 100;
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
          padding: 15px;
          background-color: #030303;
          width: 100%;
          overflow-x: hidden;
        }

        /* 🟢 নেভিগেশন বাটনের ভিজিবিলিটি ফিক্স */
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
          transition: all 0.2s ease;
          background: transparent;
          color: #aaa; /* দৃশ্যমান দৃশ্যটি ফিক্স করা হয়েছে */
          border-radius: 2px;
        }

        .nav-btn.active {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
        }

        .nav-btn:hover:not(.active) {
          background-color: #111111;
          border-color: #222222;
          color: #ffffff;
        }

        /* 💻 ১০২৪px বা তার বড় ডিসপ্লেতেই কেবল ডেস্কটপ সাইডবার দেখাবে */
        @media (min-width: 1024px) {
          .nomad-layout {
            flex-direction: row;
          }
          .nomad-sidebar {
            width: 260px;
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

        {/* 👈 সাইডবার (মোবাইলে টপ বার হিসেবে কাজ করবে) */}
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

            {/* 📱 শুধুমাত্র মোবাইলের জন্য প্রতীক বিশিষ্ট টগল বাটন */}
            <button
              className="nomad-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
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

          {/* ন্যাভিগেশন লিংকস */}
          <nav className="nomad-nav">
            <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
              MAIN MENU
            </span>
            
            <button
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setMenuOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              OVERVIEW & ANALYTICS
            </button>

            <button
              className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setMenuOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              ORDER MANAGEMENT
            </button>

            <button
              className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setMenuOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              PRODUCTS & STOCK
            </button>

            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              ROLES & SETTINGS
            </button>
          </nav>
        </aside>

        {/* 👉 মূল কন্টেন্ট এলাকা */}
        <main className="nomad-main">
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
            <div style={{ textAlign: 'right', fontSize: '10px' }}>
              <span style={{ color: '#aaa', display: 'block' }}>
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
