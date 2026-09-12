import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon } from '@/components/icons';

interface AdminMessagesProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  activeThreadId?: string | null;
  onSelectThread?: (id: string | null, thread?: Thread | null) => void;
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
  userPhone?: string;
  role: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  activeThreadId: propActiveThreadId = null,
  onSelectThread,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [internalActiveThreadId, setInternalActiveThreadId] = useState<string | null>(propActiveThreadId);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isThreadReady, setIsThreadReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesCountRef = useRef<number>(0);

  useEffect(() => {
    setInternalActiveThreadId(propActiveThreadId);
  }, [propActiveThreadId]);

  const activeThreadId = propActiveThreadId !== undefined && propActiveThreadId !== null ? propActiveThreadId : internalActiveThreadId;

  const handleSelectThread = (thread: Thread | null) => {
    const threadId = thread ? thread.id : null;
    setInternalActiveThreadId(threadId);
    if (onSelectThread) {
      onSelectThread(threadId, thread);
    }
  };

  // Native Mobile Back Button Support
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

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // Instant scroll to bottom on thread open with skeleton load
  useLayoutEffect(() => {
    if (activeThreadId) {
      setIsThreadReady(false);
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        setIsThreadReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeThreadId]);

  // Smooth scroll for new live messages
  useEffect(() => {
    if (!activeThread) return;
    const currentCount = activeThread.messages.length;

    if (isThreadReady && currentCount > prevMessagesCountRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
    prevMessagesCountRef.current = currentCount;
  }, [activeThread?.messages.length, isThreadReady]);

  const fetchCommunicationsAndUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [commsRes, profilesRes, ambRes] = await Promise.all([
        supabase.from('communications').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('email, name, full_name, role'),
        supabase.from('ambassador').select('email, recipient_identifier, phone'),
      ]);

      if (commsRes.error) throw commsRes.error;

      const profileMap: Record<string, { name: string; role: string }> = {};
      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => {
          if (p.email) {
            profileMap[p.email.toLowerCase()] = {
              name: p.full_name || p.name || '',
              role: (p.role || 'CUSTOMER').toUpperCase(),
            };
          }
        });
      }

      const ambassadorMap: Record<string, { identifier: string; phone?: string }> = {};
      if (ambRes.data) {
        ambRes.data.forEach((a: any) => {
          if (a.email) {
            ambassadorMap[a.email.toLowerCase()] = {
              identifier: a.recipient_identifier || '',
              phone: a.phone || '',
            };
          }
        });
      }

      if (commsRes.data) {
        const threadMap: { [key: string]: Thread } = {};

        commsRes.data.forEach((item: any) => {
          const isSenderAdmin = (item.sender_role || '').toLowerCase() === 'admin';
          const userEmail = (isSenderAdmin ? item.recipient_email : item.sender_email || '').toLowerCase();
          const threadId = item.channel_id || userEmail || 'general';

          const formattedTime = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          let displayName = userEmail;
          let userRole = 'GUEST';
          let userPhone = '';

          const profileData = profileMap[userEmail];
          const ambData = ambassadorMap[userEmail];

          if (profileData && profileData.name) {
            displayName = profileData.name;
            userRole = profileData.role;
          } else if (ambData) {
            displayName = ambData.identifier || displayName;
            userRole = 'INVITED AMBASSADOR';
            userPhone = ambData.phone || '';
          }

          if (ambData && ambData.phone) {
            userPhone = ambData.phone;
          }

          if (!threadMap[threadId]) {
            threadMap[threadId] = {
              id: threadId,
              userName: displayName,
              userEmail: userEmail,
              userPhone: userPhone,
              role: userRole,
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

        const updatedThreads = Object.values(threadMap);
        setThreads(updatedThreads);

        if (activeThreadId) {
          const currentThread = updatedThreads.find((t) => t.id === activeThreadId);
          if (currentThread && onSelectThread) {
            onSelectThread(currentThread.id, currentThread);
          }
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'FAILED TO LOAD COMMUNICATIONS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationsAndUsers();

    const channel = supabase
      .channel('public:communications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => {
        fetchCommunicationsAndUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredThreads = threads.filter((t) => {
    const matchesRole = roleFilter === 'ALL' || t.role.toLowerCase().includes(roleFilter.toLowerCase());
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
        fetchCommunicationsAndUsers();
      }
    } catch (err: any) {
      console.error('Send error:', err);
    }
  };

  // Header display logic: prevents duplicate email rendering
  const isNameSameAsEmail =
    !activeThread?.userName ||
    activeThread.userName.toLowerCase().trim() === activeThread.userEmail.toLowerCase().trim();

  const headerTitle = isNameSameAsEmail ? activeThread?.userEmail : activeThread?.userName;
  const headerSubtitle = isNameSameAsEmail
    ? activeThread?.userPhone || ''
    : `${activeThread?.userEmail}${activeThread?.userPhone ? ` • ${activeThread.userPhone}` : ''}`;

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
        <button onClick={fetchCommunicationsAndUsers} style={retryBtnStyle}>RETRY</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.3; }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .skeleton-bubble {
          animation: skeletonPulse 1.2s ease-in-out infinite;
        }
        .chat-fade-in-content {
          animation: chatFadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* FILTER BAR */}
      {isFilterOpen && !activeThreadId && (
        <div style={headerFilterBarStyle}>
          <span style={{ fontSize: '8px', color: '#666666', fontWeight: 600, letterSpacing: '2.5px' }}>
            FILTER BY ROLE
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'AMBASSADOR', 'INVITED', 'CUSTOMER', 'STAFF'].map((role) => (
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

      {/* VIEW 1: CONVERSATION LIST */}
      {!activeThreadId ? (
        <div style={listContainerStyle}>
          {filteredThreads.length === 0 ? (
            <div style={emptyTextStyle}>NO CONVERSATIONS FOUND</div>
          ) : (
            filteredThreads.map((thread) => {
              const initialLetter = thread.userName.charAt(0).toUpperCase();
              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  style={whatsappCardStyle}
                >
                  <div style={avatarStyle}>{initialLetter}</div>

                  <div style={cardContentStyle}>
                    <div style={threadHeaderRow}>
                      <span style={userNameStyle}>{thread.userName}</span>
                      <span style={timeStyle}>{thread.lastMessageTime}</span>
                    </div>

                    <div style={threadSubRow}>
                      <p style={previewMessageStyle}>{thread.lastMessage}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            ...roleBadgeStyle,
                            borderColor: thread.role.includes('INVITED') ? '#eab308' : 'rgba(255, 255, 255, 0.2)',
                            color: thread.role.includes('INVITED') ? '#eab308' : '#aaa',
                          }}
                        >
                          {thread.role}
                        </span>
                        {thread.unreadCount > 0 && <span style={unreadBadgeStyle}>{thread.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW 2: FULL CHAT VIEWPORT */
        <div style={chatScreenContainerStyle}>
          {/* HEADER (Sticky Top inside viewport) */}
          <div style={whatsappHeaderStyle}>
            <div style={headerAvatarStyle}>
              {headerTitle ? headerTitle.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={headerInfoStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={headerNameTitle}>{headerTitle}</span>
                <span
                  style={{
                    ...roleBadgeStyle,
                    borderColor: activeThread?.role.includes('INVITED') ? '#eab308' : 'rgba(255, 255, 255, 0.3)',
                    color: activeThread?.role.includes('INVITED') ? '#eab308' : '#ffffff',
                    fontSize: '8px',
                  }}
                >
                  {activeThread?.role}
                </span>
              </div>

              {headerSubtitle && <span style={headerSubtitleStyle}>{headerSubtitle}</span>}
            </div>
          </div>

          {/* CHAT MESSAGES FEED */}
          <div ref={chatContainerRef} style={chatFeedStyle}>
            {!isThreadReady ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 'auto', padding: '10px 0' }}>
                <div className="skeleton-bubble" style={{ ...skeletonStyle, alignSelf: 'flex-start', width: '55%', height: '38px' }} />
                <div className="skeleton-bubble" style={{ ...skeletonStyle, alignSelf: 'flex-end', width: '40%', height: '36px' }} />
                <div className="skeleton-bubble" style={{ ...skeletonStyle, alignSelf: 'flex-start', width: '65%', height: '44px' }} />
                <div className="skeleton-bubble" style={{ ...skeletonStyle, alignSelf: 'flex-end', width: '48%', height: '38px' }} />
              </div>
            ) : (
              <div className="chat-fade-in-content" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      <span style={msgTimeStyle}>{msg.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MESSAGE INPUT BAR */}
          <div style={chatInputAreaStyle}>
            <form onSubmit={handleSendMessage} style={chatInputFormStyle}>
              <textarea
                ref={textareaRef}
                style={textareaInputStyle}
                rows={1}
                placeholder="Type your response..."
                value={inputText}
                onFocus={() => {
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                  }, 150);
                }}
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

/* --- STYLES --- */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  backgroundColor: '#000000',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
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
  flexShrink: 0,
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
  overflowY: 'auto',
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
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '1px 5px',
  borderRadius: '2px',
  letterSpacing: '0.8px',
  flexShrink: 0,
};

const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#25D366',
  color: '#000000',
  fontSize: '9px',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: '10px',
  flexShrink: 0,
};

/* --- FULL VIEWPORT CHAT SCREEN STYLES --- */
const chatScreenContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  backgroundColor: '#000000',
  overflow: 'hidden',
};

const whatsappHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#0a0a0a',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  flexShrink: 0,
};

const headerAvatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 600,
  color: '#ffffff',
  flexShrink: 0,
};

const headerInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerNameTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#ffffff',
  letterSpacing: '0.5px',
};

const headerSubtitleStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888888',
  fontWeight: 300,
  marginTop: '1px',
};

const chatFeedStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  WebkitOverflowScrolling: 'touch',
};

const skeletonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '14px',
};

const msgTimeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#555555',
  marginTop: '3px',
};

const chatInputAreaStyle: React.CSSProperties = {
  padding: '10px 16px',
  paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  flexShrink: 0,
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '24px',
  padding: '2px 6px 2px 14px',
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
