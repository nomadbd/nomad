import React from 'react';
import * as styles from './AdminMessages.styles';

interface MessageSidebarProps {
  isFilterOpen: boolean;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  filteredThreads: any[];
  readThreadIds: Record<string, boolean>;
  handleThreadClick: (thread: any) => void;
  formatThreadTime: (dateInput?: string | number | Date) => string;
}

export const MessageSidebar: React.FC<MessageSidebarProps> = ({
  isFilterOpen,
  roleFilter,
  setRoleFilter,
  filteredThreads,
  readThreadIds,
  handleThreadClick,
  formatThreadTime,
}) => {
  return (
    <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
      {/* FILTER BAR */}
      {isFilterOpen && (
        <div style={styles.headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#aaaaaa', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              paddingBottom: '4px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {['ALL', 'AMBASSADOR', 'INVITED', 'STAFF'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...styles.filterChipStyle,
                  flexShrink: 0,
                  backgroundColor: roleFilter === role ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: roleFilter === role ? '#ffffff' : '#888888',
                  border: '1px solid',
                  borderColor: roleFilter === role ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                  fontWeight: roleFilter === role ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THREAD LIST */}
      {filteredThreads.length === 0 ? (
        <div style={{ ...styles.emptyTextStyle, color: '#aaaaaa' }}>NO CONVERSATIONS FOUND</div>
      ) : (
        filteredThreads.map((thread) => {
          const displayName = thread.userName && thread.userName.trim() ? thread.userName : thread.userEmail;
          const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

          const isRead = readThreadIds[thread.id];
          const displayUnread = isRead ? 0 : (thread.unreadCount ?? 0);

          return (
            <div
              key={thread.id}
              onClick={() => handleThreadClick(thread)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px 8px',
                borderRadius: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* AVATAR */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  overflow: 'hidden',
                }}
              >
                {thread.avatarUrl ? (
                  <img
                    src={thread.avatarUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initialLetter
                )}
              </div>

              {/* CARD CONTENT */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <span
                    style={{
                      color: '#ffffff',
                      fontWeight: 500,
                      fontSize: '13.5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      minWidth: 0,
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <span
                    style={{
                      color: '#aaaaaa',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      fontWeight: 400,
                    }}
                  >
                    {formatThreadTime(thread.lastMessageTime)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#bbbbbb',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {thread.role}
                  </span>

                  {displayUnread > 0 && (
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontWeight: 700,
                        fontSize: '9px',
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {displayUnread}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    color: '#cccccc',
                    fontSize: '12px',
                    fontWeight: 300,
                    margin: 0,
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {thread.lastMessage || 'No messages yet'}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
