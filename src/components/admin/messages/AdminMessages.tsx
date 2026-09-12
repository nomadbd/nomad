import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon } from '@/components/icons';

interface AdminMessagesProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
}

interface Message {
  id: string;
  sender: 'USER' | 'ADMIN';
  text: string;
  timestamp: string;
}

interface Thread {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  status: 'ACTIVE' | 'RESOLVED' | 'PENDING';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    });
  };

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const threadMap: { [key: string]: Thread } = {};

        data.forEach((item: any) => {
          const isSenderAdmin = (item.sender_role || '').toLowerCase() === 'admin';
          const userEmail = isSenderAdmin ? item.recipient_email : item.sender_email;
          const threadId = item.channel_id || userEmail || 'general';

          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          if (!threadMap[threadId]) {
            const displayEmail = userEmail || item.sender_email || '';
            threadMap[threadId] = {
              id: threadId,
              userName: displayEmail ? displayEmail.split('@')[0].toUpperCase() : 'GUEST',
              userEmail: displayEmail,
              role: (item.channel_type || item.sender_role || 'user').toUpperCase(),
              status: 'ACTIVE',
              unreadCount: item.is_read === false && !isSenderAdmin ? 1 : 0,
              lastMessage: item.message || '',
              lastMessageTime: formattedTime,
              messages: [],
            };
          } else {
            if (item.is_read === false && !isSenderAdmin) {
              threadMap[threadId].unreadCount += 1;
            }
          }

          threadMap[threadId].messages.push({
            id: item.id || String(Math.random()),
            sender: isSenderAdmin ? 'ADMIN' : 'USER',
            text: item.message || '',
            timestamp: formattedTime,
          });

          threadMap[threadId].lastMessage = item.message || '';
          threadMap[threadId].lastMessageTime = formattedTime;
        });

        const threadList = Object.values(threadMap);
        setThreads(threadList);

        if (threadList.length > 0 && !activeThreadId && !isMobile) {
          setActiveThreadId(threadList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'FAILED TO FETCH COMMUNICATIONS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();

    const channel = supabase
      .channel('public:communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  useEffect(() => {
    if (activeThread) {
      scrollToBottom(true);
    }
  }, [activeThread?.messages.length, activeThreadId]);

  const filteredThreads = threads.filter((t) => {
    const matchesRole = roleFilter === 'ALL' || t.role.toLowerCase() === roleFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.userName.toLowerCase().includes(query) ||
      t.userEmail.toLowerCase().includes(query) ||
      t.lastMessage.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = String(Date.now());

    const newMsg: Message = {
      id: tempId,
      sender: 'ADMIN',
      text: messageText,
      timestamp: nowTime,
    };

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: messageText,
            lastMessageTime: nowTime,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const { error } = await supabase.from('communications').insert([
        {
          sender_email: 'admin@nomadbd.com',
          sender_role: 'admin',
          recipient_email: activeThread.userEmail || null,
          message: messageText,
          channel_type: activeThread.role.toLowerCase(),
          channel_id: activeThread.id,
          is_read: false,
        },
      ]);

      if (error) {
        console.error('Send error:', error.message);
        fetchCommunications();
      }
    } catch (err: any) {
      console.error('Send error:', err);
    }
  };

  const showListOnMobile = isMobile && !activeThreadId;
  const showChatOnMobile = isMobile && !!activeThreadId;

  if (loading && threads.length === 0) {
    return (
      <div style={statusContainerStyle}>
        <span>FETCHING DATA FROM DESK...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ ...statusContainerStyle, color: '#f87171' }}>
        <span>ERROR: {errorMsg}</span>
        <button onClick={fetchCommunications} style={retryBtnStyle}>RETRY</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* FILTER BAR - FULL WIDTH */}
      {isFilterOpen && (
        <div style={headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#666666', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'STAFF', 'CUSTOMER', 'INVITED', 'AMBASSADOR'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...filterChipStyle,
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

      <div style={mainContentStyle}>
        {/* 1. THREAD LIST SECTION */}
        {(!isMobile || showListOnMobile) && (
          <div style={{ ...threadListColumnStyle, width: isMobile ? '100%' : '340px' }}>
            <div style={listHeaderStyle}>
              <span style={sectionTitleStyle}>MESSAGES ({filteredThreads.length})</span>
            </div>

            <div style={scrollListStyle}>
              {filteredThreads.length === 0 ? (
                <div style={emptyTextStyle}>NO MESSAGES FOUND</div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      style={{
                        ...threadCardStyle,
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
                      }}
                    >
                      <div style={threadHeaderRow}>
                        <span style={userNameStyle}>{thread.userName}</span>
                        <span style={timeStyle}>{thread.lastMessageTime}</span>
                      </div>

                      <div style={threadSubRow}>
                        <span style={roleBadgeStyle}>{thread.role}</span>
                        {thread.unreadCount > 0 && <span style={unreadBadgeStyle}>{thread.unreadCount}</span>}
                      </div>

                      <p style={previewMessageStyle}>{thread.lastMessage}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. MAIN CHAT VIEWPORT */}
        {(!isMobile || showChatOnMobile) && (
          <div style={chatPanelStyle}>
            {activeThread ? (
              <>
                {/* Chat Panel Header */}
                <div style={chatHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isMobile && (
                      <button onClick={() => setActiveThreadId(null)} style={backBtnStyle}>
                        ← BACK
                      </button>
                    )}
                    <div>
                      <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>
                        CONVERSATION WITH
                      </span>
                      <h3 style={{ fontSize: '13px', letterSpacing: '2px', fontWeight: 400, color: '#ffffff', margin: 0 }}>
                        {activeThread.userName}
                      </h3>
                      <span style={{ fontSize: '10px', color: '#888888', display: 'block', marginTop: '2px', fontWeight: 300 }}>
                        {activeThread.userEmail} • <span style={{ color: '#aaa' }}>{activeThread.role}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div ref={chatContainerRef} style={messageFeedStyle}>
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeThread.messages.map((msg) => {
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
                          <span style={{ fontSize: '8px', color: '#666666', letterSpacing: '1px', marginBottom: '3px' }}>
                            {isAdmin ? 'NOMAD DESK' : activeThread.userName}
                          </span>
                          <div
                            style={{
                              maxWidth: '85%',
                              padding: '10px 14px',
                              fontSize: '12px',
                              lineHeight: '1.5',
                              fontWeight: 300,
                              backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                              color: '#ffffff',
                              borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                              border: isAdmin ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {msg.text}
                          </div>
                          <span style={msgTimeStyle}>{msg.timestamp}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Message Input Bar */}
                <div style={chatInputAreaStyle}>
                  <form onSubmit={handleSendMessage} style={chatInputFormStyle}>
                    <textarea
                      ref={textareaRef}
                      style={textareaInputStyle}
                      rows={1}
                      placeholder="Type your response..."
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      required
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      style={{
                        width: '32px',
                        height: '32px',
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
              </>
            ) : (
              <div style={noSelectStyle}>SELECT A CONVERSATION TO START MESSAGING</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;

/* --- TELEGRAM / MESSAGING STYLE SHEET --- */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: 'calc(100vh - 60px)',
  backgroundColor: '#000000',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '80vh',
  color: '#888888',
  fontSize: '11px',
  letterSpacing: '2px',
  gap: '12px',
};

const retryBtnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: 'none',
  color: '#000000',
  padding: '8px 16px',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  cursor: 'pointer',
};

const headerFilterBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#050505',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  flexWrap: 'wrap',
  gap: '10px',
};

const filterChipStyle: React.CSSProperties = {
  border: '1px solid',
  padding: '5px 12px',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  cursor: 'pointer',
  borderRadius: '20px',
  transition: 'all 0.2s ease',
};

const mainContentStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const threadListColumnStyle: React.CSSProperties = {
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#000000',
  flexShrink: 0,
};

const listHeaderStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888888',
  letterSpacing: '2.5px',
  fontWeight: 600,
};

const scrollListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
};

const emptyTextStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: '#666666',
  fontSize: '11px',
  letterSpacing: '1px',
  fontWeight: 300,
};

const threadCardStyle: React.CSSProperties = {
  padding: '12px 16px',
  marginBottom: '2px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
};

const threadHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const userNameStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.5px',
  color: '#ffffff',
};

const timeStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#666666',
};

const threadSubRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#888888',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '2px 6px',
  borderRadius: '2px',
  letterSpacing: '1px',
};

const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontSize: '8px',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: '10px',
};

const previewMessageStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#bbbbbb',
  margin: 0,
  fontWeight: 300,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const chatPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#000000',
  height: '100%',
};

const chatHeaderStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#050505',
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  padding: '4px 8px',
  fontSize: '9px',
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: '2px',
  letterSpacing: '1px',
};

const messageFeedStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const msgTimeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#555555',
  marginTop: '4px',
};

const chatInputAreaStyle: React.CSSProperties = {
  padding: '16px',
  flexShrink: 0,
  backgroundColor: '#000000',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '28px',
  padding: '4px 6px 4px 16px',
  gap: '8px',
  width: '100%',
  boxSizing: 'border-box',
};

const textareaInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  outline: 'none',
  resize: 'none',
  maxHeight: '80px',
  lineHeight: '1.4',
  padding: '8px 0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
};

const noSelectStyle: React.CSSProperties = {
  margin: 'auto',
  color: '#666666',
  fontSize: '11px',
  letterSpacing: '2px',
  fontWeight: 300,
};
