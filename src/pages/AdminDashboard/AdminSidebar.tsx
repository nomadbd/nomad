import React from 'react';
import type { TabType } from '../AdminDashboard';

interface AdminSidebarProps {
  styles: { [key: string]: string };
  menuOpen: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userName: string;
  userEmail: string;
  userRole: string;
  onOpenProfile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  styles,
  menuOpen,
  activeTab,
  onTabChange,
  userName,
  userEmail,
  userRole,
  onOpenProfile,
}) => {
  const subTextStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#888888',
    fontWeight: 600,
    letterSpacing: '1px',
    display: 'block',
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'orders', label: 'ORDERS' },
    { id: 'products', label: 'PRODUCTS' },
    { id: 'logistics', label: 'LOGISTICS' },
    { id: 'messages', label: 'MESSAGES' },
    { id: 'notifications', label: 'NOTIFICATIONS' },
    { id: 'ambassadors', label: 'AMBASSADORS' },
    { id: 'staff', label: 'STAFF' },
    { id: 'customers', label: 'CUSTOMERS' },
  ];

  return (
    <aside className={`${styles.nomadSidebar} ${menuOpen ? styles.menuOpen : ''}`}>
      <div className={styles.sidebarStack}>
        <nav className={styles.nomadNav} data-nomad-nav>
          <span style={{ fontSize: '9px', color: '#888888', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>
            MAIN MENU
          </span>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.userFooterBlock} data-nomad-menu-footer>
        <div
          onClick={onOpenProfile}
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #1f1f1f',
            padding: '10px 12px',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
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
                letterSpacing: '1px',
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
  );
};
