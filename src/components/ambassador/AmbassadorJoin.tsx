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

  // Concierge Modal & Support Chat States
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
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

  // Fetch Support History
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
      <div style={containerStyle}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '3px', color: '#ef4444', margin: '0 0 12px 0' }}>
            INVITATION EXPIRED
          </h2>
          <p style={descStyle}>
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
                  style={underlineInputStyle}
                  placeholder="Reason for renewal request..."
                  value={reissueMsg}
                  onChange={(e) => setReissueMsg(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} style={submitButtonStyle}>
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
      <div style={mainWrapperStyle}>
        
        {/* Header Section */}
        <div>
          <h1 style={titleStyle}>
            WELCOME,
            <br />
            <span style={{ color: '#ffffff', fontWeight: 400, letterSpacing: '3px' }}>{headerDisplayName}</span>
          </h1>

          <p style={descStyle}>
            You have been granted exclusive access to curate selected allocations and represent NOMAD.
          </p>
        </div>

        {/* Benefits Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={cardStyle}>
            <span style={numberStyle}>01</span>
            <div style={benefitTitleStyle}>CURATED ALLOCATION</div>
            <p style={benefitDescStyle}>Select products from our high-tier ambassador allocation to feature in your private gallery.</p>
          </div>

          <div style={cardStyle}>
            <span style={numberStyle}>02</span>
            <div style={benefitTitleStyle}>AUTOMATED COMMISSIONS</div>
            <p style={benefitDescStyle}>
              Earn a baseline {commissionRate}% payout with real-time performance tracking for every sales conversion.
            </p>
          </div>

          <div style={cardStyle}>
            <span style={numberStyle}>03</span>
            <div style={benefitTitleStyle}>PRIVÉ PRIVILEGES</div>
            <p style={benefitDescStyle}>
              Bespoke invitation links offering an initial {discountPercent}% VIP pass for your audience, early release access, and direct portal management.
            </p>
          </div>
        </div>

        {/* Signup / Login Form Area */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '16px' }}>
            <button 
              type="button" 
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'signup' ? '#ffffff' : 'transparent', color: mode === 'signup' ? '#ffffff' : '#666666' }} 
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
            <button 
              type="button" 
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'login' ? '#ffffff' : 'transparent', color: mode === 'login' ? '#ffffff' : '#666666' }} 
              onClick={() => setMode('login')}
            >
              LOG IN
            </button>
          </div>

          <div style={{ minHeight: '20px', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>
            {isCheckingEmail && <span style={{ color: '#60a5fa' }}>VERIFYING ACCOUNT...</span>}
            {!isCheckingEmail && accountFound === true && <span style={{ color: '#4ade80' }}>✓ EXISTING ACCOUNT DETECTED</span>}
            {errorMessage && <span style={{ color: '#f87171' }}>{errorMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {mode === 'signup' && (
              <div>
                <input 
                  type="text" 
                  name="ambassador_name_field"
                  autoComplete="off"
                  style={underlineInputStyle}
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder={defaultTitleName || "Full Name"}
                />
              </div>
            )}

            <div>
              <input 
                type="text" 
                inputMode="email"
                name="ambassador_user_id"
                autoComplete="off"
                style={underlineInputStyle}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={defaultEmail || "Email Address"}
              />
            </div>

            <div>
              <input 
                type="password" 
                name="ambassador_password_field"
                autoComplete="new-password"
                style={underlineInputStyle}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
                required 
                minLength={6} 
              />
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={submitButtonStyle}>
              {submitting 
                ? 'PROCESSING...' 
                : mode === 'signup' 
                  ? 'JOIN CIRCLE' 
                  : 'ENTER PORTAL'}
            </button>
          </form>
        </div>

        {/* Clean Footer Links */}
        <div style={footerStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => setIsConciergeOpen(true)} 
              style={footerLinkStyle}
            >
              CONCIERGE SUPPORT
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
            <a href="/privacy" style={footerLinkStyle}>PRIVACY POLICY</a>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>•</span>
            <a href="/terms" style={footerLinkStyle}>TERMS</a>
          </div>
          <p style={{ color: '#555555', fontSize: '8px', letterSpacing: '2px', margin: 0, fontWeight: 300 }}>
            © 2026 NOMAD. ALL RIGHTS RESERVED.
          </p>
        </div>

      </div>

      {/* Clean Concierge Support Overlay Modal */}
      {isConciergeOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>PRIVATE DESK</span>
                <h3 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 300, color: '#ffffff', margin: 0 }}>NOMAD CONCIERGE</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsConciergeOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <CloseIcon />
              </button>
            </div>

            {!(email || defaultEmail) && (
              <div style={{ margin: '12px 0 4px 0' }}>
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

            <div style={{ flex: 1, overflowY: 'auto', margin: '12px 0', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoadingMessages ? (
                <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', textAlign: 'center', padding: '20px 0' }}>
                  FETCHING HISTORY...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', padding: '20px 0', fontWeight: 300 }}>
                  Direct communication line with NOMAD administration. Type below to start.
                </div>
              ) : (
                messages.map((msg, index) => {
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
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendSupportMessage} style={chatInputFormStyle}>
              <textarea
                ref={textareaRef}
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', fontWeight: 300, outline: 'none', resize: 'none', maxHeight: '80px', lineHeight: '1.4', padding: '8px 0' }}
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
      )}

    </div>
  );
}

// Inline Styles
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

const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 200,
  letterSpacing: '4px',
  margin: '0 0 10px 0',
  lineHeight: 1.25,
  color: '#a0a0a0'
};

const descStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#bbbbbb',
  lineHeight: '1.6',
  margin: 0,
  fontWeight: 300
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
  padding: '12px 16px'
};

const numberStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#888888',
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '2px'
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '4px'
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cccccc',
  margin: 0,
  lineHeight: '1.5',
  fontWeight: 300
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1.5px solid transparent',
  marginBottom: '-1px',
  outline: 'none'
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
  boxSizing: 'border-box'
};

const submitButtonStyle: React.CSSProperties = {
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
  outline: 'none'
};

const footerStyle: React.CSSProperties = {
  marginTop: '20px',
  paddingTop: '20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const footerLinkStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '9px',
  letterSpacing: '1.5px',
  textDecoration: 'none',
  fontWeight: 400,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '390px',
  height: '80vh',
  maxHeight: '560px',
  backgroundColor: '#0a0a0a',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
};

const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '28px',
  padding: '4px 6px 4px 16px',
  gap: '8px'
};
