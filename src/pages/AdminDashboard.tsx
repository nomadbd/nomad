import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { supabase } from '../supabaseClient'; 

import {
  AdminOverview,
  AdminOrders,
  AdminProducts,
  AdminStaff,
  AdminCustomers,
  AdminLogistics,
  StaffProfile,
  AdminMessages
} from '../components/admin';
import SendInvite from '../components/admin/ambassadors/invitations/SendInvite';
import { PlusIcon, SearchIcon, FilterIcon, MenuIcon, CloseIcon } from '../components/icons';

type TabType = 'overview' | 'orders' | 'products' | 'logistics' | 'messages' | 'ambassadors' | 'staff' | 'customers';

const AdminDashboard: React.FC = () => {
  const getTabFromURL = (): TabType => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    const validTabs: TabType[] = ['overview', 'orders', 'products', 'logistics', 'messages', 'ambassadors', 'staff', 'customers'];
    return validTabs.includes(tab) ? tab : 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromURL);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // একটিভ চ্যাট স্টেট
  const [activeChat, setActiveChat] = useState<{
    id: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    role: string;
  } | null>(null);

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
    setIsAddOpen(false);
    setActiveChat(null); // ট্যাব চেঞ্জ হলে চ্যাট স্টেট রিসেট হবে

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
  const hasAdminAccess = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(normalizedRole);

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

  // চ্যাট ওপেন থাকলে হেডার হাইড হবে
  const isChatOpen = activeTab === 'messages' && !!activeChat;

  return (
    <div style={{ 
      backgroundColor: '#030303', 
      color: '#fff', 
      minHeight: '100dvh', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <div className={styles.nomadLayout}>
        <aside className={`${styles.nomadSidebar} ${menuOpen ? styles.menuOpen : ''} ${!isHeaderVisible ? styles.headerHidden : ''}`}>
          <div>
            {/* কোনো নির্দিষ্ট চ্যাট ওপেন থাকলে ড্যাশবোর্ডের মূল হেডার হাইড থাকবে */}
            {!isChatOpen && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '100%' }}>
                <a href="/" className={styles.nomadBrandLink} title="Go to Store Homepage">
                  <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
                    NOMAD
                  </h1>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(activeTab === 'products' || activeTab === 'ambassadors') && (
                    <button
                      className={`${styles.nomadActionBtn} ${isAddOpen ? styles.nomadActionBtnActive : ''}`}
                      onClick={() => setIsAddOpen(!isAddOpen)}
                      aria-label={activeTab === 'products' ? 'Add Product' : 'Add Ambassador'}
                      title={activeTab === 'products' ? 'Add Product' : 'Add Ambassador'}
                    >
                      <PlusIcon width={18} height={18} />
                    </button>
                  )}

                  {activeTab !== 'overview' && (
                    <button
                      className={`${styles.nomadActionBtn} ${isSearchOpen ? styles.nomadActionBtnActive : ''}`}
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      aria-label="Search"
                      title="Search"
                    >
                      <SearchIcon width={18} height={18} />
                    </button>
                  )}

                  <button
                    className={`${styles.nomadActionBtn} ${isFilterOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    aria-label="Filter"
                    title="Toggle Filter Panel"
                  >
                    <FilterIcon width={18} height={18} />
                  </button>

                  <button
                    className={`${styles.nomadMenuToggle} ${styles.nomadMenuToggleBtn} ${menuOpen ? styles.nomadMenuToggleBtnActive : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle Menu"
                    title="Toggle Navigation"
                  >
                    {menuOpen ? <CloseIcon width={18} height={18} /> : <MenuIcon width={20} height={20} />}
                  </button>
                </div>
              </div>
            )}

            <nav className={styles.nomadNav}>
              <span style={{ fontSize: '9px', color: '#888888', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
                MAIN MENU
              </span>

              <button
                className={`${styles.navBtn} ${activeTab === 'overview' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                OVERVIEW
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'orders' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('orders')}
              >
                ORDERS
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'products' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('products')}
              >
                PRODUCTS
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'logistics' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('logistics')}
              >
                LOGISTICS
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'messages' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('messages')}
              >
                MESSAGES
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'ambassadors' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('ambassadors')}
              >
                AMBASSADORS
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'staff' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('staff')}
              >
                STAFF
              </button>

              <button
                className={`${styles.navBtn} ${activeTab === 'customers' ? styles.navBtnActive : ''}`}
                onClick={() => handleTabChange('customers')}
              >
                CUSTOMERS
              </button>
            </nav>
          </div>

          <div className={styles.userFooterBlock}>
            <div 
              onClick={() => setIsProfileOpen(true)}
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                padding: '10px 12px',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                maxWidth: '100%',
                width: '100%',
                boxSizing: 'border-box'
              }}
              title="Click to view Staff Profile & Options"
            >
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <span 
                  className={styles.userTextContainer}
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

        <main className={styles.nomadMain}>
          {activeTab === 'overview' && (
            <AdminOverview key="overview" userRole={userRole} showFilter={isFilterOpen} dateFormat="DD/MM/YYYY" />
          )}
          {activeTab === 'orders' && (
            <AdminOrders 
              key="orders" 
              isSearchOpen={isSearchOpen}
              isFilterOpen={isFilterOpen}
              onToggleSearch={() => setIsSearchOpen(prev => !prev)}
              onToggleFilter={() => setIsFilterOpen(prev => !prev)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateFormat="DD/MM/YYYY" 
            />
          )}
          {activeTab === 'products' && (
            <AdminProducts 
              key="products" 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery}
              isFilterOpen={isFilterOpen} 
              isSearchOpen={isSearchOpen}
              dateFormat="DD/MM/YYYY" 
              isAddOpen={isAddOpen}
              onToggleAdd={() => setIsAddOpen(prev => !prev)}
              onCloseAdd={() => setIsAddOpen(false)}
            />
          )}
          {activeTab === 'logistics' && (
            <AdminLogistics 
              key="logistics"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
            />
          )}
          {activeTab === 'messages' && (
            <AdminMessages 
              key="messages" 
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              isSearchOpen={isSearchOpen}
              activeThreadId={activeChat?.id || null}
              onSelectThread={(id, thread) => {
                if (!id || !thread) {
                  setActiveChat(null);
                } else {
                  setActiveChat({
                    id: thread.id,
                    userName: thread.userName,
                    userEmail: thread.userEmail,
                    userPhone: thread.userPhone,
                    role: thread.role,
                  });
                }
              }}
            />
          )}
          {activeTab === 'ambassadors' && (
            <SendInvite 
              key="ambassadors" 
              isOpen={isAddOpen} 
              onClose={() => setIsAddOpen(false)} 
            />
          )}
          {activeTab === 'staff' && (
            <AdminStaff 
              key="staff"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              isSearchOpen={isSearchOpen}
              dateFormat="DD/MM/YYYY"
            />
          )}
          {activeTab === 'customers' && (
            <AdminCustomers 
              key="customers"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              dateFormat="DD/MM/YYYY"
            />
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
