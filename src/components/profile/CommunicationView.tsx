import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';

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

export default function CommunicationView({ userId, onBack }: CommunicationViewProps) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ১. কমিউনিকেশন মেসেজগুলো ফেচ করা
  useEffect(() => {
    fetchMessages();
  }, [userId]);

  // নতুন মেসেজ আসলে নিচে অটো-স্ক্রল করা
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!userId) return;
    setLoading(true);

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

  // ২. কর্তৃপক্ষের কাছে মেসেজ পাঠানো
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
      setInputText(messageText); // ব্যর্থ হলে মেসেজ ইনপুটে ফেরত নিয়ে আসা
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#09090B',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* টপ ব্যাক বার (অথরিটি হেডার) */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #18181B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        backgroundColor: '#09090B',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ←
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', letterSpacing: '0.3px' }}>
              Nomad Authority Hub
            </h2>
            <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Direct Verified Channel
            </span>
          </div>
        </div>

        <span style={{
          fontSize: '10px',
          padding: '3px 8px',
          backgroundColor: '#141416',
          border: '1px solid #27272A',
          borderRadius: '20px',
          color: '#A1A1AA',
          fontWeight: '500'
        }}>
          Ambassador Support
        </span>
      </div>

      {/* চ্যাট ফিড / থ্রেড */}
      <div style={{
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <p style={{ fontSize: '13px', color: '#71717A', textAlign: 'center', marginTop: '40px' }}>
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#71717A' }}>
            <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#E4E4E7' }}>No messages yet</p>
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              Send a query to Nomad Authority or wait for official notices and updates.
            </span>
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
                  alignItems: isAmbassador ? 'flex-end' : 'flex-start'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  color: '#52525B',
                  marginBottom: '4px',
                  paddingLeft: isAmbassador ? '0' : '4px',
                  paddingRight: isAmbassador ? '4px' : '0'
                }}>
                  {isAmbassador ? 'You' : 'Nomad Authority'}
                </span>

                <div style={{
                  maxWidth: '82%',
                  padding: '12px 16px',
                  borderRadius: isAmbassador ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isAmbassador ? '#18181B' : '#0F0F0F',
                  border: isAmbassador ? '1px solid #27272A' : '1px solid #1F1F23',
                  color: isAmbassador ? '#FFFFFF' : '#D4D4D8',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  wordBreak: 'break-word'
                }}>
                  {item.message}
                </div>

                <span style={{
                  fontSize: '9px',
                  color: '#3F3F46',
                  marginTop: '4px',
                  paddingLeft: isAmbassador ? '0' : '4px',
                  paddingRight: isAmbassador ? '4px' : '0'
                }}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* স্টিকি বটম ইনপুট বার */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '12px 16px 20px 16px',
          borderTop: '1px solid #18181B',
          backgroundColor: '#09090B',
          position: 'sticky',
          bottom: 0,
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
            backgroundColor: '#0F0F0F',
            border: '1px solid #27272A',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          style={{
            backgroundColor: inputText.trim() && !sending ? '#FFFFFF' : '#18181B',
            color: inputText.trim() && !sending ? '#000000' : '#52525B',
            border: '1px solid #27272A',
            borderRadius: '12px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: inputText.trim() && !sending ? 'pointer' : 'default',
            transition: 'all 0.2s'
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
