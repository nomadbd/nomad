import React from 'react';
import type { TabType } from '../AdminDashboard';

interface AdminSidebarProps {
  styles: { [key: string]: string };
  menuOpen: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userName: string;
  userEmail: string;
  userDesignation: string;
  onOpenProfile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  styles,
  menuOpen,
  activeTab,
  onTabChange,
  userName,
  userEmail,
  userDesignation,
  onOpenProfile,
}) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'orders', label: 'ORDERS' },
    { id: 'products', label: 'PRODUCTS' },
    { id: 'logistics', label: 'LOGISTICS' },
    { id: 'history', label: 'ACTIVITY LOGS' }, // ← নতুন হিস্ট্রি/অ্যাক্টিভিটি লগ ট্যাব যুক্ত করা হলো
    { id: 'messages', label: 'MESSAGES' },
    { id: 'notifications', label: 'NOTIFICATIONS' },
    { id: 'reminders', label: 'REMINDERS' },
    { id: 'ambassadors', label: 'AMBASSADORS' },
    { id: 'staff', label: 'STAFF' },
    { id: 'customers', label: 'CUSTOMERS' },
  ];

  return (
    <aside className={`${styles.nomadSidebar} ${menuOpen ? styles.menuOpen : ''}`}>
      <div className={styles.sidebarStack}>
        <nav className={styles.nomadNav} data-nomad-nav>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}

          <div style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a', paddingTop: '12px' }}>
            <button
              className={styles.navBtn}
              onClick={onOpenProfile}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
            >
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                {userName || userEmail || 'PROFILE'}
              </span>
              {userDesignation && (
                <span style={{ fontSize: '9px', color: '#888888', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {userDesignation}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
};
