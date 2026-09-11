import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon, SendIcon } from '@/components/icons';

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

  const [mounted, setMounted] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Concierge Support & Chat States
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [customSupportEmail, setCustomSupportEmail] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Dynamic Viewport Height for Mobile Keyboards
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Handle Mobile Keyboard / Visual Viewport Resize
  useEffect(() => {
    if (!isConciergeOpen) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, [isConciergeOpen]);

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
    if (isConciergeOpen) {
      fetchMessages();
    }
  }, [isConciergeOpen, email, defaultEmail]);

  useEffect(() => {
    if (isConciergeOpen && messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleSendSupportMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supportMsg.trim() || isSendingSupport) return;

    setIsSendingSupport(true);
    const activeEmail = (email.trim() || defaultEmail || customSupportEmail.trim()).toLowerCase();

    try {
      const newMessagePayload = {
        channel_type: 'ambassador',
        channel_id: inviteData?.token || activeEmail || 'general_inquiry',
        sender_email: activeEmail,
        sender_role: 'ambassador',
        message: supportMsg.trim(),
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
        if (data && data.length > 0) {
          setMessages((prev) => [...prev, data[0]]);
        } else {
          fetchMessages();
        }
      }
    } catch (err) {
      console.error('Support message submission failed', err);
    } finally {
      setIsSendingSupport(false);
    }
  };

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '3px', color: '#ef4444', margin: '0 0 12px 0' }}>
            INVITATION EXPIRED
          </h2>
          <p style={{ color: '#888888', fontSize: '12px', lineHeight: '1.8', margin: 0, fontWeight: 300 }}>
            This private pass key is no longer active. Submit a request to the administrator for renewal.
          </p>

          {reissueSubmitted ? (
            <div style={statusBannerStyle('#22c55e')}>
              ✓ RENEWAL REQUEST SENT
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '30px' }}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <textarea
                  className="underline-input"
                  style={{
                    ...underlineInputStyle,
                    minHeight: '60px',
                    resize: 'none',
                    borderColor: focusedInput === 'reissue' ? '#ffffff' : 'rgba(255,255,255,0.2)'
                  }}
                  placeholder="Reason for renewal request..."
                  value={reissueMsg}
                  onFocus={() => setFocusedInput('reissue')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setReissueMsg(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} style={buttonStyle}>
                {submitting ? 'SENDING...' : 'REQUEST RENEWAL'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        .underline-input::placeholder {
          color: #888888 !important;
          opacity: 1 !important;
        }
        .concierge-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .concierge-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .concierge-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        .chat-pill-input::placeholder {
          color: #666666 !important;
        }
      `}</style>

      <div style={bgAmbientStyle} />

      <div style={mainContentWrapperStyle}>

        <div style={getFadeStyle(mounted)}>
          <h1 style={welcomeTitleStyle}>
            WELCOME,
            <br />
            <span style={nameSpanStyle}>{headerDisplayName}</span>
          </h1>

          <p style={descriptionStyle}>
            You have been granted exclusive access to curate selected allocations and represent NOMAD.
          </p>
        </div>

        <div style={{ ...benefitsGridStyle, ...getFadeStyle(mounted) }}>
          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>01</span>
            <div style={benefitTitleStyle}>CURATED ALLOCATION</div>
            <p style={benefitDescStyle}>Select products from our high-tier ambassador allocation to feature in your private gallery.</p>
          </div>

          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>02</span>
            <div style={benefitTitleStyle}>AUTOMATED COMMISSIONS</div>
            <p style={benefitDescStyle}>
              Earn a baseline {commissionRate}% payout with real-time performance tracking for every sales conversion. Rates remain subject to periodic review by NOMAD.
            </p>
          </div>

          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>03</span>
            <div style={benefitTitleStyle}>PRIVÉ PRIVILEGES</div>
            <p style={benefitDescStyle}>
              Bespoke invitation links offering an initial {discountPercent}% VIP pass for your audience, early release access, and direct portal management. Discount rates remain subject to adjustment by NOMAD.
            </p>
          </div>
        </div>

        <div style={{ ...cardStyle, ...getFadeStyle(mounted) }}>
          <div style={tabContainerStyle}>
            <button 
              type="button" 
              style={tabButtonStyle(mode === 'signup')} 
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
            <button 
              type="button" 
              style={tabButtonStyle(mode === 'login')} 
              onClick={() => setMode('login')}
            >
              LOG IN
            </button>
          </div>

          <div style={statusContainerStyle}>
            {isCheckingEmail && <span style={{ color: '#60a5fa' }}>VERIFYING ACCOUNT...</span>}
            {!isCheckingEmail && accountFound === true && <span style={{ color: '#4ade80' }}>✓ EXISTING ACCOUNT DETECTED</span>}
            {errorMessage && <span style={{ color: '#f87171' }}>{errorMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{
              maxHeight: mode === 'signup' ? '65px' : '0px',
              opacity: mode === 'signup' ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              pointerEvents: mode === 'signup' ? 'auto' : 'none',
            }}>
              <div style={inputWrapperStyle}>
                <input 
                  type="text" 
                  name="ambassador_name_field"
                  autoComplete="off"
                  className="underline-input"
                  style={{
                    ...underlineInputStyle,
                    borderColor: focusedInput === 'fullName' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                  }} 
                  value={fullName} 
                  onFocus={() => setFocusedInput('fullName')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder={defaultTitleName || "Full Name"}
                />
              </div>
            </div>

            <div style={inputWrapperStyle}>
              <input 
                type="text" 
                inputMode="email"
                name="ambassador_user_id"
                autoComplete="off"
                className="underline-input"
                style={{
                  ...underlineInputStyle,
                  borderColor: focusedInput === 'email' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                }} 
                value={email} 
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={defaultEmail || "Email Address"}
              />
            </div>

            <div style={inputWrapperStyle}>
              <input 
                type="password" 
                name="ambassador_password_field"
                autoComplete="new-password"
                className="underline-input"
                style={{
                  ...underlineInputStyle,
                  borderColor: focusedInput === 'password' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                }} 
                value={password} 
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
                required 
                minLength={6} 
              />
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={buttonStyle}>
              {submitting 
                ? 'PROCESSING...' 
                : mode === 'signup' 
                  ? 'JOIN CIRCLE' 
                  : 'ENTER PORTAL'}
            </button>
          </form>

          <div style={footerContainerStyle}>
            <div style={footerLinksStyle}>
              <a 
                href="#concierge" 
                onClick={(e) => {
                  e.preventDefault();
                  setIsConciergeOpen(true);
                }} 
                style={footerLinkStyle}
              >
                CONCIERGE SUPPORT
              </a>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
              <a href="/privacy" style={footerLinkStyle}>PRIVACY POLICY</a>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
              <a href="/terms" style={footerLinkStyle}>TERMS</a>
            </div>
            <p style={copyrightStyle}>© 2026 NOMAD. ALL RIGHTS RESERVED.</p>
          </div>

        </div>
      </div>

      {/* Dynamic Visual Viewport Handling for Mobile Keyboards */}
      {isConciergeOpen && (
        <div style={getConciergeOverlayStyle(viewportHeight)}>
          <div style={conciergeHeaderStyle}>
            <div>
              <span style={conciergeTagStyle}>PRIVATE DESK</span>
              <h2 style={conciergeTitleStyle}>NOMAD CONCIERGE</h2>
            </div>
            <button 
              type="button" 
              onClick={() => setIsConciergeOpen(false)} 
              style={iconButtonStyle}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div style={conciergeBodyStyle}>
            <p style={{ fontSize: '11px', color: '#888888', lineHeight: '1.6', fontWeight: 300, margin: '0 0 12px 0' }}>
              Direct communication line with NOMAD administration.
            </p>

            {!(email || defaultEmail) && (
              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  inputMode="email"
                  className="underline-input"
                  style={underlineInputStyle}
                  placeholder="Your Return Email Address"
                  value={customSupportEmail}
                  onChange={(e) => setCustomSupportEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="concierge-scroll" style={chatContainerStyle}>
              {isLoadingMessages ? (
                <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', textAlign: 'center', padding: '20px 0' }}>
                  FETCHING HISTORY...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', padding: '30px 0', fontWeight: 300 }}>
                  No previous dispatches found. Begin a new conversation below.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'support';
                  return (
                    <div 
                      key={msg.id || index} 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdmin ? 'flex-start' : 'flex-end',
                        marginBottom: '12px'
                      }}
                    >
                      <span style={{ fontSize: '8px', color: '#666', letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {isAdmin ? 'NOMAD DESK' : 'YOU'}
                      </span>
                      <div 
                        style={{
                          backgroundColor: isAdmin ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.14)',
                          color: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: isAdmin ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                          border: isAdmin ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.2)',
                          maxWidth: '82%',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          fontWeight: 300,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendSupportMessage} style={chatInputFormStyle}>
              <textarea
                ref={textareaRef}
                className="chat-pill-input concierge-scroll"
                rows={1}
                placeholder="Type your message..."
                value={supportMsg}
                onFocus={() => {
                  setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }}
                onChange={(e) => {
                  setSupportMsg(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                style={chatPillInputStyle}
                required
              />

              <button 
                type="submit" 
                disabled={isSendingSupport || !supportMsg.trim()} 
                style={{
                  ...sendIconButtonStyle,
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
        </div>
      )}
    </div>
  );
}

const getFadeStyle = (mounted: boolean): React.CSSProperties => ({
  opacity: mounted ? 1 : 0,
  transform: mounted ? 'translateY(0px)' : 'translateY(24px)',
  transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
});

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};

const bgAmbientStyle: React.CSSProperties = {
  position: 'absolute',
  top: '25%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '380px',
  height: '380px',
  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0) 75%)',
  pointerEvents: 'none',
  zIndex: 0,
};

const mainContentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '390px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
  position: 'relative',
  zIndex: 1,
};

const welcomeTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 200,
  letterSpacing: '5px',
  margin: '0 0 14px 0',
  lineHeight: '1.25',
  color: '#a0a0a0',
};

const nameSpanStyle: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 400,
  letterSpacing: '4px',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#bbbbbb',
  lineHeight: '1.7',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.3px',
};

const benefitsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const benefitCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
  padding: '14px 18px',
};

const benefitNumberStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#888888',
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '4px',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '4px',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cccccc',
  margin: 0,
  lineHeight: '1.6',
  fontWeight: 300,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  marginBottom: '16px',
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  color: active ? '#ffffff' : '#666666',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? '1.5px solid #ffffff' : '1.5px solid transparent',
  marginBottom: '-1px',
  transition: 'color 0.25s ease, border-color 0.25s ease',
  outline: 'none',
});

const statusContainerStyle: React.CSSProperties = {
  minHeight: '22px',
  fontSize: '10px',
  letterSpacing: '1.5px',
  fontWeight: 500,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '12px',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  letterSpacing: '0.5px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '1px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '11px',
  letterSpacing: '3px',
  marginTop: '10px',
  transition: 'background-color 0.25s ease, opacity 0.25s ease',
  outline: 'none',
};

const statusBannerStyle = (color: string): React.CSSProperties => ({
  fontSize: '10px',
  color,
  letterSpacing: '1.5px',
  fontWeight: 500,
  textAlign: 'center',
  marginTop: '20px',
});

const footerContainerStyle: React.CSSProperties = {
  marginTop: '45px',
  paddingTop: '20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const footerLinksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const footerLinkStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '9px',
  letterSpacing: '1.5px',
  textDecoration: 'none',
  fontWeight: 400,
  transition: 'color 0.2s ease',
};

const copyrightStyle: React.CSSProperties = {
  color: '#555555',
  fontSize: '8px',
  letterSpacing: '2px',
  margin: 0,
  fontWeight: 300,
};

const getConciergeOverlayStyle = (vh: number | null): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: vh ? `${vh}px` : '100dvh',
  backgroundColor: '#000000',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 20px calc(12px + env(safe-area-inset-bottom)) 20px',
  boxSizing: 'border-box',
  overflow: 'hidden',
});

const conciergeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
};

const conciergeTagStyle: React.CSSProperties = {
  fontSize: '9px',
  letterSpacing: '2.5px',
  color: '#666666',
  fontWeight: 600,
  display: 'block',
  marginBottom: '4px',
};

const conciergeTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  letterSpacing: '3px',
  fontWeight: 300,
  color: '#ffffff',
  margin: 0,
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ffffff',
  cursor: 'pointer',
  outline: 'none',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const conciergeBodyStyle: React.CSSProperties = {
  maxWidth: '390px',
  width: '100%',
  margin: '12px auto 0 auto',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
};

const chatContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: '4px',
  marginBottom: '12px',
  display: 'flex',
  flexDirection: 'column',
};

const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '28px',
  padding: '4px 6px 4px 16px',
  gap: '8px',
  transition: 'border-color 0.2s ease',
};

const chatPillInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  outline: 'none',
  resize: 'none',
  maxHeight: '100px',
  lineHeight: '1.4',
  padding: '8px 0',
  boxSizing: 'border-box',
};

const sendIconButtonStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s ease',
  outline: 'none',
};
