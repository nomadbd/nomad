import React from 'react';
import { GroupIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface MessageSidebarProps {
  isFilterOpen: boolean;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  filteredThreads: any[];
  readThreadIds: Record<string, boolean>;
  handleThreadClick: (thread: any) => void;
  formatThreadTime: (dateInput?: string | number | Date) => string;
  activeThreadId?: string | null;
}

export const MessageSidebar: React.FC<MessageSidebarProps> = ({
  isFilterOpen,
  roleFilter,
  setRoleFilter,
  filteredThreads,
  readThreadIds,
  handleThreadClick,
  formatThreadTime,
  activeThreadId,
}) => {
  const isGroupActive = activeThreadId === 'all_staff';

  const groupThread = filteredThreads.find((t) => t.id === 'all_staff') || {
    id: 'all_staff',
    userName: 'Management Team',
    lastMessage: 'Core management workspace',
    lastMessageTime: '',
    unreadCount: 0,
  };

  const regularThreads = filteredThreads.filter((t) => t.id !== 'all_staff');

  return (
    <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>

      {/* MANAGEMENT TEAM GROUP CHAT TILE (PARALLEL GAP WITH OTHER THREADS) */}
      <div
        onClick={() => handleThreadClick(groupThread)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '12px 8px',
          borderRadius: '8px',
          cursor: 'pointer',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: isGroupActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isGroupActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
        }}
        onMouseLeave={(e) => {
          if (!isGroupActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* AVATAR */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <GroupIcon size={18} color="#ffffff" />
        </div>

        {/* CARD CONTENT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '13.5px' }}>Management Team</span>
            <span style={{ color: '#aaaaaa', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 400 }}>
              {groupThread.lastMessageTime ? formatThreadTime(groupThread.lastMessageTime) : ''}
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
                textTransform: 'uppercase',
              }}
            >
              CORE GROUP
            </span>

            {groupThread.unreadCount > 0 && (
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
                {groupThread.unreadCount}
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
            {groupThread.lastMessage || 'Core management workspace'}
          </p>
        </div>
      </div>

      {/* DIVIDER LINE WITH EQUAL SPACING */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', width: '100%' }} />

      {/* FILTER BAR */}
      {isFilterOpen && (
        <div style={styles.headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#888888', fontWeight: 600, letterSpacing: '2.5px', marginBottom: '8px', display: 'block' }}>
            FILTER BY ROLE
          </span>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              paddingBottom: '6px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {['ALL', 'AMBASSADOR', 'STAFF', 'INVITED'].map((role) => {
              const isActive = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  style={{
                    ...styles.filterChipStyle,
                    flexShrink: 0,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? '#ffffff' : '#777777',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    fontSize: '10px',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* REGULAR THREAD LIST */}
      {regularThreads.length === 0 ? (
        <div style={{ ...styles.emptyTextStyle, color: '#aaaaaa' }}>NO CONVERSATIONS FOUND</div>
      ) : (
        regularThreads.map((thread) => {
          const displayName = thread.userName && thread.userName.trim() ? thread.userName : thread.userEmail;
          const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

          const isRead = readThreadIds[thread.id];
          const displayUnread = isRead ? 0 : (thread.unreadCount ?? 0);
          const isSelected = activeThreadId === thread.id;

          const badgeText = thread.designation && thread.designation.trim() !== '' 
            ? thread.designation 
            : thread.role;

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
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                    {badgeText}
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
