import React, { useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon, SendIcon } from '@/components/icons';
import { CommunicationMessage, AmbassadorInviteData } from '@/types/ambassador';
import {
  modalBackdropStyle,
  bottomSheetBoxStyle,
  modalHeaderStyle,
  underlineInputStyle,
  chatInputFormStyle
} from './styles';

interface ConciergeModalProps {
  inviteData: AmbassadorInviteData;
  email: string;
  defaultEmail: string;
  customSupportEmail: string;
  setCustomSupportEmail: (email: string) => void;
  viewportStyle: React.CSSProperties;
  isModalAnimating: boolean;
  messages: CommunicationMessage[];
  setMessages: React.Dispatch<React.SetStateAction<CommunicationMessage[]>>;
  isLoadingMessages: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: (smooth?: boolean) => void;
  onClose: () => void;
}

export const ConciergeModal: React.FC<ConciergeModalProps> = ({
  inviteData,
  email,
  defaultEmail,
  customSupportEmail,
  setCustomSupportEmail,
  viewportStyle,
  isModalAnimating,
  messages,
  setMessages,
  isLoadingMessages,
  chatContainerRef,
  scrollToBottom,
  onClose
}) => {
  const [supportMsg, setSupportMsg] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendSupportMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supportMsg.trim() || isSendingSupport) return;

    setIsSendingSupport(true);
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const currentText = supportMsg.trim();

    try {
      const newMessagePayload = {
        channel_type: 'ambassador',
        channel_id: inviteData?.token || activeEmail || 'general_inquiry',
        sender_email: activeEmail,
        sender_role: 'ambassador',
        message: currentText,
      };

      const { data, error } = await supabase
        .from('communications')
        .insert([newMessagePayload])
        .select();

      if (!error) {
        setSupportMsg('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        const userMsg = (data && data.length > 0)
          ? data[0]
          : { id: 'user-' + Date.now(), sender_role: 'ambassador', message: currentText };

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === userMsg.id);
          return exists ? prev : [...prev, userMsg];
        });
        scrollToBottom(false);
      }
    } catch (err) {
      console.error('Support message submission failed', err);
    } finally {
      setIsSendingSupport(false);
    }
  };

  return (
    <div
      style={{
        ...modalBackdropStyle,
        opacity: isModalAnimating ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...bottomSheetBoxStyle,
          height: viewportStyle.height ? viewportStyle.height : '100%',
          maxHeight: '100vh',
          borderRadius: viewportStyle.height ? '16px 16px 0 0' : '0',
          transform: isModalAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>PRIVATE DESK</span>
            <h3 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 300, color: '#ffffff', margin: 0 }}>NOMAD CONCIERGE</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
          >
            <CloseIcon />
          </button>
        </div>

        {!(email || defaultEmail) && (
          <div style={{ padding: '8px 16px', flexShrink: 0 }}>
            <input
              type="text"
              inputMode="email"
              style={underlineInputStyle}
              placeholder="Your Return Email Address"
              value={customSupportEmail}
              onChange={(e) => setCustomSupportEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div
          ref={chatContainerRef}
          style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column' }}
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
                return (
                  <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
                    <span style={{ fontSize: '8px', color: '#666666', letterSpacing: '1px', marginBottom: '3px' }}>
                      {isAdmin ? 'NOMAD DESK' : 'YOU'}
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
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '0 16px 16px 16px', flexShrink: 0 }}>
          <form onSubmit={handleSendSupportMessage} style={chatInputFormStyle}>
            <textarea
              ref={textareaRef}
              style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', fontWeight: 300, outline: 'none', resize: 'none', maxHeight: '80px', lineHeight: '1.4', padding: '8px 0' }}
              rows={1}
              placeholder="Type your message..."
              value={supportMsg}
              onFocus={() => setTimeout(() => scrollToBottom(false), 150)}
              onClick={() => setTimeout(() => scrollToBottom(false), 150)}
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
