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

const MOCK_THREADS: Thread[] = [
  {
    id: 'th-1',
    userName: 'SABBIR',
    userEmail: 'mdtohaali@zohomail.com',
    role: 'AMBASSADOR',
    status: 'ACTIVE',
    unreadCount: 1,
    lastMessage: 'তোহা',
    lastMessageTime: '08:46 AM',
    messages: [
      { id: 'm1', sender: 'USER', text: 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।', timestamp: '08:40 AM' },
      { id: 'm2', sender: 'USER', text: 'This for checking', timestamp: '08:42 AM' },
      { id: 'm3', sender: 'USER', text: 'তোহা', timestamp: '08:46 AM' },
      { id: 'm4', sender: 'ADMIN', text: 'Received. Your inquiry has been routed to NOMAD Desk.', timestamp: '08:46 AM' }
    ]
  },
  {
    id: 'th-2',
    userName: 'RAHIM AHMED',
    userEmail: 'rahim@nomad.link',
    role: 'CUSTOMER',
    status: 'PENDING',
    unreadCount: 0,
    lastMessage: 'When will my order ship?',
    lastMessageTime: 'Yesterday',
    messages: [
      { id: 'm5', sender: 'USER', text: 'When will my order ship?', timestamp: 'Yesterday 04:15 PM' }
    ]
  },
  {
    id: 'th-3',
    userName: 'ANIKA RAHMAN',
    userEmail: 'anika@nomad.com',
    role: 'STAFF',
    status: 'RESOLVED',
    unreadCount: 0,
    lastMessage: 'Product inventory updated.',
    lastMessageTime: '10 Sep',
    messages: [
      { id: 'm6', sender: 'USER', text: 'Product inventory updated.', timestamp: '10 Sep 11:00 AM' }
    ]
  }
];

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  isSearchOpen = false
}) => {
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('th-1');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'AMBASSADOR' | 'CUSTOMER' | 'STAFF'>('ALL');
  const [inputText, setInputText] = useState<string>('');

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const filteredThreads = threads.filter((t) => {
    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeThread) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'ADMIN',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            lastMessage: newMsg.text,
            lastMessageTime: newMsg.timestamp,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );

    setInputText('');
  };

  return (
    <div style={containerStyle}>
      {/* 1. LEFT COLUMN: INBOX LIST */}
      <div style={sidebarListStyle}>
        <div style={filterHeaderStyle}>
          <span style={sectionLabelStyle}>CONCIERGE INBOX</span>
          <div style={tabContainerStyle}>
            {(['ALL', 'AMBASSADOR', 'CUSTOMER', 'STAFF'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  ...filterTabStyle,
                  borderColor: roleFilter === role ? '#ffffff' : 'transparent',
                  color: roleFilter === role ? '#ffffff' : '#666666'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div style={threadListScrollStyle}>
          {filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                style={{
                  ...threadCardStyle,
                  backgroundColor: isActive ? '#111111' : '#050505',
                  borderColor: isActive ? '#333333' : '#141414'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={userNameStyle}>{thread.userName}</span>
                  <span style={timeStyle}>{thread.lastMessageTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={roleBadgeStyle}>{thread.role}</span>
                  {thread.unreadCount > 0 && <span style={badgeStyle}>{thread.unreadCount}</span>}
                </div>
                <p style={previewTextStyle}>{thread.lastMessage}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: CHAT CONVERSATION */}
      <div style={chatPanelStyle}>
        {activeThread ? (
          <>
            <div style={chatHeaderStyle}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1.5px' }}>
                  {activeThread.userName}
                </span>
                <span style={{ fontSize: '9px', color: '#666666', display: 'block', marginTop: '2px' }}>
                  {activeThread.userEmail}
                </span>
              </div>
              <span style={statusBadgeStyle}>{activeThread.status}</span>
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
                      marginBottom: '16px'
                    }}
                  >
                    <span style={senderTagStyle}>{isAdmin ? 'NOMAD DESK' : 'CLIENT'}</span>
                    <div
                      style={{
                        ...messageBubbleStyle,
                        backgroundColor: isAdmin ? '#1a1a1a' : '#0a0a0a',
                        borderColor: isAdmin ? '#333333' : '#1f1f1f',
                        color: isAdmin ? '#ffffff' : '#d1d1d1'
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '8px', color: '#555555', marginTop: '4px' }}>{msg.timestamp}</span>
                  </div>
                );
              })}
            </div>

            <div style={chatInputAreaStyle}>
              <input
                type="text"
                placeholder="Type response as NOMAD Concierge..."
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
          <div style={{ margin: 'auto', color: '#555555', fontSize: '11px' }}>NO THREAD SELECTED</div>
        )}
      </div>

      {/* 3. RIGHT COLUMN: USER CONTEXT PANEL */}
      {activeThread && (
        <div style={contextPanelStyle}>
          <span style={sectionLabelStyle}>CLIENT PROFILE</span>
          <div style={profileBoxStyle}>
            <div style={avatarStyle}>{activeThread.userName.charAt(0)}</div>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>{activeThread.userName}</span>
            <span style={{ fontSize: '9px', color: '#888888', marginTop: '2px' }}>{activeThread.userEmail}</span>
            <span style={{ ...roleBadgeStyle, marginTop: '8px' }}>{activeThread.role}</span>
          </div>

          <div style={{ marginTop: '24px' }}>
            <span style={sectionLabelStyle}>METRICS & ACCESS</span>
            <div style={metricRowStyle}>
              <span style={metricLabelStyle}>STATUS</span>
              <span style={{ fontSize: '10px', color: '#ffffff' }}>VERIFIED VIP</span>
            </div>
            <div style={metricRowStyle}>
              <span style={metricLabelStyle}>COMMISSION TIER</span>
              <span style={{ fontSize: '10px', color: '#ffffff' }}>5% BASELINE</span>
            </div>
            <div style={metricRowStyle}>
              <span style={metricLabelStyle}>DISCOUNT PASS</span>
              <span style={{ fontSize: '10px', color: '#ffffff' }}>3% ACTIVE</span>
            </div>
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
  width: '100%',
  height: '100vh',
  backgroundColor: '#030303',
  color: '#ffffff',
  fontFamily: 'monospace, sans-serif',
  boxSizing: 'border-box'
};

const sidebarListStyle: React.CSSProperties = {
  width: '320px',
  borderRight: '1px solid #141414',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#050505'
};

const filterHeaderStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #141414'
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#666666',
  letterSpacing: '2px',
  fontWeight: 'bold',
  display: 'block',
  marginBottom: '12px'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  overflowX: 'auto'
};

const filterTabStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid transparent',
  fontSize: '8px',
  letterSpacing: '1px',
  padding: '4px 2px',
  cursor: 'pointer'
};

const threadListScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px'
};

const threadCardStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '2px',
  border: '1px solid #141414',
  marginBottom: '6px',
  cursor: 'pointer'
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

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#888888',
  border: '1px solid #222222',
  padding: '1px 5px',
  borderRadius: '2px',
  letterSpacing: '1px'
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontSize: '8px',
  fontWeight: 800,
  padding: '1px 5px',
  borderRadius: '10px'
};

const previewTextStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888888',
  marginTop: '8px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  margin: '8px 0 0 0'
};

const chatPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #141414',
  backgroundColor: '#030303'
};

const chatHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #141414',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const statusBadgeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#00ff66',
  border: '1px solid #00ff6633',
  padding: '2px 6px',
  borderRadius: '2px',
  letterSpacing: '1px'
};

const messageFeedStyle: React.CSSProperties = {
  flex: 1,
  padding: '20px',
  overflowY: 'auto'
};

const senderTagStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#666666',
  letterSpacing: '1.5px',
  marginBottom: '3px'
};

const messageBubbleStyle: React.CSSProperties = {
  maxWidth: '70%',
  padding: '10px 14px',
  fontSize: '11px',
  borderRadius: '2px',
  border: '1px solid',
  lineHeight: '1.5'
};

const chatInputAreaStyle: React.CSSProperties = {
  padding: '16px',
  borderTop: '1px solid #141414',
  display: 'flex',
  gap: '10px'
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#0a0a0a',
  border: '1px solid #1f1f1f',
  color: '#ffffff',
  padding: '10px 14px',
  fontSize: '11px',
  outline: 'none',
  fontFamily: 'monospace'
};

const sendBtnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  padding: '0 20px',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '1px',
  cursor: 'pointer'
};

const contextPanelStyle: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#050505',
  padding: '20px'
};

const profileBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 0',
  borderBottom: '1px solid #141414'
};

const avatarStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#1a1a1a',
  border: '1px solid #333333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 800,
  marginBottom: '10px'
};

const metricRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #101010'
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#666666'
};
