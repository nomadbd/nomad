import React, { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { BackIcon } from '../icons';

interface CommunicationViewProps {
  userId: string;
  userEmail?: string;
  onBack: () => void;
}

interface CommunicationMessage {
  id: string;
  channel_type: string;
  channel_id: string;
  sender_email?: string;
  sender_role: string;
  recipient_email?: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

export default function CommunicationView({ userId, userEmail, onBack }: CommunicationViewProps) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [viewportHeight, setViewportHeight] = useState<string>('100vh');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  const registerTimeout = (fn: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timerId);
      fn();
    }, delay);
    timeoutsRef.current.push(timerId);
    return timerId;
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const jumpToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
        window.scrollTo(0, 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  const unreadMessageCount = useMemo(() => {
    return messages.filter((m) => m.sender_role !== 'ambassador' && !m.is_read).length;
  }, [messages]);

  const markUnreadAsRead = useCallback(async (msgList: CommunicationMessage[]) => {
    const unreadIds = msgList
      .filter((m) => m.sender_role !== 'ambassador' && !m.is_read)
      .map((m) => m.id);

    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('communications')
        .update({ is_read: true })
        .in('id', unreadIds);

      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m))
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .or(`channel_id.eq.${userId}${userEmail ? `,sender_email.eq.${userEmail},recipient_email.eq.${userEmail}` : ''}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const fetchedMessages = data || [];
      setMessages(fetchedMessages);

      registerTimeout(() => {
        markUnreadAsRead(fetchedMessages);
      }, 1000);
    } catch (err) {
      console.error('Error fetching communication messages:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail, markUnreadAsRead]);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    const chatChannel = supabase
      .channel(`user_communication_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
          filter: `channel_id=eq.${userId}`
        },
        (payload) => {
          const newMsg = payload.new as CommunicationMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_role !== 'ambassador') {
            registerTimeout(async () => {
              try {
                await supabase
                  .from('communications')
                  .update({ is_read: true })
                  .eq('id', newMsg.id);

                setMessages((prev) =>
                  prev.map((m) => (m.id === newMsg.id ? { ...m, is_read: true } : m))
                );
              } catch (err) {
                console.error('Failed to mark incoming message as read:', err);
              }
            }, 1200);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [userId, fetchMessages]);

  useLayoutEffect(() => {
    if (!loading) {
      jumpToBottom();
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        channel_type: 'ambassador',
        channel_id: userId,
        sender_email: userEmail || '',
        sender_role: 'ambassador',
        recipient_email: '',
        message: messageText,
        is_read: false
      };

      const { data, error } = await supabase
        .from('communications')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleInputFocus = () => {
    registerTimeout(() => {
      window.scrollTo(0, 0);
      jumpToBottom();
    }, 100);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateLabel = (dateInput?: string) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  let lastRenderedDate: string | null = null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: viewportHeight,
      width: '100vw',
      maxWidth: '600px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: loading ? 'transparent' : '#000000',
      color: '#FFFFFF',
      overflow: 'hidden',
      // Keep this view below the App-level skeleton overlay; its header remains
      // visible because that overlay starts below the header.
      zIndex: 998
    }}>
      <div style={{
        flexShrink: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '14px 16px',
        borderBottom: '1px solid #18181B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.2px', color: '#FFFFFF' }}>
              Messages
            </h2>
            {unreadMessageCount > 0 && (
              <span style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {unreadMessageCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {loading ? (
          <>
            {[1, 2, 3].map((bubble) => (
              <div
                key={bubble}
                style={{
                  width: bubble % 2 === 0 ? '70%' : '55%',
                  alignSelf: bubble % 2 === 0 ? 'flex-end' : 'flex-start',
                  height: '54px',
                  borderRadius: '14px',
                  backgroundColor: '#0C0C0E',
                  border: '1px solid #1E1E22'
                }}
              />
            ))}
          </>
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
            const isAmbassador = item.sender_role === 'ambassador';
            const currentDateLabel = getDateLabel(item.created_at);
            let showDateDivider = false;

            if (currentDateLabel && currentDateLabel !== lastRenderedDate) {
              showDateDivider = true;
              lastRenderedDate = currentDateLabel;
            }

            return (
              <React.Fragment key={item.id}>
                {showDateDivider && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#71717A',
                      backgroundColor: '#121212',
                      border: '1px solid #27272A',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}>
                      {currentDateLabel}
                    </span>
                  </div>
                )}

                <div
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
              </React.Fragment>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {loading ? (
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            padding: '12px 14px',
            borderTop: '1px solid #18181B',
            backgroundColor: '#09090B',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '24px',
              backgroundColor: '#0C0C0E',
              border: '1px solid #1E1E22'
            }}
          />
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#0C0C0E',
              border: '1px solid #1E1E22',
              flexShrink: 0
            }}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          style={{
            flexShrink: 0,
            padding: '12px 14px',
            borderTop: '1px solid #18181B',
            backgroundColor: 'rgba(9, 9, 11, 0.98)',
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
            onFocus={handleInputFocus}
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
      )}
    </div>
  );
}