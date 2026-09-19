import React from 'react';
import { CloseIcon, EmailIcon, CallIcon, MessageIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface UserDetailDrawerProps {
  isDrawerOpen: boolean;
  activeThread: any;
  closeDrawer: () => void;
  headerTitle?: string;
  formatDate: (dateStr?: string) => string;
  onNavigateToTab?: (tab: string, id: string) => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  isDrawerOpen,
  activeThread,
  closeDrawer,
  headerTitle,
  formatDate,
  onNavigateToTab,
}) => {
  if (!isDrawerOpen || !activeThread) return null;

  return (
    <div style={styles.drawerOverlayStyle} onClick={closeDrawer}>
      <div style={styles.drawerContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeaderStyle}>
          <span style={styles.drawerTitleStyle}>USER CONTACT DETAILS</span>
          <button onClick={closeDrawer} style={styles.drawerCloseBtnStyle} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div style={styles.profileHeroStyle}>
          <div style={{ ...styles.drawerAvatarStyle, overflow: 'hidden', padding: 0 }}>
            {activeThread.avatarUrl ? (
              <img
                src={activeThread.avatarUrl}
                alt={headerTitle || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div style={styles.drawerHeroTextStyle}>
            <span style={styles.drawerNameStyle}>{headerTitle}</span>
            {activeThread.userEmail && (
              <span style={{ fontSize: '11px', color: '#aaaaaa' }}>{activeThread.userEmail}</span>
            )}

            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.8px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#cccccc',
                display: 'inline-block',
                width: 'fit-content',
                marginTop: '6px',
              }}
            >
              {activeThread.role}
            </span>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '20px 0' }}>
          {activeThread.userEmail && (
            <a
              href={`mailto:${activeThread.userEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <EmailIcon />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.8px' }}>EMAIL</span>
            </a>
          )}

          {activeThread.userPhone && (
            <>
              <a
                href={`tel:${activeThread.userPhone}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <CallIcon />
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.8px' }}>CALL</span>
              </a>

              <a
                href={`https://wa.me/${activeThread.userPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <MessageIcon />
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.8px' }}>WHATSAPP</span>
              </a>
            </>
          )}
        </div>

        {/* DETAILS LIST */}
        <div style={styles.infoListStyle}>
          {activeThread.userEmail && (
            <div style={styles.infoRowStyle}>
              <span style={styles.infoLabelStyle}>Email Address</span>
              <span style={{ ...styles.infoValueStyle, color: '#ffffff' }}>{activeThread.userEmail}</span>
            </div>
          )}
          {activeThread.userPhone && (
            <div style={styles.infoRowStyle}>
              <span style={styles.infoLabelStyle}>Phone Number</span>
              <span style={{ ...styles.infoValueStyle, color: '#ffffff' }}>{activeThread.userPhone}</span>
            </div>
          )}
          <div style={styles.infoRowStyle}>
            <span style={styles.infoLabelStyle}>Account Role</span>
            <span style={{ ...styles.infoValueStyle, color: '#ffffff' }}>{activeThread.role}</span>
          </div>
          {activeThread.createdAt && (
            <div style={styles.infoRowStyle}>
              <span style={styles.infoLabelStyle}>Registered Date</span>
              <span style={{ ...styles.infoValueStyle, color: '#ffffff' }}>{formatDate(activeThread.createdAt)}</span>
            </div>
          )}
          {activeThread.inviteSentAt && (
            <div style={styles.infoRowStyle}>
              <span style={styles.infoLabelStyle}>Invite Sent Date</span>
              <span style={{ ...styles.infoValueStyle, color: '#ffffff' }}>{formatDate(activeThread.inviteSentAt)}</span>
            </div>
          )}
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => {
              closeDrawer();
              const roleLower = activeThread.role.toLowerCase();
              if (roleLower.includes('ambassador')) {
                onNavigateToTab('ambassadors', activeThread.id);
              } else if (roleLower.includes('staff')) {
                onNavigateToTab('staff', activeThread.id);
              } else {
                onNavigateToTab('customers', activeThread.id);
              }
            }}
            style={styles.fullProfileBtnStyle}
          >
            GO TO FULL MANAGEMENT TAB →
          </button>
        )}
      </div>
    </div>
  );
};
