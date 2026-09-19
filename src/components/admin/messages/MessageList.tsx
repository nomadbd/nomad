import React from 'react';
import * as styles from './AdminMessages.styles';

interface MessageListProps {
  activeThread: any;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  getDateLabel: (dateInput?: string | number | Date) => string;
}

export const MessageList: React.FC<MessageListProps> = ({
  activeThread,
  chatContainerRef,
  getDateLabel,
}) => {
  let lastRenderedDate: string | null = null;

  return (
    <div ref={chatContainerRef} style={styles.chatFeedStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeThread?.messages.map((msg: any) => {
          const isAdmin = msg.sender === 'ADMIN';
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
                  {displayTime}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
