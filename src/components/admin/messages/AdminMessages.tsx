import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  AdminMessagesProps,
  useAdminMessages,
  MessageSidebar,
  ChatHeader,
  MessageList,
  ChatInput,
  NewChatModal,
  UserDetailDrawer,
} from './index';
import * as styles from './AdminMessages.styles';

interface ExtendedAdminMessagesProps extends AdminMessagesProps {
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
  isSearchOpen?: boolean;
}

export const AdminMessages: React.FC<ExtendedAdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  isAddOpen = false,
  onCloseAdd,
  activeThreadId: propActiveThreadId = null,
  onSelectThread,
  onNavigateToTab,
}) => {
  const {
    activeThreadId,
    activeThread,
    filteredThreads,
    allUsers,
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
    adminEmail,
  } = useAdminMessages(searchQuery, propActiveThreadId, onSelectThread);

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [newChatSearch, setNewChatSearch] = useState<string>('');
  const [readThreadIds, setReadThreadIds] = useState<Record<string, boolean>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ইউআরএল থেকে ডিটেক্ট করা
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const targetUserIdFromUrl = searchParams.get('userId') || searchParams.get('recipientId');

  const clearUserIdParam = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('userId') || url.searchParams.has('recipientId')) {
      url.searchParams.delete('userId');
      url.searchParams.delete('recipientId');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  };

  const formatThreadTime = (dateInput?: string | number | Date) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

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
      if (diffDays < 6) return date.toLocaleDateString('en-US', { weekday: 'short' });
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDateLabel = (dateInput?: string | number | Date) => {
    if (!dateInput) return 'Today';
    if (typeof dateInput === 'string' && /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(dateInput.trim())) return 'Today';

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Today';

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleThreadClick = (thread: any) => {
    setReadThreadIds((prev) => ({ ...prev, [thread.id]: true }));
    handleSelectThread(thread);
    if (onCloseAdd) onCloseAdd();
  };

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

  // ১-ট্যাপ ব্যাক নেভিগেশন (একবার ব্যাকেই আগের পেজে ফেরা)
  useEffect(() => {
    if (!activeThreadId) return;

    // শুধুমাত্র যদি আগে থেকে হিস্ট্রি পুশ না করা থাকে তবেই একটি স্টেট যুক্ত করা
    if (!window.history.state?.chatThreadActive) {
      window.history.pushState({ chatThreadActive: true, threadId: activeThreadId }, '');
    }

    const handlePopState = () => {
      clearUserIdParam();
      handleSelectThread(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeThreadId]);

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
  }, [activeThreadId, activeThread?.messages?.length, viewportHeight]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getResolvedName = (thread: any) => {
    if (!thread) return '';
    if (thread.displayName && thread.displayName.trim()) return thread.displayName;
    if (thread.userName && thread.userName.trim() && thread.userName !== thread.assigned_slug && thread.userName !== thread.token) {
      return thread.userName;
    }
    return thread.displayName || thread.userName || thread.userEmail || thread.userPhone || 'GUEST';
  };

  const resolvedThreadName = getResolvedName(activeThread);

  const isEmailSameAsName =
    !resolvedThreadName ||
    resolvedThreadName.toLowerCase().trim() === activeThread?.userEmail?.toLowerCase().trim();

  const headerTitle = isEmailSameAsName
    ? (activeThread?.userEmail || activeThread?.userPhone || resolvedThreadName)
    : resolvedThreadName;

  const headerSubtitle = isEmailSameAsName
    ? (activeThread?.userEmail ? activeThread?.userPhone || '' : '')
    : (activeThread?.userEmail || activeThread?.userPhone || '');

  const enhancedThreads = filteredThreads.map((t) => ({
    ...t,
    userName: getResolvedName(t),
  }));

  const sourceUsers = allUsers && allUsers.length > 0 ? allUsers : enhancedThreads;

  const newChatUsers = sourceUsers.filter((t) => {
    const userRole = (t.role || '').toUpperCase();
    if (userRole === 'CUSTOMER') return false;

    if (!newChatSearch.trim()) return true;
    const q = newChatSearch.toLowerCase().trim();
    return (
      t.userName?.toLowerCase().includes(q) ||
      t.userEmail?.toLowerCase().includes(q) ||
      t.userPhone?.toLowerCase().includes(q) ||
      t.designation?.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q)
    );
  });

  // সরাসরি চ্যাট ওপেন হওয়ার ফিল্টার
  const isOpeningDirectChat = Boolean(activeThreadId || targetUserIdFromUrl || propActiveThreadId);

  // উন্নত পালসিং স্কেলিটন ಲೋഡর UI
  if (loading || (isOpeningDirectChat && !activeThread)) {
    return (
      <div
        style={{
          ...styles.containerStyle,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          boxSizing: 'border-box',
          backgroundColor: '#000000',
        }}
      >
        <style>{`
          @keyframes skeletonPulse {
            0% { opacity: 0.25; }
            50% { opacity: 0.65; }
            100% { opacity: 0.25; }
          }
          .skeleton-pulse {
            animation: skeletonPulse 1.4s ease-in-out infinite;
          }
        `}</style>

        {isOpeningDirectChat ? (
          // স্টাফ বা অন্য জায়গা থেকে চ্যাট ওপেন করার সময় সরাসরি চ্যাট উইন্ডোর স্কেলিটন
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* চ্যাট হেডার স্কেলিটন */}
            <div
              className="skeleton-pulse"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '14px',
                borderBottom: '1px solid #18181b',
              }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#27272a' }} />
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#27272a' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '40%', height: '12px', backgroundColor: '#27272a', borderRadius: '4px' }} />
                <div style={{ width: '25%', height: '10px', backgroundColor: '#1f1f23', borderRadius: '4px' }} />
              </div>
            </div>

            {/* চ্যাট মেসেজ বাবল স্কেলিটন */}
            <div style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton-pulse" style={{ alignSelf: 'flex-start', width: '55%', height: '40px', backgroundColor: '#18181b', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ alignSelf: 'flex-end', width: '65%', height: '52px', backgroundColor: '#27272a', borderRadius: '12px' }} />
              <div className="skeleton-pulse" style={{ alignSelf: 'flex-start', width: '45%', height: '36px', backgroundColor: '#18181b', borderRadius: '12px' }} />
            </div>

            {/* ইনপুট বক্স স্কেলিটন */}
            <div className="skeleton-pulse" style={{ height: '48px', backgroundColor: '#18181b', borderRadius: '24px', border: '1px solid #27272a' }} />
          </div>
        ) : (
          // সাধারণ মেসেজ ট্যাবে চ্যাট লিস্টের স্কেলিটন
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="skeleton-pulse"
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #1f1f23',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#27272a', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ width: '45%', height: '12px', backgroundColor: '#27272a', borderRadius: '4px' }} />
                  <div style={{ width: '70%', height: '10px', backgroundColor: '#1f1f23', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
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
    <div style={{ ...styles.containerStyle, padding: 0, position: 'relative' }}>
      {!activeThreadId ? (
        <MessageSidebar
          isFilterOpen={isFilterOpen}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          filteredThreads={enhancedThreads}
          readThreadIds={readThreadIds}
          handleThreadClick={handleThreadClick}
          formatThreadTime={formatThreadTime}
          activeThreadId={activeThreadId}
        />
      ) : (
        <div
          style={{
            ...styles.chatScreenContainerStyle,
            height: viewportHeight ? `${viewportHeight}px` : '100dvh',
          }}
        >
          <ChatHeader
            activeThread={activeThread}
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            onBack={() => {
              clearUserIdParam();
              if (window.history.state?.chatThreadActive) {
                window.history.back();
              } else {
                handleSelectThread(null);
              }
            }}
            openDrawer={openDrawer}
          />

          <MessageList
            activeThread={activeThread}
            chatContainerRef={chatContainerRef as React.RefObject<HTMLDivElement>}
            getDateLabel={getDateLabel}
            currentUserEmail={adminEmail}
          />

          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
            scrollToBottom={scrollToBottom}
          />
        </div>
      )}

      <NewChatModal
        isAddOpen={isAddOpen}
        onCloseAdd={onCloseAdd}
        newChatSearch={newChatSearch}
        setNewChatSearch={setNewChatSearch}
        newChatUsers={newChatUsers}
        handleThreadClick={handleThreadClick}
      />

      <UserDetailDrawer
        isDrawerOpen={isDrawerOpen}
        activeThread={activeThread}
        closeDrawer={closeDrawer}
        headerTitle={headerTitle}
        formatDate={formatDate}
        onNavigateToTab={onNavigateToTab}
      />
    </div>
  );
};

export default AdminMessages;
