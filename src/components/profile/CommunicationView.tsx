import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { BackIcon } from '../icons';

interface CommunicationViewProps {
  userId: string;
  onBack: () => void;
}

interface CommunicationMessage {
  id: string;
  sender: 'authority' | 'ambassador' | string;
  message: string;
  created_at: string;
  is_read?: boolean;
}

function MessagesSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          style={{
            background: '#121212',
            border: '1px solid #27272A',
            borderRadius: '12px',
            padding: '14px 16px',
            opacity: 0.35,
            width: item % 2 === 0 ? '75%' : '60%',
            alignSelf: item % 2 === 0 ? 'flex-end' : 'flex-start',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}
        >
          <div style={{ height: '14px', background: '#333', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div style={{ height: '10px', width: '40%', background: '#333', borderRadius: '4px' }}></div>
        </div>
      ))}
    </div>
  );
}

export default function CommunicationView({ userId, onBack }: CommunicationViewProps) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('communication')
        .select('*')
        .or(`user_id.eq.${userId},ambassador_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching communication messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        user_id: userId,
        ambassador_id: userId,
        sender: 'ambassador',
        message: messageText,
        is_read: false
      };

      const { data, error } = await supabase
        .from('communication')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#000000', 
      color: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* ১. ফিক্সড প্রিমিয়াম হেডার (NotificationsView-এর অনুরুপ) */}
      <div style={{ 
        flexShrink: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px 14px',
        borderBottom: '1px solid #18181B',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              background: '#121212',
              border: '1px solid #27272A',
              color: '#FFF',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Back"
          >
            <BackIcon width={18} height={18} stroke="#FFFFFF" />
          </button>

          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.2px', color: '#FFFFFF' }}>
            Messages
          </h2>
        </div>

        <span style={{
          fontSize: '11px',
          padding: '5px 12px',
          borderRadius: '20px',
          backgroundColor: '#121212',
          border: '1px solid #27272A',
          color: '#A1A1AA',
          fontWeight: '500',
          letterSpacing: '0.3px'
        }}>
          Ambassador Support
        </span>
      </div>

      {/* ২. চ্যাট ফিড সেকশন */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px', 
            textAlign: 'center',
            margin: 'auto 0'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#121212',
              border: '1px solid #27272A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#FFFFFF', fontWeight: '500', letterSpacing: '0.2px' }}>
              No Messages Yet
            </h3>

            <p style={{ margin: 0, fontSize: '12px', color: '#71717A', maxWidth: '270px', lineHeight: '1.5' }}>
              Send a query to Nomad Authority or wait for official notices and updates.
            </p>
          </div>
        ) : (
          messages.map((item) => {
            const isAmbassador = item.sender === 'ambassador';
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAmbassador ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  color: '#52525B',
                  marginBottom: '4px',
                  fontWeight: '500',
                  paddingLeft: isAmbassador ? '0' : '4px',
                  paddingRight: isAmbassador ? '4px' : '0'
                }}>
                  {isAmbassador ? 'You' : 'Nomad Authority'}
                </span>

                <div style={{
                  maxWidth: '82%',
                  padding: '12px 16px',
                  borderRadius: isAmbassador ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isAmbassador ? '#121212' : '#09090B',
                  border: '1px solid',
                  borderColor: isAmbassador ? 'rgba(255, 255, 255, 0.2)' : '#27272A',
                  color: isAmbassador ? '#FFFFFF' : '#E4E4E7',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-line'
                }}>
                  {item.message}
                </div>

                <span style={{
                  fontSize: '9px',
                  color: '#71717A',
                  marginTop: '4px',
                  paddingLeft: isAmbassador ? '0' : '4px',
                  paddingRight: isAmbassador ? '4px' : '0'
                }}>
                  {formatTime(item.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ৩. ফিক্সড বটম ইনপুট বার */}
      <form
        onSubmit={handleSendMessage}
        style={{
          flexShrink: 0,
          padding: '12px 14px 20px 14px',
          borderTop: '1px solid #18181B',
          backgroundColor: 'rgba(9, 9, 11, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message Authority..."
          style={{
            flex: 1,
            backgroundColor: '#121212',
            border: '1px solid #27272A',
            borderRadius: '24px',
            padding: '12px 18px',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: inputText.trim() && !sending ? '#FFFFFF' : '#121212',
            color: inputText.trim() && !sending ? '#000000' : '#52525B',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !sending ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            outline: 'none'
          }}
        >
          {sending ? (
            <span style={{ fontSize: '11px', fontWeight: '600' }}>...</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
