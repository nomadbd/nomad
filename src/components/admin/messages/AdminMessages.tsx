import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon, CloseIcon } from '@/components/icons';

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
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Animation & Height Lock States
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Lock Body & Handle Keyboard Viewport Adjustment on Mobile
  useEffect(() => {
    if (!selectedThread) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          top: `${window.visualViewport.offsetTop}px`,
        });
        scrollToBottom(false);
      }
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
    };
  }, [selectedThread]);

  // Open Chat Slide Modal
  const handleOpenThread = (thread: Thread) => {
    setSelectedThread(thread);
    setTimeout(() => {
      setIsModalAnimating(true);
      scrollToBottom(false);
    }, 20);
  };

  // Close Chat Slide Modal
  const handleCloseThread = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setSelectedThread(null);
    }, 300);
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
              role: (item.channel_type || item.sender_role || 'USER').toUpperCase(),
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

        // Keep selected thread in sync if open
        if (selectedThread) {
          const updated = threadList.find((t) => t.id === selectedThread.id);
          if (updated) setSelectedThread(updated);
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

  useEffect(() => {
    if (selectedThread) {
      scrollToBottom(true);
    }
  }, [selectedThread?.messages.length]);

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
    if (!inputText.trim() || !selectedThread) return;

    const messageText = inputText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = String(Date.now());

    const newMsg: Message = {
      id: tempId,
      sender: 'ADMIN',
      text: messageText,
      timestamp: nowTime,
    };

    // Optimistic UI Update
    setSelectedThread((prev) =>
      prev
        ? {
            ...prev,
            lastMessage: messageText,
            lastMessageTime: nowTime,
            messages: [...prev.messages, newMsg],
          }
        : null
    );

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id === selectedThread.id) {
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
          recipient_email: selectedThread.userEmail || null,
          message: messageText,
          channel_type: selectedThread.role.toLowerCase(),
          channel_id: selectedThread.id,
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

  if (loading && threads.length === 0) {
    return (
      <div style={statusContainerStyle}>
        <span>FETCHING CHATS...</span>
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
      {/* FILTER CHIPS BAR */}
      {isFilterOpen && (
        <div style={headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#666666', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'AMBASSADOR', 'CUSTOMER', 'STAFF', 'INVITED'].map((role) => (
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

      {/* WHATSAPP STYLE CHAT LIST */}
      <div style={listContainerStyle}>
        {filteredThreads.length === 0 ? (
          <div style={emptyTextStyle}>NO CONVERSATIONS FOUND</div>
        ) : (
          filteredThreads.map((thread) => {
            const initialLetter = thread.userName.charAt(0).toUpperCase();
            return (
              <div
                key={thread.id}
                onClick={() => handleOpenThread(thread)}
                style={whatsappCardStyle}
              >
                {/* User Avatar Badge */}
                <div style={avatarStyle}>
                  {initialLetter}
                </div>

                {/* Information Body */}
                <div style={cardContentStyle}>
                  <div style={threadHeaderRow}>
                    <span style={userNameStyle}>{thread.userName}</span>
                    <span style={timeStyle}>{thread.lastMessageTime}</span>
                  </div>

                  <div style={threadSubRow}>
                    <p style={previewMessageStyle}>{thread.lastMessage}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={roleBadgeStyle}>{thread.role}</span>
                      {thread.unreadCount > 0 && <span style={unreadBadgeStyle}>{thread.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONVERSATION MODAL (SLIDE UP) */}
      {selectedThread && (
        <div
          style={{
            ...modalBackdropStyle,
            ...viewportStyle,
            opacity: isModalAnimating ? 1 : 0,
            transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={handleCloseThread}
        >
          <div
            style={{
              ...modalBoxStyle,
              transform: isModalAnimating ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Icon */}
            <div style={modalHeaderStyle}>
              <div>
                <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>
                  PRIVATE DESK
                </span>
                <h3 style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: 400, color: '#ffffff', margin: 0 }}>
                  {selectedThread.userName}
                </h3>
                <span style={{ fontSize: '10px', color: '#888888', display: 'block', marginTop: '2px', fontWeight: 300 }}>
                  {selectedThread.userEmail} • <span style={{ color: '#aaa' }}>{selectedThread.role}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseThread}
                style={closeBtnStyle}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Chat Viewport */}
            <div
              ref={chatContainerRef}
              style={chatFeedStyle}
            >
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedThread.messages.map((msg) => {
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
                        {isAdmin ? 'NOMAD DESK' : selectedThread.userName}
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

            {/* Input Bar */}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;

/* --- WHATSAPP / TELEGRAM UI STYLES --- */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: 'calc(100vh - 60px)',
  backgroundColor: '#000000',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
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

const listContainerStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const emptyTextStyle: React.CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
  color: '#666666',
  fontSize: '11px',
  letterSpacing: '1.5px',
  fontWeight: 300,
};

const whatsappCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '14px 16px',
  gap: '14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: 'background-color 0.2s ease',
};

const avatarStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
  flexShrink: 0,
};

const cardContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const threadHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const userNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.5px',
  color: '#ffffff',
};

const timeStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666666',
  fontWeight: 300,
};

const threadSubRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

const previewMessageStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888888',
  margin: 0,
  fontWeight: 300,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#aaa',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '1px 5px',
  borderRadius: '2px',
  letterSpacing: '0.8px',
  flexShrink: 0,
};

const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#25D366', // WhatsApp Green Accent
  color: '#000000',
  fontSize: '9px',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: '10px',
  flexShrink: 0,
};

/* --- SLIDE-UP MODAL STYLES --- */
const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  top: 0,
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden',
};

const modalBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  height: '100%',
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: '#0a0a0a',
  flexShrink: 0,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ffffff',
  cursor: 'pointer',
  padding: '6px',
};

const chatFeedStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
};

const msgTimeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#555555',
  marginTop: '4px',
};

const chatInputAreaStyle: React.CSSProperties = {
  padding: '12px 16px',
  flexShrink: 0,
  backgroundColor: '#0a0a0a',
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
