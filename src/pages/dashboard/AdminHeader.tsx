import React from 'react';
import { PlusIcon, SearchIcon, FilterIcon, MenuIcon, CloseIcon, SettingsIcon } from '../../components/icons';
import type { TabType } from '../AdminDashboard';

interface AdminHeaderProps {
  styles: { [key: string]: string };
  isHeaderVisible: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCloseSearch: () => void;
  activeTab: TabType;
  isAddOpen: boolean;
  onToggleAdd: () => void;
  onToggleSearch: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  isLogisticsSettingsOpen: boolean;
  onToggleLogisticsSettings: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  subPage?: string | null; 
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  styles,
  isHeaderVisible,
  isSearchOpen,
  searchQuery,
  onSearchChange,
  onCloseSearch,
  activeTab,
  isAddOpen,
  onToggleAdd,
  onToggleSearch,
  isFilterOpen,
  onToggleFilter,
  isLogisticsSettingsOpen,
  onToggleLogisticsSettings,
  menuOpen,
  onToggleMenu,
  subPage,
}) => {
  const getHeaderTitle = () => {
    if (subPage === 'history') return 'ACTIVITY LOGS';

    switch (activeTab) {
      case 'overview': return 'OVERVIEW';
      case 'orders': return 'ORDERS';
      case 'products': return 'PRODUCTS';
      case 'logistics': return 'LOGISTICS';
      case 'messages': return 'MESSAGES';
      case 'notifications': return 'NOTIFICATIONS';
      case 'reminders': return 'REMINDERS';
      case 'ambassadors': return 'AMBASSADORS';
      case 'staff': return 'STAFF';
      case 'customers': return 'CUSTOMERS';
      case 'history': return 'ACTIVITY LOGS'; // ← নতুন যুক্ত হওয়া 'history' ট্যাবের টাইটেল
      default: return 'NOMAD';
    }
  };

  return (
    <header className={`${styles.nomadHeader} ${!isHeaderVisible ? styles.headerHidden : ''}`}>
      {isSearchOpen ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #2d2d2d',
              borderRadius: '25px',
              padding: '2px 14px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', opacity: 0.5, marginRight: '8px' }}>
              <SearchIcon width={14} height={14} stroke="#888888" />
            </div>
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '7px 0',
                fontSize: '11px',
                fontFamily: 'monospace, sans-serif',
                letterSpacing: '1px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '11px', padding: '0 4px' }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            className={styles.nomadActionBtn}
            onClick={onCloseSearch}
            style={{ borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <CloseIcon width={14} height={14} stroke="#ffffff" />
          </button>
        </div>
      ) : (
        <>
          <div className={styles.nomadBrandLink} style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '2.5px', margin: 0, color: '#fff', textTransform: 'uppercase' }}>
              {getHeaderTitle()}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!menuOpen && (
              <>
                {/* Plus / Add Icon */}
                {(activeTab === 'products' || activeTab === 'ambassadors' || activeTab === 'messages' || activeTab === 'staff') && (
                  <button
                    className={`${styles.nomadActionBtn} ${isAddOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleAdd}
                    title="Add Item"
                  >
                    <PlusIcon width={18} height={18} stroke={isAddOpen ? '#ffffff' : '#888888'} />
                  </button>
                )}

                {/* Search Icon */}
                {activeTab !== 'overview' && (
                  <button
                    className={`${styles.nomadActionBtn} ${isSearchOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleSearch}
                    title="Search"
                  >
                    <SearchIcon width={18} height={18} stroke={isSearchOpen ? '#ffffff' : '#888888'} />
                  </button>
                )}

                {/* Filter Icon */}
                <button
                  className={`${styles.nomadActionBtn} ${isFilterOpen ? styles.nomadActionBtnActive : ''}`}
                  onClick={onToggleFilter}
                  title="Filter Panel"
                >
                  <FilterIcon width={18} height={18} stroke={isFilterOpen ? '#ffffff' : '#888888'} />
                </button>

                {/* Settings Icon */}
                {activeTab === 'logistics' && (
                  <button
                    className={`${styles.nomadActionBtn} ${isLogisticsSettingsOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleLogisticsSettings}
                    title="Logistics Settings"
                  >
                    <SettingsIcon width={18} height={18} stroke={isLogisticsSettingsOpen ? '#ffffff' : '#888888'} />
                  </button>
                )}
              </>
            )}

            {/* Menu / Close Toggle Icon */}
            <button
              className={`${styles.nomadMenuToggle} ${styles.nomadMenuToggleBtn} ${menuOpen ? styles.nomadMenuToggleBtnActive : ''}`}
              onClick={onToggleMenu}
              title="Toggle Navigation"
            >
              {menuOpen ? (
                <CloseIcon width={18} height={18} stroke="#ffffff" />
              ) : (
                <MenuIcon width={20} height={18} stroke="#888888" />
              )}
            </button>
          </div>
        </>
      )}
    </header>
  );
};
