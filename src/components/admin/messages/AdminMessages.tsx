import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SendIcon, BackIcon, CloseIcon, EmailIcon, CallIcon, MessageIcon } from '@/components/icons';
import { AdminMessagesProps } from './types';
import { useAdminMessages } from './useAdminMessages';
import * as styles from './AdminMessages.styles';

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  activeThreadId: propActiveThreadId = null,
  onSelectThread,
  onNavigateToTab,
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
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleSelectThread,
    handleSendMessage,
    fetchCommunicationsAndUsers,
  } = useAdminMessages(searchQuery, propActiveThreadId, onSelectThread);

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // TRACK READ THREADS LOCALLY SO BADGE CLEARS IMMEDIATELY ON CLICK
  const [readThreadIds, setReadThreadIds] = useState<Record<string, boolean>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Smart Timestamp Formatter for List View
  const formatThreadTime = (dateInput?: string | number | Date) => {
    if (!dateInput) return '';

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (date >= startOfYesterday) {
      return 'Yesterday';
    } else {
      const diffDays = Math.floor((startOfToday.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 6) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Helper for Chat Date Separator Header
  const getDateLabel = (dateInput?: string | number | Date) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle Thread Click & Mark as Read
  const handleThreadClick = (thread: any) => {
    setReadThreadIds((prev) => ({ ...prev, [thread.id]: true }));
    handleSelectThread(thread);
  };

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // UPDATED: Header Title and Subtitle Logic (Email Priority over Phone)
  const isEmailSameAsName =
    !activeThread?.userName ||
    activeThread.userName.toLowerCase().trim() === activeThread.userEmail?.toLowerCase().trim();

  const headerTitle = isEmailSameAsName
    ? (activeThread?.userEmail || activeThread?.userPhone || activeThread?.userName)
    : activeThread?.userName;

  const headerSubtitle = isEmailSameAsName
    ? (activeThread?.userEmail ? activeThread?.userPhone || '' : '')
    : (activeThread?.userEmail || activeThread?.userPhone || '');

  if (loading && filteredThreads.length === 0) {
    return (
      <div style={styles.statusContainerStyle}>
        <span style={{ color: '#cccccc' }}>FETCHING CHATS...</span>
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

  let lastRenderedDate: string | null = null;

  return (
    <div style={{ ...styles.containerStyle, padding: 0 }}>
      {/* FILTER BAR */}
      {isFilterOpen && !activeThreadId && (
        <div style={styles.headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#aaaaaa', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'AMBASSADOR', 'INVITED', 'CUSTOMER', 'STAFF'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...styles.filterChipStyle,
                  backgroundColor: roleFilter === role ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                  color: roleFilter === role ? '#000000' : '#bbbbbb',
                  borderColor: roleFilter === role ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
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
        <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
          {filteredThreads.length === 0 ? (
            <div style={{ ...styles.emptyTextStyle, color: '#aaaaaa' }}>NO CONVERSATIONS FOUND</div>
          ) : (
            filteredThreads.map((thread) => {
              const displayName = thread.userName && thread.userName.trim() ? thread.userName : thread.userEmail;
              const initialLetter = displayName.charAt(0).toUpperCase();

              // Calculate real unread status locally
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
                    }}
                  >
                    {initialLetter}
                  </div>

                  {/* CARD CONTENT */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>

                    {/* LINE 1: NAME / EMAIL + SMART TIME */}
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

                    {/* LINE 2: ROLE BADGE + UNREAD COUNT */}
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

                      {/* ONLY SHOW BADGE IF UNREAD > 0 AND NOT YET READ */}
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

                    {/* LINE 3: MESSAGE PREVIEW */}
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
      ) : (
        /* VIEW 2: CHAT SCREEN */
        <div
          style={{
            ...styles.chatScreenContainerStyle,
            height: viewportHeight ? `${viewportHeight}px` : '100dvh',
          }}
        >
          {/* HEADER */}
          <div style={styles.whatsappHeaderStyle}>
            <button
              onClick={() => handleSelectThread(null)}
              style={styles.backBtnStyle}
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div style={styles.headerAvatarStyle} onClick={openDrawer}>
              {headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={styles.headerInfoStyle} onClick={openDrawer}>
              <span style={{ ...styles.headerNameTitle, color: '#ffffff' }}>{headerTitle}</span>
              {headerSubtitle && (
                <span style={{ ...styles.headerSubtitleStyle, color: '#bbbbbb' }}>{headerSubtitle}</span>
              )}
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div ref={chatContainerRef} style={styles.chatFeedStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeThread?.messages.map((msg) => {
                const isAdmin = msg.sender === 'ADMIN';

                // Date separator logic
                const currentDateLabel = getDateLabel(activeThread.lastMessageTime);
                let showDateDivider = false;
                if (currentDateLabel && currentDateLabel !== lastRenderedDate) {
                  showDateDivider = true;
                  lastRenderedDate = currentDateLabel;
                }

                return (
                  <React.Fragment key={msg.id}>
                    {/* DATE DIVIDER */}
                    {showDateDivider && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          margin: '14px 0 6px 0',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#dddddd',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {currentDateLabel}
                        </span>
                      </div>
                    )}

                    {/* CHAT BUBBLE */}
                    <div
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
                          backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          border: isAdmin ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.text}
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: '#aaaaaa',
                          marginTop: '3px',
                          padding: '0 2px',
                          fontWeight: 400,
                        }}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* INPUT AREA */}
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
                  opacity: !inputText.trim() ? 0.3 : 1,
                  backgroundColor: inputText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
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

      {/* QUICK ACTION DRAWER / BOTTOM SHEET */}
      {isDrawerOpen && activeThread && (
        <div style={styles.drawerOverlayStyle} onClick={closeDrawer}>
          <div style={styles.drawerContainerStyle} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeaderStyle}>
              <span style={styles.drawerTitleStyle}>USER CONTACT DETAILS</span>
              <button onClick={closeDrawer} style={styles.drawerCloseBtnStyle} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div style={styles.profileHeroStyle}>
              <div style={styles.drawerAvatarStyle}>
                {headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'}
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

            {/* UPDATED: QUICK ACTIONS (CONDITIONAL RENDERING) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '20px 0' }}>
              {/* ইমেইল থাকলে তবেই ইমেইল বাটন দেখাবে */}
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

              {/* ফোন নম্বর থাকলেই কেবল কল এবং ওয়াটসঅ্যাপ বাটন দেখাবে */}
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
      )}
    </div>
  );
};

export default AdminMessages;
