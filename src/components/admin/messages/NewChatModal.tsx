import React from 'react';
import { CloseIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface NewChatModalProps {
  isAddOpen: boolean;
  onCloseAdd?: () => void;
  newChatSearch: string;
  setNewChatSearch: (val: string) => void;
  newChatUsers: any[];
  handleThreadClick: (user: any) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isAddOpen,
  onCloseAdd,
  newChatSearch,
  setNewChatSearch,
  newChatUsers,
  handleThreadClick,
}) => {
  if (!isAddOpen) return null;

  return (
    <div style={styles.drawerOverlayStyle} onClick={onCloseAdd}>
      <div
        style={{ ...styles.drawerContainerStyle, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.drawerHeaderStyle}>
          <span style={styles.drawerTitleStyle}>START NEW CONVERSATION</span>
          <button onClick={onCloseAdd} style={styles.drawerCloseBtnStyle} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: '12px 0' }}>
          <input
            type="text"
            placeholder="SEARCH USER, EMAIL OR PHONE..."
            value={newChatSearch}
            onChange={(e) => setNewChatSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {newChatUsers.length === 0 ? (
            <p style={{ color: '#aaaaaa', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
              NO USERS FOUND
            </p>
          ) : (
            newChatUsers.map((user) => {
              const name = user.userName || user.userEmail || 'User';
              return (
                <div
                  key={user.id}
                  onClick={() => handleThreadClick(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </div>
                    {user.userEmail && (
                      <div style={{ color: '#888888', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.userEmail}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#cccccc', textTransform: 'uppercase' }}>
                    {user.role}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
