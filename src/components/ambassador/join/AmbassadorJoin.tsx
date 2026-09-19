import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import {
  AmbassadorJoinProps,
  HeroHeader,
  BenefitCards,
  ExpiredNotice,
  JoinSheet,
  ConciergeModal,
  JoinFooter
} from './'; 

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function AmbassadorJoin({ initialInviteData }: AmbassadorJoinProps) {
  const [inviteData] = useState<any>(initialInviteData);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reissueMsg, setReissueMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reissueSubmitted, setReissueSubmitted] = useState(false);

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [accountFound, setAccountFound] = useState<boolean | null>(null);

  const [isPageMounted, setIsPageMounted] = useState(false);

  const [isJoinSheetOpen, setIsJoinSheetOpen] = useState(false);
  const [isJoinSheetAnimating, setIsJoinSheetAnimating] = useState(false);

  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [customSupportEmail, setCustomSupportEmail] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [hasUnread, setHasUnread] = useState(false);
  const isConciergeOpenRef = useRef(isConciergeOpen);

  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rawDisplayName = inviteData?.display_name || 'GUEST';
  const headerDisplayName = rawDisplayName.toUpperCase();
  const defaultTitleName = toTitleCase(rawDisplayName);

  const defaultEmail = (
    inviteData?.email ||
    (inviteData?.recipient_identifier && inviteData?.recipient_identifier.includes('@')
      ? inviteData.recipient_identifier
      : '')
  ).toLowerCase();

  const commissionRate = inviteData?.commission_rate ?? 15;
  const discountPercent = inviteData?.discount_percent ?? 10;

  useEffect(() => {
    isConciergeOpenRef.current = isConciergeOpen;
    if (isConciergeOpen) {
      setHasUnread(false);
    }
  }, [isConciergeOpen]);

  useEffect(() => {
    setIsPageMounted(true);
  }, []);

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

  useEffect(() => {
    const isModalActive = isConciergeOpen || isJoinSheetOpen;
    if (!isModalActive) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          top: `${window.visualViewport.offsetTop}px`,
        });
        if (isConciergeOpen) {
          scrollToBottom(false);
        }
      }
    };

    updateViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
    };
  }, [isConciergeOpen, isJoinSheetOpen]);

  const handleOpenJoinSheet = () => {
    setIsJoinSheetOpen(true);
    setTimeout(() => {
      setIsJoinSheetAnimating(true);
    }, 20);
  };

  const handleCloseJoinSheet = () => {
    setIsJoinSheetAnimating(false);
    setTimeout(() => {
      setIsJoinSheetOpen(false);
    }, 350);
  };

  const handleOpenConcierge = () => {
    setHasUnread(false);
    setIsConciergeOpen(true);
    setTimeout(() => {
      setIsModalAnimating(true);
      scrollToBottom(false);
    }, 20);
  };

  const handleCloseConcierge = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setIsConciergeOpen(false);
    }, 350);
  };

  const checkEmailExistence = async (emailToCheck: string) => {
    const cleanEmail = emailToCheck.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAccountFound(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        setAccountFound(true);
        setMode('login');
      } else {
        setAccountFound(false);
        setMode('signup');
      }
    } catch (e) {
      setAccountFound(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (!inviteData) return;

    const isTimeExpired = new Date(inviteData.expires_at) < new Date();

    if (defaultEmail) {
      checkEmailExistence(defaultEmail);
    }

    if (isTimeExpired || inviteData.is_registered) {
      setIsExpired(true);
      if (inviteData.reissue_requested) setReissueSubmitted(true);
    }
  }, [inviteData, defaultEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEmail = email.trim() || defaultEmail;
      if (activeEmail.length > 3 && activeEmail.includes('@')) {
        checkEmailExistence(activeEmail);
      } else {
        setAccountFound(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, defaultEmail]);

  // ১. ফিক্সড ফেচ ফাংশন: টোকেন থাকলে টোকেন দিয়ে একদম নিখুঁত ফিল্টার
  const fetchMessages = async () => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const token = inviteData?.token;

    if (!token && !activeEmail) return;

    setIsLoadingMessages(true);
    try {
      let query = supabase.from('communications').select('*');

      if (token) {
        // টোকেন বা স্লগই চ্যাট রুমের ইউনিক আইডি
        query = query.eq('channel_id', token);
      } else if (activeEmail) {
        // শুধুমাত্র ইমেইল ভ্যালিড থাকলে ইমেইল ফিল্টার চলবে
        query = query.or(`channel_id.eq.${activeEmail},sender_email.eq.${activeEmail},recipient_email.eq.${activeEmail}`);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

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
  }, [email, defaultEmail, customSupportEmail, inviteData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchMessages);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchMessages);
    };
  }, [email, defaultEmail, customSupportEmail, inviteData]);

  // ২. ফিক্সড রিয়েলটাইম লিসেনার
  useEffect(() => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const token = inviteData?.token || '';

    if (!token && !activeEmail) return;

    const channelKey = token || activeEmail;

    const channel = supabase
      .channel(`concierge_realtime:${channelKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
        },
        (payload) => {
          const newMsg = payload.new;
          const msgSender = (newMsg.sender_email || '').toLowerCase();
          const msgRecipient = (newMsg.recipient_email || '').toLowerCase();
          const msgChannel = newMsg.channel_id || '';

          const isTargetMsg = token
            ? msgChannel === token
            : (activeEmail && (msgChannel === activeEmail || msgSender === activeEmail || msgRecipient === activeEmail));

          if (isTargetMsg) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });

            const isAdmin = newMsg.sender_role === 'admin' || newMsg.sender_role === 'support';

            if (isAdmin && !isConciergeOpenRef.current) {
              setHasUnread(true);
            }

            if (isConciergeOpenRef.current) {
              scrollToBottom(false);
            }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      let userId = '';
      let userEmail = (email.trim() || defaultEmail).toLowerCase();
      let userName = fullName.trim() ? toTitleCase(fullName.trim()) : defaultTitleName;

      if (!userEmail) {
        throw new Error('PLEASE ENTER A VALID EMAIL ADDRESS');
      }

      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userEmail,
          password,
          options: { data: { full_name: userName, role: 'AMBASSADOR' } }
        });

        if (authError || !authData.user) {
          throw new Error(authError?.message || 'SIGN UP FAILED');
        }
        userId = authData.user.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password
        });

        if (authError || !authData.user) {
          throw new Error('INVALID EMAIL OR PASSWORD');
        }
        userId = authData.user.id;
        userEmail = authData.user.email || userEmail;
      }

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: inviteData.token,
        new_user_id: userId,
        user_email: userEmail,
        user_name: userName
      });

      if (rpcErr || !rpcRes?.success) {
        throw new Error(rpcRes?.message || rpcErr?.message || 'REGISTRATION FAILED');
      }

      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'SOMETHING WENT WRONG');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReissueRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData?.token || !reissueMsg.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('request_ambassador_invite_reissue', {
        invite_token: inviteData.token,
        user_message: reissueMsg,
      });

      if (error || !data?.success) {
        setErrorMessage(data?.message || 'FAILED TO SUBMIT REQUEST');
      } else {
        setReissueSubmitted(true);
      }
    } catch (err) {
      setErrorMessage('AN UNEXPECTED ERROR OCCURRED');
    } finally {
      setSubmitting(false);
    }
  };

  // ৩. ফিক্সড সাপোর্ট মেসেজ সেন্ড ফাংশন
  const handleSendSupportMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supportMsg.trim() || isSendingSupport) return;

    setIsSendingSupport(true);
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const currentText = supportMsg.trim();
    const targetChannelId = inviteData?.token || activeEmail || 'general_inquiry';

    try {
      const newMessagePayload = {
        channel_type: 'ambassador',
        channel_id: targetChannelId,
        sender_email: activeEmail || null, // ইমেইল না থাকলে ফাঁকা স্ট্রিং বা 'EMPTY' এর বদলে null সেভ হবে
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

  if (isExpired) {
    return (
      <ExpiredNotice 
        isPageMounted={isPageMounted}
        reissueSubmitted={reissueSubmitted}
        reissueMsg={reissueMsg}
        setReissueMsg={setReissueMsg}
        handleReissueRequest={handleReissueRequest}
        submitting={submitting}
      />
    );
  }

  return (
    <div style={containerStyle}>
      <div 
        style={{
          ...mainWrapperStyle,
          transform: isPageMounted ? 'translateY(0)' : 'translateY(35px)',
          opacity: isPageMounted ? 1 : 0,
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease'
        }}
      >
        <HeroHeader displayName={headerDisplayName} />

        <BenefitCards commissionRate={commissionRate} discountPercent={discountPercent} />

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            type="button" 
            onClick={handleOpenJoinSheet}
            style={pillButtonStyle}
          >
            JOIN CIRCLE
          </button>
        </div>

        <JoinFooter handleOpenConcierge={handleOpenConcierge} hasUnread={hasUnread} />
      </div>

      <JoinSheet 
        isJoinSheetOpen={isJoinSheetOpen}
        isJoinSheetAnimating={isJoinSheetAnimating}
        viewportStyle={viewportStyle}
        handleCloseJoinSheet={handleCloseJoinSheet}
        mode={mode}
        setMode={setMode}
        isCheckingEmail={isCheckingEmail}
        accountFound={accountFound}
        errorMessage={errorMessage}
        handleSubmit={handleSubmit}
        fullName={fullName}
        setFullName={setFullName}
        defaultTitleName={defaultTitleName}
        email={email}
        setEmail={setEmail}
        defaultEmail={defaultEmail}
        password={password}
        setPassword={setPassword}
        submitting={submitting}
      />

      <ConciergeModal 
        isConciergeOpen={isConciergeOpen}
        isModalAnimating={isModalAnimating}
        viewportStyle={viewportStyle}
        handleCloseConcierge={handleCloseConcierge}
        email={email}
        defaultEmail={defaultEmail}
        customSupportEmail={customSupportEmail}
        setCustomSupportEmail={setCustomSupportEmail}
        chatContainerRef={chatContainerRef}
        textareaRef={textareaRef}
        isLoadingMessages={isLoadingMessages}
        messages={messages}
        supportMsg={supportMsg}
        setSupportMsg={setSupportMsg}
        handleSendSupportMessage={handleSendSupportMessage}
        isSendingSupport={isSendingSupport}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box'
};

const mainWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '390px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const pillButtonStyle: React.CSSProperties = {
  padding: '12px 32px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '9999px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '10px',
  letterSpacing: '2.5px',
  outline: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease, opacity 0.15s ease',
  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)'
};
