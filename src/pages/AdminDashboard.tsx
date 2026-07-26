import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট পাথ নিশ্চিত করুন

// সাব-কম্পোনেন্টসমূহ (আমরা ধাপে ধাপে তৈরি করব)
import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';

type ActiveTab = 'overview' | 'orders' | 'products' | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders'); // ডিফল্টভাবে অর্ডার ট্যাবে থাকবে
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // এডমিন সেশন চেক
    const checkAdminSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminUser(user);
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  // নেভিগেশন আইটেমসমূহের লিস্ট
  const navItems = [
    {
      id: 'overview',
      label: 'OVERVIEW & ANALYTICS',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'ORDER MANAGEMENT',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      )
    },
    {
      id: 'products',
      label: 'PRODUCTS & STOCK',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'ROLES & SETTINGS',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '12px' }}>
        LOADING SYSTEM HQ...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 🔝 টপ হেডার (মোবাইল ও ডেক্সটপ) */}
      <header style={{ height: '65px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* মোবাইল মেনু টগল */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
            className="admin-mobile-toggle"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '6px', color: '#fff' }}>NOMAD</span>
          <span style={{ fontSize: '9px', backgroundColor: '#111', color: '#888', border: '1px solid #222', padding: '3px 8px', borderRadius: '2px', fontFamily: 'monospace', letterSpacing: '1px' }}>CONTROL PANEL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>
              {adminUser?.email || 'ADMINISTRATOR'}
            </span>
            <span style={{ fontSize: '9px', color: '#00ff66', fontFamily: 'monospace', letterSpacing: '1px' }}>
              • SYSTEM ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* 📐 মূল লেআউট (সাইডবার + কন্টেন্ট) */}
      <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        
        {/* ⬅️ সাইডবার নেভিগেশন */}
        <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ width: '260px', backgroundColor: '#050505', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '25px 15px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', fontWeight: 'bold', fontFamily: 'monospace', paddingLeft: '10px', marginBottom: '10px' }}>
            NAVIGATION
          </span>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 15px',
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#000' : '#888',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <a 
              href="/" 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#666', textDecoration: 'none', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              RETURN TO STORE
            </a>
          </div>
        </aside>

        {/* 📄 মূল ডাইনামিক কন্টেন্ট এরিয়া */}
        <main style={{ flexGrow: 1, backgroundColor: '#000', padding: '30px', overflowY: 'auto' }}>
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-mobile-toggle { display: block !important; }
          .admin-sidebar {
            position: fixed;
            top: 65px;
            left: -280px;
            bottom: 0;
            z-index: 99;
            transition: left 0.3s ease;
          }
          .admin-sidebar.open {
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
