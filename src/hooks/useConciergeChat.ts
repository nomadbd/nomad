import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { CommunicationMessage, AmbassadorInviteData } from '@/types/ambassador';

export function useConciergeChat(
  inviteData: AmbassadorInviteData,
  email: string,
  defaultEmail: string,
  customSupportEmail: string,
  isConciergeOpen: boolean
) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const isConciergeOpenRef = useRef(isConciergeOpen);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isConciergeOpenRef.current = isConciergeOpen;
    if (isConciergeOpen) {
      setHasUnread(false);
    }
  }, [isConciergeOpen]);

  const scrollToBottom = (smooth = false) => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    });
  };

  const fetchMessages = async () => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const channelId = inviteData?.token || activeEmail || 'general_inquiry';

    if (!channelId && !activeEmail) return;

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .or(`channel_id.eq.${channelId},sender_email.eq.${activeEmail},recipient_email.eq.${activeEmail}`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);

        const lastMsg = data[data.length - 1];
        if (
          lastMsg &&
          (lastMsg.sender_role === 'admin' || lastMsg.sender_role === 'support') &&
          !isConciergeOpenRef.current
        ) {
          setHasUnread(true);
        }
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [email, defaultEmail, customSupportEmail]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchMessages();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchMessages);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchMessages);
    };
  }, [email, defaultEmail, customSupportEmail]);

  useEffect(() => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const token = inviteData?.token || '';

    if (!token && !activeEmail) return;

    const channel = supabase
      .channel(`concierge_realtime:${token || activeEmail}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => {
          const newMsg = payload.new as CommunicationMessage;
          const msgSender = (newMsg.sender_email || '').toLowerCase();
          const msgRecipient = (newMsg.recipient_email || '').toLowerCase();
          const msgChannel = newMsg.channel_id || '';

          const isTargetMsg =
            (token && msgChannel === token) ||
            (activeEmail && (msgChannel === activeEmail || msgSender === activeEmail || msgRecipient === activeEmail));

          if (isTargetMsg) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });

            const isAdmin = newMsg.sender_role === 'admin' || newMsg.sender_role === 'support';
            if (isAdmin && !isConciergeOpenRef.current) setHasUnread(true);
            if (isConciergeOpenRef.current) scrollToBottom(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email, defaultEmail, customSupportEmail, inviteData]);

  useEffect(() => {
    if (isConciergeOpen && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages, isConciergeOpen]);

  return {
    messages,
    setMessages,
    isLoadingMessages,
    hasUnread,
    setHasUnread,
    chatContainerRef,
    scrollToBottom,
  };
}
