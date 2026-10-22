import React from 'react';
import { PlusIcon, SearchIcon, FilterIcon, MenuIcon, CloseIcon, SettingsIcon } from '../../../components/icons';
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
}) => {
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
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', opacity: 0.5, marginRight: '8px' }}>
              <SearchIcon width={14} height={14} />
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#777',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            className={styles.nomadActionBtn}
            onClick={onCloseSearch}
            title="Close Search"
            aria-label="Close Search"
            style={{
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ) : (
        <>
          <a href="/" className={styles.nomadBrandLink} title="Go to Store Homepage">
            <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '4px', margin: 0, color: '#fff' }}>
              NOMAD
            </h1>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!menuOpen && (
              <>
                {(activeTab === 'products' || activeTab === 'ambassadors' || activeTab === 'messages' || activeTab === 'staff') && (
                  <button
                    className={`${styles.nomadActionBtn} ${isAddOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleAdd}
                    aria-label={
                      activeTab === 'messages'
                        ? 'Start New Chat'
                        : activeTab === 'products'
                        ? 'Add Product'
                        : activeTab === 'staff'
                        ? 'Add Staff'
                        : 'Add Ambassador'
                    }
                  >
                    <PlusIcon width={18} height={18} />
                  </button>
                )}

                {activeTab !== 'overview' && (
                  <button
                    className={`${styles.nomadActionBtn} ${isSearchOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleSearch}
                    aria-label="Search"
                    title="Search"
                  >
                    <SearchIcon width={18} height={18} />
                  </button>
                )}

                <button
                  className={`${styles.nomadActionBtn} ${isFilterOpen ? styles.nomadActionBtnActive : ''}`}
                  onClick={onToggleFilter}
                  aria-label="Filter"
                  title="Toggle Filter Panel"
                >
                  <FilterIcon width={18} height={18} />
                </button>

                {activeTab === 'logistics' && (
                  <button
                    className={`${styles.nomadActionBtn} ${isLogisticsSettingsOpen ? styles.nomadActionBtnActive : ''}`}
                    onClick={onToggleLogisticsSettings}
                    aria-label="Logistics Settings"
                    title="Toggle Logistics Settings"
                  >
                    <SettingsIcon width={18} height={18} />
                  </button>
                )}
              </>
            )}

            <button
              className={`${styles.nomadMenuToggle} ${styles.nomadMenuToggleBtn} ${menuOpen ? styles.nomadMenuToggleBtnActive : ''}`}
              onClick={onToggleMenu}
              aria-label="Toggle Menu"
              aria-expanded={menuOpen}
              title="Toggle Navigation"
            >
              {menuOpen ? <CloseIcon width={18} height={18} /> : <MenuIcon width={20} height={20} />}
            </button>
          </div>
        </>
      )}
    </header>
  );
};
