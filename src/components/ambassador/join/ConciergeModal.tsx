import React, { RefObject } from 'react';
import { CloseIcon, SendIcon } from '@/components/icons';
import { ChatMessage } from './types';

interface ConciergeModalProps {
  isConciergeOpen: boolean;
  isModalAnimating: boolean;
  viewportStyle: React.CSSProperties;
  handleCloseConcierge: () => void;
  email: string;
  defaultEmail: string;
  customSupportEmail: string;
  setCustomSupportEmail: (val: string) => void;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  isLoadingMessages: boolean;
  messages: ChatMessage[];
  supportMsg: string;
  setSupportMsg: (val: string) => void;
  handleSendSupportMessage: (e?: React.FormEvent) => void;
  isSendingSupport: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}

// তারিখ 'TODAY', 'YESTERDAY' অথবা '12 SEP 2026' ফরম্যাট করার হেলপার
const getDateLabel = (dateString?: string) => {
  if (!dateString) return null;
  
  const msgDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(msgDate, today)) return 'TODAY';
  if (isSameDay(msgDate, yesterday)) return 'YESTERDAY';

  return msgDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
};

// সময় (যেমন: 11:50 AM) ফরম্যাট করার হেলপার
const formatTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};

export const ConciergeModal: React.FC<ConciergeModalProps> = ({
  isConciergeOpen,
  isModalAnimating,
  viewportStyle,
  handleCloseConcierge,
  chatContainerRef,
  textareaRef,
  isLoadingMessages,
  messages,
  supportMsg,
  setSupportMsg,
  handleSendSupportMessage,
  isSendingSupport,
  scrollToBottom
}) => {
  if (!isConciergeOpen) return null;

  return (
    <div 
      style={{
        ...modalBackdropStyle,
        top: viewportStyle.top ? viewportStyle.top : 0,
        height: viewportStyle.height ? viewportStyle.height : '100vh',
        opacity: isModalAnimating ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={handleCloseConcierge}
    >
      <div 
        style={{
          ...bottomSheetBoxStyle,
          height: '100%',
          transform: isModalAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED APP HEADER */}
        <div style={modalHeaderStyle}>
          <div>
            <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>PRIVATE DESK</span>
            <h3 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 300, color: '#ffffff', margin: 0 }}>NOMAD CONCIERGE</h3>
          </div>
          <button 
            type="button" 
            onClick={handleCloseConcierge} 
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* SCROLLABLE CHAT FEED */}
        <div 
          ref={chatContainerRef}
          style={chatScrollAreaStyle}
        >
          {isLoadingMessages ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              <div style={{ alignSelf: 'flex-start', width: '60%', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px 12px 12px 2px' }} />
              <div style={{ alignSelf: 'flex-end', width: '75%', height: '48px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px 12px 2px 12px' }} />
              <div style={{ alignSelf: 'flex-start', width: '50%', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px 12px 12px 2px' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto', fontSize: '11px', color: '#666', textAlign: 'center', fontWeight: 300, letterSpacing: '0.5px' }}>
              Direct communication line with NOMAD administration. Type below to start.
            </div>
          ) : (
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg, index) => {
                const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'support';
                
                const msgTimestamp = (msg as any).created_at || (msg as any).timestamp;
                const currentDateLabel = getDateLabel(msgTimestamp);
                const timeLabel = formatTime(msgTimestamp);
                
                const prevMsg = messages[index - 1];
                const prevTimestamp = prevMsg ? ((prevMsg as any).created_at || (prevMsg as any).timestamp) : null;
                const prevDateLabel = getDateLabel(prevTimestamp);

                const showDateDivider = currentDateLabel && currentDateLabel !== prevDateLabel;

                return (
                  <React.Fragment key={msg.id || index}>
                    {showDateDivider && (
                      <div style={dateDividerWrapperStyle}>
                        <span style={dateDividerTextStyle}>{currentDateLabel}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
                      {/* SENDER LABEL & TIME */}
                      <span style={{ fontSize: '8px', color: '#666666', letterSpacing: '1px', marginBottom: '3px' }}>
                        {isAdmin ? 'NOMAD DESK' : 'YOU'}{timeLabel ? ` • ${timeLabel}` : ''}
                      </span>
                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        fontWeight: 300,
                        backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        borderRadius: isAdmin ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                        border: isAdmin ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.18)',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* INPUT FOOTER */}
        <div style={{ padding: '0 16px 16px 16px', flexShrink: 0 }}>
          <form onSubmit={handleSendSupportMessage} style={chatInputFormStyle}>
            <textarea
              ref={textareaRef}
              style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', fontWeight: 300, outline: 'none', resize: 'none', maxHeight: '80px', lineHeight: '1.4', padding: '8px 0' }}
              rows={1}
              placeholder="Type your message..."
              value={supportMsg}
              onFocus={() => setTimeout(() => scrollToBottom(false), 100)}
              onClick={() => setTimeout(() => scrollToBottom(false), 100)}
              onChange={(e) => {
                setSupportMsg(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
              }}
              required
            />

            <button 
              type="submit" 
              disabled={isSendingSupport || !supportMsg.trim()} 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: (isSendingSupport || !supportMsg.trim()) ? 0.25 : 1,
                backgroundColor: supportMsg.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                color: supportMsg.trim() ? '#000000' : '#ffffff',
                cursor: (isSendingSupport || !supportMsg.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.88)',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden'
};

const bottomSheetBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '430px',
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '16px 16px 0 0',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px 12px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: '#0a0a0a',
  zIndex: 20,
  flexShrink: 0,
  width: '100%',
  boxSizing: 'border-box'
};

const chatScrollAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column'
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
  boxSizing: 'border-box'
};

const dateDividerWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '16px 0 8px 0'
};

const dateDividerTextStyle: React.CSSProperties = {
  fontSize: '9px',
  letterSpacing: '1.5px',
  color: 'rgba(255, 255, 255, 0.4)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '3px 10px',
  borderRadius: '12px',
  fontWeight: 400
};
