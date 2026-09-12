import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

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
  role: 'AMBASSADOR' | 'CUSTOMER' | 'STAFF';
  status: 'ACTIVE' | 'RESOLVED' | 'PENDING';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  isSearchOpen = false
}) => {
  // কোনো মক ডাটা ছাড়াই ফাঁকা স্টেট
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'AMBASSADOR' | 'CUSTOMER' | 'STAFF'>('ALL');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Supabase থেকে সরাসরি ডাটা ফেচ
  const fetchMessagesAndThreads = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const threadMap: { [key: string]: Thread } = {};

        data.forEach((item: any) => {
          const threadId = item.thread_id || item.user_id || item.user_email;
          const formattedTime = new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          if (!threadMap[threadId]) {
            threadMap[threadId] = {
              id: threadId,
              userName: item.user_name || 'USER',
              userEmail: item.user_email || '',
              role: item.user_role || 'CUSTOMER',
              status: item.status || 'ACTIVE',
              unreadCount: 0,
              lastMessage: item.text || item.message,
              lastMessageTime: formattedTime,
              messages: []
            };
          }

          threadMap[threadId].messages.push({
            id: item.id,
            sender: item.sender,
            text: item.text || item.message,
            timestamp: formattedTime
          });

          threadMap[threadId].lastMessage = item.text || item.message;
          threadMap[threadId].lastMessageTime = formattedTime;
        });

        const threadList = Object.values(threadMap);
        setThreads(threadList);

        if (threadList.length > 0 && !activeThreadId) {
          setActiveThreadId(threadList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Database fetch error:', err);
      setErrorMsg(err.message || 'ডাটাবেজ থেকে মেসেজ লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndThreads();

    // Supabase Realtime Channel
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessagesAndThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const filteredThreads = threads.filter((t) => {
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.userName.toLowerCase().includes(query) ||
      t.userEmail.toLowerCase().includes(query) ||
      t.lastMessage.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  // Supabase-এ মেসেজ ইনসার্ট করা
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeThread) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert([
        {
          thread_id: activeThread.id,
          user_email: activeThread.userEmail,
          user_name: activeThread.userName,
          user_role: activeThread.role,
          sender: 'ADMIN',
          text: messageText,
          status: 'ACTIVE'
        }
      ]);

      if (error) {
        alert(`মেসেজ পাঠানো সম্ভব হয়নি: ${error.message}`);
      } else {
        await fetchMessagesAndThreads();
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
        <span>CONNECTING TO SUPABASE DATABASE...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ ...statusContainerStyle, color: '#ff4444' }}>
        <span>DATABASE ERROR: {errorMsg}</span>
        <button onClick={fetchMessagesAndThreads} style={retryBtnStyle}>RETRY</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* HEADER FILTER DRAWER */}
      {isFilterOpen && (
        <div style={headerFilterBarStyle}>
          <span style={{ fontSize: '9px', color: '#888', fontWeight: 'bold', letterSpacing: '1px' }}>
            FILTER BY ROLE:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'AMBASSADOR', 'CUSTOMER', 'STAFF'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...filterChipStyle,
                  backgroundColor: roleFilter === role ? '#ffffff' : '#111111',
                  color: roleFilter === role ? '#000000' : '#888888',
                  borderColor: roleFilter === role ? '#ffffff' : '#222222'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={mainContentStyle}>
        {/* 1. THREAD LIST */}
        {(!isMobile || showListOnMobile) && (
          <div style={{ ...threadListColumnStyle, width: isMobile ? '100%' : '320px' }}>
            <div style={listHeaderStyle}>
              <span style={sectionTitleStyle}>INBOX ({filteredThreads.length})</span>
            </div>

            <div style={scrollListStyle}>
              {filteredThreads.length === 0 ? (
                <div style={emptyTextStyle}>NO MESSAGES IN DATABASE</div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      style={{
                        ...threadCardStyle,
                        backgroundColor: isActive ? '#141414' : '#080808',
                        borderColor: isActive ? '#333333' : '#141414'
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

        {/* 2. CHAT PANEL */}
        {(!isMobile || showChatOnMobile) && (
          <div style={chatPanelStyle}>
            {activeThread ? (
              <>
                <div style={chatHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isMobile && (
                      <button onClick={() => setActiveThreadId(null)} style={backBtnStyle}>
                        ← BACK
                      </button>
                    )}
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px' }}>
                        {activeThread.userName}
                      </span>
                      <span style={{ fontSize: '9px', color: '#666666', display: 'block', marginTop: '1px' }}>
                        {activeThread.userEmail} • <span style={{ color: '#aaa' }}>{activeThread.role}</span>
                      </span>
                    </div>
                  </div>
                  <span style={statusTagStyle}>{activeThread.status}</span>
                </div>

                <div style={messageFeedStyle}>
                  {activeThread.messages.map((msg) => {
                    const isAdmin = msg.sender === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAdmin ? 'flex-end' : 'flex-start',
                          marginBottom: '14px'
                        }}
                      >
                        <span style={senderTagStyle}>{isAdmin ? 'NOMAD DESK' : activeThread.userName}</span>
                        <div
                          style={{
                            ...bubbleStyle,
                            backgroundColor: isAdmin ? '#1e1e1e' : '#0d0d0d',
                            borderColor: isAdmin ? '#333333' : '#1a1a1a',
                            color: isAdmin ? '#ffffff' : '#d1d1d1'
                          }}
                        >
                          {msg.text}
                        </div>
                        <span style={msgTimeStyle}>{msg.timestamp}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={chatInputAreaStyle}>
                  <input
                    type="text"
                    placeholder="Type response..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={inputStyle}
                  />
                  <button onClick={handleSendMessage} style={sendBtnStyle}>
                    SEND
                  </button>
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

/* --- STYLES --- */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: 'calc(100vh - 60px)',
  backgroundColor: '#030303',
  color: '#ffffff',
  fontFamily: 'monospace, sans-serif',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '80vh',
  color: '#888888',
  fontSize: '11px',
  fontFamily: 'monospace',
  letterSpacing: '1px',
  gap: '12px'
};

const retryBtnStyle: React.CSSProperties = {
  backgroundColor: '#111',
  border: '1px solid #333',
  color: '#fff',
  padding: '6px 16px',
  fontSize: '10px',
  cursor: 'pointer'
};

const headerFilterBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  backgroundColor: '#0a0a0a',
  borderBottom: '1px solid #1a1a1a',
  flexWrap: 'wrap',
  gap: '10px'
};

const filterChipStyle: React.CSSProperties = {
  border: '1px solid',
  padding: '4px 10px',
  fontSize: '9px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  cursor: 'pointer',
  borderRadius: '2px'
};

const mainContentStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  width: '100%',
  height: '100%',
  overflow: 'hidden'
};

const threadListColumnStyle: React.CSSProperties = {
  borderRight: '1px solid #141414',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#050505',
  flexShrink: 0
};

const listHeaderStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #141414'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666666',
  letterSpacing: '2px',
  fontWeight: 'bold'
};

const scrollListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px'
};

const emptyTextStyle: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
  color: '#555555',
  fontSize: '10px',
  letterSpacing: '1px'
};

const threadCardStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '2px',
  border: '1px solid',
  marginBottom: '6px',
  cursor: 'pointer'
};

const threadHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px'
};

const userNameStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1px'
};

const timeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#666666'
};

const threadSubRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#888888',
  border: '1px solid #222222',
  padding: '1px 5px',
  borderRadius: '2px',
  letterSpacing: '1px'
};

const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontSize: '8px',
  fontWeight: 800,
  padding: '1px 5px',
  borderRadius: '10px'
};

const previewMessageStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888888',
  margin: '8px 0 0 0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const chatPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#030303',
  height: '100%'
};

const chatHeaderStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #141414',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#050505'
};

const backBtnStyle: React.CSSProperties = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  color: '#ffffff',
  padding: '4px 8px',
  fontSize: '9px',
  fontWeight: 'bold',
  cursor: 'pointer',
  borderRadius: '2px'
};

const statusTagStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#00ff66',
  border: '1px solid #00ff6633',
  padding: '2px 6px',
  borderRadius: '2px',
  letterSpacing: '1px'
};

const messageFeedStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  overflowY: 'auto'
};

const senderTagStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#555555',
  letterSpacing: '1px',
  marginBottom: '3px'
};

const bubbleStyle: React.CSSProperties = {
  maxWidth: '80%',
  padding: '10px 14px',
  fontSize: '11px',
  borderRadius: '2px',
  border: '1px solid',
  lineHeight: '1.4',
  wordBreak: 'break-word'
};

const msgTimeStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#444444',
  marginTop: '4px'
};

const chatInputAreaStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid #141414',
  display: 'flex',
  gap: '8px',
  backgroundColor: '#050505'
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0a0a0a',
  border: '1px solid #1f1f1f',
  color: '#ffffff',
  padding: '10px 12px',
  fontSize: '11px',
  outline: 'none',
  fontFamily: 'monospace'
};

const sendBtnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  padding: '0 16px',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '1px',
  cursor: 'pointer',
  borderRadius: '2px'
};

const noSelectStyle: React.CSSProperties = {
  margin: 'auto',
  color: '#444444',
  fontSize: '10px',
  letterSpacing: '1.5px'
};
