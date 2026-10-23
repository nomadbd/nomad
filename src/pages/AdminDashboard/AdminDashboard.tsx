import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { supabase } from '../../supabaseClient';

import {
  AdminOverview,
  AdminOrders,
  AdminProducts,
  AdminStaff,
  AdminCustomers,
  AdminLogistics,
  StaffProfile,
  AdminMessages,
  AdminNotifications
} from '../../components/admin';
import AdminReminders from '../../components/admin/reminders/AdminReminders';
import { SendInvite, AmbassadorList } from '../../components/admin/ambassadors';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import ReminderLoading from '../../components/ui/ReminderLoading';

export type TabType = 
  | 'overview'
  | 'orders'
  | 'products'
  | 'logistics'
  | 'messages'
  | 'notifications'
  | 'customers'
  | 'ambassadors'
  | 'staff'
  | 'reminders';

const AdminDashboard: React.FC = () => {
  const getTabFromURL = (): TabType => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabType;
    const validTabs: TabType[] = [
      'overview', 'orders', 'products', 'logistics', 'messages', 
      'notifications', 'customers', 'ambassadors', 'staff', 'reminders'
    ];
    return validTabs.includes(tab) ? tab : 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromURL);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isLogisticsSettingsOpen, setIsLogisticsSettingsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    setIsLogisticsSettingsOpen(false);
    setSearchQuery('');
    setActiveChat(null);

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tab', tab);
    const newPath = `${window.location.pathname}?${searchParams.toString()}`;

    window.history.pushState({ path: newPath }, '', newPath);
  };

  const toggleMenu = () => {
    setMenuOpen((wasOpen) => {
      const next = !wasOpen;
      if (next) {
        setIsSearchOpen(false);
        setIsFilterOpen(false);
        setIsHeaderVisible(true);
      }
      return next;
    });
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

  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    body.classList.add('nomad-menu-lock');
    body.style.top = `-${scrollY}px`;

    const preventPageScroll = (event: TouchEvent) => {
      const nav = document.querySelector('[data-nomad-nav]');
      const footer = document.querySelector('[data-nomad-menu-footer]');
      const target = event.target as Node | null;
      if (target && ((nav && nav.contains(target)) || (footer && footer.contains(target)))) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener('touchmove', preventPageScroll, { passive: false });

    return () => {
      body.classList.remove('nomad-menu-lock');
      body.style.top = '';
      document.removeEventListener('touchmove', preventPageScroll);
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

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
    }
  };

  // ফ্লিকারিং ছাড়া ৩ সেকেন্ডের মিনিমাম লোডিং লজিক
  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      const startTime = Date.now();
      await fetchCurrentUserAndRole();

      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 3000;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      setTimeout(() => {
        if (isMounted) {
          setLoading(false);
        }
      }, remainingTime);
    };

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedRole = userRole.toUpperCase().trim();
  const hasAdminAccess = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(normalizedRole);

  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      window.location.href = '/profile';
    }
  }, [loading, hasAdminAccess]);

  // কোনো লেবেল দেওয়া ছাড়াই রেন্ডার করা হলো
  if (loading) {
    return <ReminderLoading label="" />;
  }

  if (!hasAdminAccess) {
    return null;
  }

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
      {!isChatOpen && (
        <AdminHeader
          styles={styles}
          isHeaderVisible={isHeaderVisible}
          isSearchOpen={isSearchOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCloseSearch={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          activeTab={activeTab}
          isAddOpen={isAddOpen}
          onToggleAdd={() => setIsAddOpen(!isAddOpen)}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
          isLogisticsSettingsOpen={isLogisticsSettingsOpen}
          onToggleLogisticsSettings={() => setIsLogisticsSettingsOpen(!isLogisticsSettingsOpen)}
          menuOpen={menuOpen}
          onToggleMenu={toggleMenu}
        />
      )}

      <div className={`${styles.nomadLayout} ${menuOpen ? styles.menuLocked : ''}`}>
        <AdminSidebar
          styles={styles}
          menuOpen={menuOpen}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {menuOpen && (
          <button
            type="button"
            className={styles.menuBackdrop}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

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
              isSettingsOpen={isLogisticsSettingsOpen}
            />
          )}
          {activeTab === 'messages' && (
            <AdminMessages
              key="messages"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              isSearchOpen={isSearchOpen}
              isAddOpen={isAddOpen}
              onCloseAdd={() => setIsAddOpen(false)}
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
          {activeTab === 'notifications' && (
            <AdminNotifications key="notifications" />
          )}
          {activeTab === 'customers' && (
            <AdminCustomers
              key="customers"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              dateFormat="DD/MM/YYYY"
            />
          )}
          {activeTab === 'ambassadors' && (
            <>
              <AmbassadorList
                key="ambassadors-list"
                searchQuery={searchQuery}
                isFilterOpen={isFilterOpen}
                onOpenChat={(ambassadorId, ambassadorEmail) => {
                  handleTabChange('messages');
                  setActiveChat({
                    id: ambassadorId,
                    userName: '',
                    userEmail: ambassadorEmail,
                    role: 'AMBASSADOR',
                  });
                }}
              />
              <SendInvite
                key="ambassadors-invite"
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
              />
            </>
          )}
          {activeTab === 'staff' && (
            <AdminStaff
              key="staff"
              searchQuery={searchQuery}
              isFilterOpen={isFilterOpen}
              isSearchOpen={isSearchOpen}
              dateFormat="DD/MM/YYYY"
              isAddOpen={isAddOpen}
              onCloseAdd={() => setIsAddOpen(false)}
            />
          )}
          {activeTab === 'reminders' && (
            <AdminReminders key="reminders" />
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
