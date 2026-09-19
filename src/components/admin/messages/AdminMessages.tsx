import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AdminMessagesProps } from './types';
import { useAdminMessages } from './useAdminMessages';
import * as styles from './AdminMessages.styles';

import { MessageSidebar } from './MessageSidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { NewChatModal } from './NewChatModal';
import { UserDetailDrawer } from './UserDetailDrawer';

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
  const [newChatSearch, setNewChatSearch] = useState<string>('');
  const [readThreadIds, setReadThreadIds] = useState<Record<string, boolean>>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (activeThreadId) {
      window.history.pushState({ threadOpen: true }, '');
      const handlePopState = () => handleSelectThread(null);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
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
  }, [activeThreadId, activeThread?.messages.length, viewportHeight]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isEmailSameAsName =
    !activeThread?.userName ||
    activeThread.userName.toLowerCase().trim() === activeThread.userEmail?.toLowerCase().trim();

  const headerTitle = isEmailSameAsName
    ? (activeThread?.userEmail || activeThread?.userPhone || activeThread?.userName)
    : activeThread?.userName;

  const headerSubtitle = isEmailSameAsName
    ? (activeThread?.userEmail ? activeThread?.userPhone || '' : '')
    : (activeThread?.userEmail || activeThread?.userPhone || '');

  const newChatUsers = filteredThreads.filter((t) => {
    if (!newChatSearch.trim()) return true;
    const q = newChatSearch.toLowerCase().trim();
    return (
      t.userName?.toLowerCase().includes(q) ||
      t.userEmail?.toLowerCase().includes(q) ||
      t.userPhone?.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q)
    );
  });

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

  return (
    <div style={{ ...styles.containerStyle, padding: 0, position: 'relative' }}>
      {!activeThreadId ? (
        <MessageSidebar
          isFilterOpen={isFilterOpen}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          filteredThreads={filteredThreads}
          readThreadIds={readThreadIds}
          handleThreadClick={handleThreadClick}
          formatThreadTime={formatThreadTime}
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
            onBack={() => handleSelectThread(null)}
            openDrawer={openDrawer}
          />

          <MessageList
            activeThread={activeThread}
            chatContainerRef={chatContainerRef as React.RefObject<HTMLDivElement>}
            getDateLabel={getDateLabel}
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
