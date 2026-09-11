import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon, SendIcon } from '@/components/icons';
import styles from './AmbassadorJoin.module.css';

interface AmbassadorJoinProps {
  initialInviteData: any;
}

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

  // Concierge Support, Accordion & Chat States
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [customSupportEmail, setCustomSupportEmail] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
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

  // Fetch Concierge Chat History
  const fetchMessages = async () => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const channelId = inviteData?.token || activeEmail || 'general_inquiry';

    if (!channelId && !activeEmail) return;

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .or(`channel_id.eq.${channelId},sender_email.eq.${activeEmail}`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [email, defaultEmail]);

  // Realtime Listener for Live Admin Replies
  useEffect(() => {
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();
    const channelId = inviteData?.token || activeEmail || 'general_inquiry';

    if (!channelId) return;

    const channel = supabase
      .channel(`communications:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.new) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email, defaultEmail, customSupportEmail, inviteData]);

  const showInlineChat = isConciergeOpen || messages.length > 0;

  // Internal Scroll Only for Messages (No Page Window Scroll)
  useEffect(() => {
    if (showInlineChat && messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, showInlineChat]);

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

        const autoReplyMsg = {
          id: 'auto-' + Date.now(),
          sender_role: 'admin',
          message: 'Message logged with NOMAD Desk. A representative will review and respond shortly.',
          created_at: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMsg, autoReplyMsg]);
      }
    } catch (err) {
      console.error('Support message submission failed', err);
    } finally {
      setIsSendingSupport(false);
    }
  };

  if (isExpired) {
    return (
      <div className={styles.container}>
        <div className={styles.cardStyle} style={{ maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '3px', color: '#ef4444', margin: '0 0 12px 0' }}>
            INVITATION EXPIRED
          </h2>
          <p className={styles.description}>
            This private pass key is no longer active. Submit a request to the administrator for renewal.
          </p>

          {reissueSubmitted ? (
            <div style={{ fontSize: '10px', color: '#22c55e', letterSpacing: '1.5px', marginTop: '20px' }}>
              ✓ RENEWAL REQUEST SENT
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '30px' }}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <textarea
                  className={styles.underlineInput}
                  style={{ minHeight: '60px', resize: 'none' }}
                  placeholder="Reason for renewal request..."
                  value={reissueMsg}
                  onChange={(e) => setReissueMsg(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className={styles.submitButton}>
                {submitting ? 'SENDING...' : 'REQUEST RENEWAL'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${showInlineChat ? styles.containerChatMode : ''}`}>
      <div className={styles.bgAmbient} />

      <div className={styles.mainWrapper}>

        {/* Accordion Toggle Header Bar (Only visible when chat is active) */}
        {showInlineChat && (
          <button 
            type="button" 
            className={styles.accordionToggle} 
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          >
            <span className={styles.accordionTitle}>
              WELCOME, <span className={styles.accordionTitleHighlight}>{headerDisplayName}</span>
            </span>
            <span className={`${styles.chevronIcon} ${isAccordionOpen ? styles.chevronIconRotated : ''}`}>
              ▼
            </span>
          </button>
        )}

        {/* Clean CSS Grid Accordion for Top Section */}
        <div className={`${styles.accordionGrid} ${(!showInlineChat || isAccordionOpen) ? styles.accordionGridOpen : ''}`}>
          <div className={styles.accordionInner}>
            <div className={styles.accordionContent}>
              
              <div>
                <h1 className={styles.welcomeTitle}>
                  WELCOME,
                  <br />
                  <span className={styles.nameSpan}>{headerDisplayName}</span>
                </h1>

                <p className={styles.description}>
                  You have been granted exclusive access to curate selected allocations and represent NOMAD.
                </p>
              </div>

              <div className={styles.benefitsGrid}>
                <div className={styles.benefitCard}>
                  <span className={styles.benefitNumber}>01</span>
                  <div className={styles.benefitTitle}>CURATED ALLOCATION</div>
                  <p className={styles.benefitDesc}>Select products from our high-tier ambassador allocation to feature in your private gallery.</p>
                </div>

                <div className={styles.benefitCard}>
                  <span className={styles.benefitNumber}>02</span>
                  <div className={styles.benefitTitle}>AUTOMATED COMMISSIONS</div>
                  <p className={styles.benefitDesc}>
                    Earn a baseline {commissionRate}% payout with real-time performance tracking for every sales conversion. Rates remain subject to periodic review by NOMAD.
                  </p>
                </div>

                <div className={styles.benefitCard}>
                  <span className={styles.benefitNumber}>03</span>
                  <div className={styles.benefitTitle}>PRIVÉ PRIVILEGES</div>
                  <p className={styles.benefitDesc}>
                    Bespoke invitation links offering an initial {discountPercent}% VIP pass for your audience, early release access, and direct portal management. Discount rates remain subject to adjustment by NOMAD.
                  </p>
                </div>
              </div>

              <div className={styles.cardStyle}>
                <div className={styles.tabContainer}>
                  <button 
                    type="button" 
                    className={`${styles.tabButton} ${mode === 'signup' ? styles.tabButtonActive : ''}`} 
                    onClick={() => setMode('signup')}
                  >
                    SIGN UP
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.tabButton} ${mode === 'login' ? styles.tabButtonActive : ''}`} 
                    onClick={() => setMode('login')}
                  >
                    LOG IN
                  </button>
                </div>

                <div className={styles.statusContainer}>
                  {isCheckingEmail && <span style={{ color: '#60a5fa' }}>VERIFYING ACCOUNT...</span>}
                  {!isCheckingEmail && accountFound === true && <span style={{ color: '#4ade80' }}>✓ EXISTING ACCOUNT DETECTED</span>}
                  {errorMessage && <span style={{ color: '#f87171' }}>{errorMessage}</span>}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {mode === 'signup' && (
                    <div className={styles.inputWrapper}>
                      <input 
                        type="text" 
                        name="ambassador_name_field"
                        autoComplete="off"
                        className={styles.underlineInput}
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder={defaultTitleName || "Full Name"}
                      />
                    </div>
                  )}

                  <div className={styles.inputWrapper}>
                    <input 
                      type="text" 
                      inputMode="email"
                      name="ambassador_user_id"
                      autoComplete="off"
                      className={styles.underlineInput}
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder={defaultEmail || "Email Address"}
                    />
                  </div>

                  <div className={styles.inputWrapper}>
                    <input 
                      type="password" 
                      name="ambassador_password_field"
                      autoComplete="new-password"
                      className={styles.underlineInput}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
                      required 
                      minLength={6} 
                    />
                  </div>

                  <button type="submit" disabled={submitting || isCheckingEmail} className={styles.submitButton}>
                    {submitting 
                      ? 'PROCESSING...' 
                      : mode === 'signup' 
                        ? 'JOIN CIRCLE' 
                        : 'ENTER PORTAL'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Links (When chat is closed) OR Native Dynamic Chat UI */}
        {!showInlineChat ? (
          <div className={styles.footerContainer}>
            <div className={styles.footerLinks}>
              <button 
                type="button" 
                onClick={() => setIsConciergeOpen(true)} 
                className={styles.footerLink}
              >
                CONCIERGE SUPPORT
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
              <a href="/privacy" className={styles.footerLink}>PRIVACY POLICY</a>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
              <a href="/terms" className={styles.footerLink}>TERMS</a>
            </div>
            <p className={styles.copyright}>© 2026 NOMAD. ALL RIGHTS RESERVED.</p>
          </div>
        ) : (
          <div className={styles.chatWrapper}>
            <div className={styles.chatHeader}>
              <div>
                <span className={styles.conciergeTag}>PRIVATE DESK</span>
                <h3 className={styles.conciergeTitle}>NOMAD CONCIERGE</h3>
              </div>
              {messages.length === 0 && (
                <button 
                  type="button" 
                  onClick={() => setIsConciergeOpen(false)} 
                  className={styles.iconButton}
                  aria-label="Close Chat"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            {!(email || defaultEmail) && (
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  inputMode="email"
                  className={styles.underlineInput}
                  placeholder="Your Return Email Address"
                  value={customSupportEmail}
                  onChange={(e) => setCustomSupportEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.messagesArea}>
              {isLoadingMessages ? (
                <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', textAlign: 'center', padding: '15px 0' }}>
                  FETCHING HISTORY...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', padding: '15px 0', fontWeight: 300 }}>
                  Direct communication line with NOMAD administration. Type below to start.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'support';
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`${styles.msgItem} ${isAdmin ? styles.msgAdmin : styles.msgUser}`}
                    >
                      <span className={styles.msgLabel}>
                        {isAdmin ? 'NOMAD DESK' : 'YOU'}
                      </span>
                      <div className={`${styles.msgBubble} ${isAdmin ? styles.msgBubbleAdmin : styles.msgBubbleUser}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendSupportMessage} className={styles.chatInputForm}>
              <textarea
                ref={textareaRef}
                className={styles.chatPillInput}
                rows={1}
                placeholder="Type your message..."
                value={supportMsg}
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
                className={styles.sendBtn}
                style={{
                  opacity: (isSendingSupport || !supportMsg.trim()) ? 0.25 : 1,
                  cursor: (isSendingSupport || !supportMsg.trim()) ? 'not-allowed' : 'pointer',
                  backgroundColor: supportMsg.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                  color: supportMsg.trim() ? '#000000' : '#ffffff',
                }}
                aria-label="Send Message"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
