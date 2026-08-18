import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminSettings from '../components/admin/AdminSettings';
import StaffProfile from '../components/admin/StaffProfile';

type TabType = 'overview' | 'orders' | 'products' | 'settings';

const AdminDashboard: React.FC = () => {
  const getTabFromURL = (): TabType => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    const validTabs: TabType[] = ['overview', 'orders', 'products', 'settings'];
    return validTabs.includes(tab) ? tab : 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromURL);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
    setIsSearchOpen(false);

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tab', tab);
    const newPath = `${window.location.pathname}?${searchParams.toString()}`;

    window.history.pushState({ path: newPath }, '', newPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromURL());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (menuOpen) return;

      if (currentScrollY > lastScrollY && currentScrollY > 40) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, menuOpen]);

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
          setUserName(profile.name || '');
          setUserRole(profile.role || '');
          setProfileData({ ...profile, email: user.email });
        } else {
          setProfileData({ email: user.email });
        }
      } else {
        window.location.href = '/';
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

  const normalizedRole = userRole.toUpperCase().trim();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const hasAdminAccess = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(normalizedRole);

  useEffect(() => {
    if (!loading && !isSuperAdmin && activeTab === 'settings') {
      handleTabChange('overview');
    }
  }, [isSuperAdmin, loading, activeTab]);

  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      window.location.href = '/profile';
    }
  }, [loading, hasAdminAccess]);

  const subTextStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#888888',
    fontWeight: 600,
    letterSpacing: '1px',
    display: 'block',
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        LOADING DASHBOARD...
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div style={{ 
      backgroundColor: '#030303', 
      color: '#fff', 
      minHeight: '100dvh', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'clip'
    }}>
      <style>{`
        *, *::before, *::after { 
          box-sizing: border-box !important; 
          margin: 0; 
          padding: 0; 
        }
        
        html, body {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: clip !important;
          background-color: #030303;
        }

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
            position: fixed !important;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background-color: rgba(6, 6, 6, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #141414;
            padding: 14px 16px;
            box-sizing: border-box;
            transform: ${isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)'};
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .nomad-menu-toggle {
            display: flex !important;
          }

          .nomad-nav {
            display: ${menuOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            gap: 8px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #141414;
          }

          .user-footer-block {
            display: ${menuOpen ? 'block' : 'none'} !important;
            margin-top: 15px;
            padding-top: 12px;
            border-top: 1px solid #141414;
          }

          .nomad-main {
            width: 100% !important;
            padding: 75px 12px 40px 12px !important;
          }
        }

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
            transform: none !important;
            background-color: #060606;
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
            padding: 24px 28px !important;
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
          overflow-x: clip;
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
          background-color: transparent !important;
          color: #ffffff !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.08);
        }

        .user-text-container {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nomad-action-btn,
        .nomad-menu-toggle-btn {
          background: transparent;
          border: none !important;
          outline: none;
          color: #ffffff;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s ease, opacity 0.2s ease;
          opacity: 0.85;
          -webkit-tap-highlight-color: transparent;
        }

        .nomad-action-btn.active {
          background-color: rgba(255, 255, 255, 0.15);
          opacity: 1;
        }

        .nomad-action-btn:hover,
        .nomad-action-btn:active,
        .nomad-menu-toggle-btn:hover,
        .nomad-menu-toggle-btn:active {
          background-color: rgba(255, 255, 255, 0.08);
          opacity: 1;
        }

        .header-search-bar {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #1f1f1f;
        }

        .header-search-input {
          width: 100%;
          background: #090909;
          border: 1px solid #222;
          color: #fff;
          padding: 8px 12px;
          font-family: monospace;
          font-size: 11px;
          border-radius: 2px;
          outline: none;
          letter-spacing: 1px;
        }

        .header-search-input:focus {
          border-color: #555;
        }
      `}</style>

      <div className="nomad-layout">
        <aside className="nomad-sidebar">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/" className="nomad-brand-link" title="Go to Store Homepage">
                <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                  NOMAD
                </h1>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {activeTab !== 'overview' && (
                  <button
                    className={`nomad-action-btn ${isSearchOpen ? 'active' : ''}`}
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    aria-label="Search"
                    title="Search"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                )}

                <button
                  className={`nomad-action-btn ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  aria-label="Filter"
                  title="Toggle Filter Panel"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </button>

                <button
                  className="nomad-menu-toggle nomad-menu-toggle-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle Menu"
                  title="Toggle Navigation"
                >
                  {menuOpen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="8" x2="21" y2="8"></line>
                      <line x1="9" y1="16" x2="21" y2="16"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isSearchOpen && activeTab !== 'overview' && (
              <div className="header-search-bar">
                <input
                  type="text"
                  className="header-search-input"
                  placeholder={`SEARCH IN ${activeTab.toUpperCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <nav className="nomad-nav">
              <span style={{ fontSize: '9px', color: '#888888', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
                MAIN MENU
              </span>

              <button
                className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                OVERVIEW & ANALYTICS
              </button>

              <button
                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => handleTabChange('orders')}
              >
                ORDER MANAGEMENT
              </button>

              <button
                className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => handleTabChange('products')}
              >
                PRODUCTS & STOCK
              </button>

              {isSuperAdmin && (
                <button
                  className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  ROLES & SETTINGS
                </button>
              )}
            </nav>
          </div>

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
                  {userName || userEmail || 'OPERATOR'}
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

        <main className="nomad-main">
          {activeTab === 'overview' && (
            <AdminOverview key="overview" userRole={userRole} showFilter={isFilterOpen} />
          )}
          {activeTab === 'orders' && (
            <AdminOrders key="orders" searchQuery={searchQuery} isFilterOpen={isFilterOpen} />
          )}
          {activeTab === 'products' && (
            <AdminProducts key="products" searchQuery={searchQuery} isFilterOpen={isFilterOpen} />
          )}

          {activeTab === 'settings' && (
            isSuperAdmin ? (
              <AdminSettings key="settings" />
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#ff4d4d', letterSpacing: '2px', fontSize: '12px' }}>
                ACCESS DENIED: SUPER ADMIN PRIVILEGES REQUIRED.
              </div>
            )
          )}
        </main>
      </div>

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
