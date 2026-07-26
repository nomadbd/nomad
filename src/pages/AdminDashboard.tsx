import React, { useState, useEffect } from 'react';
// 🟢 src/pages/ থেকে একদিন উপরে উঠে src/supabaseClient কে কল করা হচ্ছে
import { supabase } from '../supabaseClient'; 

// 🟢 একই ফোল্ডারে (src/pages/) বাকি ফাইলগুলো থাকলে:
import AdminOverview from './AdminOverview';
// import AdminOrders from './AdminOrders';
// import AdminProducts from './AdminProducts';
// import AdminSettings from './AdminSettings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  // ডাইনামিক ইউজারের ইমেইল স্টেট
  const [userEmail, setUserEmail] = useState<string>('AUTHENTICATING...');

  useEffect(() => {
    // ১. সুপাবেস সেশন থেকে লগইন করা ইউজারের ইমেইল নেওয়া
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

    // ২. মোবাইল রেসপন্সিভনেস ট্র্যাকার
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 📱💻 মেইন লেআউট (মোবাইলে ওপর-নিচে, ডেস্কটপে পাশাপাশি) */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh'
      }}>

        {/* 👈 সাইডবার / ন্যাভিগেশন */}
        <aside style={{
          width: isMobile ? '100%' : '260px',
          backgroundColor: '#050505',
          borderRight: isMobile ? 'none' : '1px solid #1f1f1f',
          borderBottom: isMobile ? '1px solid #1f1f1f' : 'none',
          padding: '20px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          
          {/* ব্র্যান্ড লোগো ও মোবাইল মেনু বাটন্স */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '15px' : '30px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>NOMAD</h1>
              <span style={{ fontSize: '9px', color: '#aaa', fontFamily: 'monospace', letterSpacing: '1px' }}>CONTROL PANEL</span>
            </div>

            {/* মোবাইল হ্যামবার্গার টগল */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                {menuOpen ? 'CLOSE MENU ✕' : 'MENU ☰'}
              </button>
            )}
          </div>

          {/* মেনু লিঙ্কসমূহ */}
          {(!isMobile || menuOpen) && (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: '#aaa', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '8px' }}>
                NAVIGATION
              </span>
              
              <button
                onClick={() => { setActiveTab('overview'); if (isMobile) setMenuOpen(false); }}
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
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                ░ OVERVIEW & ANALYTICS
              </button>

              <button
                onClick={() => { setActiveTab('orders'); if (isMobile) setMenuOpen(false); }}
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
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                ▤ ORDER MANAGEMENT
              </button>

              <button
                onClick={() => { setActiveTab('products'); if (isMobile) setMenuOpen(false); }}
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
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                ⬡ PRODUCTS & STOCK
              </button>

              <button
                onClick={() => { setActiveTab('settings'); if (isMobile) setMenuOpen(false); }}
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
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  cursor: 'pointer',
                  letterSpacing: '1px'
                }}
              >
                ⚙ ROLES & SETTINGS
              </button>
            </nav>
          )}
        </aside>

        {/* 👉 মূল ড্যাশবোর্ড কন্টেন্ট */}
        <main style={{
          flex: 1,
          padding: isMobile ? '15px' : '30px',
          backgroundColor: '#000',
          overflowX: 'hidden'
        }}>
          
          {/* 🔝 টপ হেডার (ডাইনামিক সেশন ইমেইল) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
            <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '10px' }}>
              
              <span style={{ color: '#ccc', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px', whiteSpace: 'nowrap' }} title={userEmail}>
                {userEmail}
              </span>

              <span style={{ color: '#22c55e', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold' }}>
                ● SYSTEM ACTIVE
              </span>
            </div>
          </div>

          {/* ভিউ রেন্ডার */}
          {activeTab === 'overview' && <AdminOverview />}
          {/* {activeTab === 'orders' && <AdminOrders />} */}
          {/* {activeTab === 'products' && <AdminProducts />} */}
          {/* {activeTab === 'settings' && <AdminSettings />} */}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
