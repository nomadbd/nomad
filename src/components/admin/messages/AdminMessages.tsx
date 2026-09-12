import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SendIcon } from '@/components/icons';
import { AdminMessagesProps } from './types';
import { useAdminMessages } from './useAdminMessages';
import * as styles from './AdminMessages.styles';

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  activeThreadId: propActiveThreadId = null,
  onSelectThread,
}) => {
  const {
    activeThreadId,
    activeThread,
    filteredThreads,
    roleFilter,
    setRoleFilter,
    inputText,
    setInputText,
    loading,
    errorMsg,
    handleSelectThread,
    handleSendMessage,
    fetchCommunicationsAndUsers,
  } = useAdminMessages(searchQuery, propActiveThreadId, onSelectThread);

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile Visual Viewport & Keyboard Handler
  useEffect(() => {
    if (!activeThreadId) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        window.scrollTo(0, 0);
      }
    };

    if (window.visualViewport) {
      setViewportHeight(window.visualViewport.height);
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }, [activeThreadId]);

  // Mobile Back Button Handler
  useEffect(() => {
    if (activeThreadId) {
      window.history.pushState({ threadOpen: true }, '');
      const handlePopState = () => {
        handleSelectThread(null);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [activeThreadId]);

  // Reliable Auto-Scroll to Bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    if (activeThreadId) {
      scrollToBottom();
      const t1 = setTimeout(scrollToBottom, 50);
      const t2 = setTimeout(scrollToBottom, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeThreadId, activeThread?.messages.length, viewportHeight]);

  const isEmailSameAsName =
    !activeThread?.userName ||
    activeThread.userName.toLowerCase().trim() === activeThread.userEmail.toLowerCase().trim();

  const headerTitle = isEmailSameAsName ? activeThread?.userEmail : activeThread?.userName;
  const headerSubtitle = isEmailSameAsName
    ? activeThread?.userPhone || ''
    : `${activeThread?.userEmail}${activeThread?.userPhone ? ` • ${activeThread.userPhone}` : ''}`;

  if (loading && filteredThreads.length === 0) {
    return (
      <div style={styles.statusContainerStyle}>
        <span>FETCHING CHATS...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ ...styles.statusContainerStyle, color: '#f87171' }}>
        <span>ERROR: {errorMsg}</span>
        <button onClick={fetchCommunicationsAndUsers} style={styles.retryBtnStyle}>RETRY</button>
      </div>
    );
  }

  return (
    <div style={styles.containerStyle}>
      {/* FILTER BAR */}
      {isFilterOpen && !activeThreadId && (
        <div style={styles.headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#666666', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'AMBASSADOR', 'INVITED', 'CUSTOMER', 'STAFF'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...styles.filterChipStyle,
                  backgroundColor: roleFilter === role ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                  color: roleFilter === role ? '#000000' : '#888888',
                  borderColor: roleFilter === role ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: THREAD LIST */}
      {!activeThreadId ? (
        <div style={styles.listContainerStyle}>
          {filteredThreads.length === 0 ? (
            <div style={styles.emptyTextStyle}>NO CONVERSATIONS FOUND</div>
          ) : (
            filteredThreads.map((thread) => {
              const initialLetter = thread.userName.charAt(0).toUpperCase();
              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  style={styles.whatsappCardStyle}
                >
                  <div style={styles.avatarStyle}>{initialLetter}</div>

                  <div style={styles.cardContentStyle}>
                    <div style={styles.threadHeaderRow}>
                      <span style={styles.userNameStyle}>{thread.userName}</span>
                      <span style={styles.timeStyle}>{thread.lastMessageTime}</span>
                    </div>

                    <div style={styles.threadSubRow}>
                      <p style={styles.previewMessageStyle}>{thread.lastMessage}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            ...styles.roleBadgeStyle,
                            borderColor: thread.role.includes('INVITED') ? '#eab308' : 'rgba(255, 255, 255, 0.2)',
                            color: thread.role.includes('INVITED') ? '#eab308' : '#aaa',
                          }}
                        >
                          {thread.role}
                        </span>
                        {thread.unreadCount > 0 && <span style={styles.unreadBadgeStyle}>{thread.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW 2: VISUAL VIEWPORT LOCKED CHAT SCREEN */
        <div
          style={{
            ...styles.chatScreenContainerStyle,
            height: viewportHeight ? `${viewportHeight}px` : '100dvh',
          }}
        >
          {/* PINNED HEADER */}
          <div style={styles.whatsappHeaderStyle}>
            <button
              onClick={() => handleSelectThread(null)}
              style={styles.backBtnStyle}
              aria-label="Back"
            >
              ‹
            </button>

            <div style={styles.headerAvatarStyle}>
              {headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={styles.headerInfoStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.headerNameTitle}>{headerTitle}</span>
                <span
                  style={{
                    ...styles.roleBadgeStyle,
                    borderColor: activeThread?.role.includes('INVITED') ? '#eab308' : 'rgba(255, 255, 255, 0.3)',
                    color: activeThread?.role.includes('INVITED') ? '#eab308' : '#ffffff',
                    fontSize: '8px',
                  }}
                >
                  {activeThread?.role}
                </span>
              </div>

              {headerSubtitle && <span style={styles.headerSubtitleStyle}>{headerSubtitle}</span>}
            </div>
          </div>

          {/* SCROLLABLE CHAT MESSAGES */}
          <div ref={chatContainerRef} style={styles.chatFeedStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeThread?.messages.map((msg) => {
                const isAdmin = msg.sender === 'ADMIN';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAdmin ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        lineHeight: '1.45',
                        fontWeight: 300,
                        backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#ffffff',
                        borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        border: isAdmin ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={styles.msgTimeStyle}>{msg.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PINNED INPUT AREA */}
          <div style={styles.chatInputAreaStyle}>
            <form onSubmit={(e) => handleSendMessage(e, textareaRef)} style={styles.chatInputFormStyle}>
              <textarea
                ref={textareaRef}
                style={styles.textareaInputStyle}
                rows={1}
                placeholder="Type your response..."
                value={inputText}
                onFocus={() => setTimeout(scrollToBottom, 200)}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e, textareaRef);
                  }
                }}
                required
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: !inputText.trim() ? 0.25 : 1,
                  backgroundColor: inputText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                  color: inputText.trim() ? '#000000' : '#ffffff',
                  cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
