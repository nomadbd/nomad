import React, { useState } from 'react';
import * as styles from './AdminMessages.styles';

interface MessageListProps {
  activeThread: any;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  getDateLabel: (dateInput?: string | number | Date) => string;
  currentUserEmail?: string; // কারেন্ট লগইন ইউজারের ইমেইল
}

export const MessageList: React.FC<MessageListProps> = ({
  activeThread,
  chatContainerRef,
  getDateLabel,
  currentUserEmail,
}) => {
  let lastRenderedDate: string | null = null;
  const isGroupChat = activeThread?.id === 'all_staff';
  const [activeSeenTooltip, setActiveSeenTooltip] = useState<string | null>(null);

  return (
    <div ref={chatContainerRef} style={styles.chatFeedStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeThread?.messages?.map((msg: any) => {
          // কারেন্ট ইউজারের নিজের পাঠানো মেসেজ কি না তা চেক করা
          const senderEmail = msg.senderEmail || msg.sender_email || msg.sender;
          const isMe = currentUserEmail 
            ? senderEmail === currentUserEmail 
            : msg.sender === 'ADMIN'; // ফলব্যাক

          const rawDate =
            msg.createdAt ||
            msg.created_at ||
            msg.date ||
            activeThread?.lastMessageTime ||
            msg.timestamp;

          const currentDateLabel = getDateLabel(rawDate);
          let showDateDivider = false;
          if (currentDateLabel && currentDateLabel !== lastRenderedDate) {
            showDateDivider = true;
            lastRenderedDate = currentDateLabel;
          }

          const displayTime = (() => {
            if (
              typeof msg.timestamp === 'string' &&
              (msg.timestamp.includes('AM') || msg.timestamp.includes('PM') || msg.timestamp.includes(':'))
            ) {
              return msg.timestamp;
            }
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            return msg.timestamp || '';
          })();

          const senderName = msg.senderName || msg.sender_name || (isMe ? 'You' : activeThread?.userName || 'Staff');
          const senderDesignation = msg.senderDesignation || msg.sender_designation || '';

          const readByList: Array<{ user_email: string; user_name?: string; seen_at?: string }> = 
            Array.isArray(msg.read_by) ? msg.read_by : (Array.isArray(msg.readBy) ? msg.readBy : []);
          
          const seenCount = readByList.length;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 6px 0' }}>
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

              {/* alignment: isMe সত্য হলে ডানে, মিথ্যা (অন্য কেউ হলে) বামে */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  position: 'relative',
                }}
              >
                {/* গ্রুপ চ্যাট হলে মেসেজের ওপর নাম ও পদবী */}
                {isGroupChat && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      marginBottom: '3px',
                      padding: '0 4px',
                    }}
                  >
                    {senderName && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.2px' }}>
                        {senderName}
                      </span>
                    )}
                    {senderDesignation && (
                      <span style={{ fontSize: '10px', fontWeight: '500', color: '#d4d4d8' }}>
                        • {senderDesignation}
                      </span>
                    )}
                  </div>
                )}

                {/* মূল মেসেজ বাবল */}
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    fontWeight: 300,
                    backgroundColor: isMe ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    border: isMe ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </div>

                {/* সময় ও সিন স্ট্যাটাস */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', padding: '0 2px' }}>
                  <span style={{ fontSize: '10.5px', color: '#aaaaaa', fontWeight: 400 }}>
                    {displayTime}
                  </span>

                  {/* গ্রুপ চ্যাটে Seen Status */}
                  {isGroupChat && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span
                        onClick={() => setActiveSeenTooltip(activeSeenTooltip === msg.id ? null : msg.id)}
                        style={{
                          fontSize: '10px',
                          color: seenCount > 0 ? '#818cf8' : '#666666',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        • {seenCount > 0 ? `Seen by ${seenCount}` : 'Unseen'}
                      </span>

                      {/* Tooltip Pop-up */}
                      {activeSeenTooltip === msg.id && seenCount > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '18px',
                            right: isMe ? 0 : 'auto',
                            left: isMe ? 'auto' : 0,
                            backgroundColor: '#18181b',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '160px',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          }}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                            SEEN BY
                          </div>
                          {readByList.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '10px', color: '#ccc', marginBottom: '3px' }}>
                              <span style={{ color: '#fff', fontWeight: 500 }}>{item.user_name || item.user_email}</span>
                              <span style={{ color: '#888', fontSize: '9px' }}>
                                {item.seen_at ? new Date(item.seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
