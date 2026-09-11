import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface AmbassadorJoinProps {
  initialInviteData: any;
}

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

  // Focus states for dynamic underline accent
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteData) return;

    const isTimeExpired = new Date(inviteData.expires_at) < new Date();
    if (inviteData.display_name) setFullName(inviteData.display_name);

    const initialEmail =
      inviteData.email ||
      (inviteData.recipient_identifier && inviteData.recipient_identifier.includes('@')
        ? inviteData.recipient_identifier
        : '');

    if (initialEmail) {
      setEmail(initialEmail);
      checkEmailExistence(initialEmail);
    }

    if (isTimeExpired || inviteData.is_registered) {
      setIsExpired(true);
      if (inviteData.reissue_requested) setReissueSubmitted(true);
    }
  }, [inviteData]);

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
    const timer = setTimeout(() => {
      if (email.trim().length > 3 && email.includes('@')) {
        checkEmailExistence(email);
      } else {
        setAccountFound(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      let userId = '';
      let userEmail = email.trim();
      let userName = fullName.trim();

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

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <style>{animationStyles}</style>
        <div style={bgGlowStyle} />
        <div style={{ ...cardStyle, maxWidth: '420px', textAlign: 'center' }} className="animate-fade-up">
          <div style={badgeStyle}>
            <span style={dotStyle('#ef4444')} />
            INVITATION EXPIRED
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '2px', margin: '20px 0 10px 0', textTransform: 'uppercase' }}>
            LINK INACTIVE
          </h2>
          <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.8', margin: 0, fontWeight: 300 }}>
            This exclusive pass key has expired. Submit a request to the administrator for renewal.
          </p>

          {reissueSubmitted ? (
            <div style={statusBannerStyle('#22c55e', '24px')}>
              ✓ RENEWAL REQUEST SENT
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '30px' }}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <textarea
                  style={{
                    ...underlineInputStyle,
                    minHeight: '60px',
                    resize: 'none',
                    borderColor: focusedInput === 'reissue' ? '#fff' : 'rgba(255,255,255,0.2)'
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
      <style>{animationStyles}</style>

      {/* Dynamic Ambient Background Glow */}
      <div style={bgGlowStyle} />

      <div style={mainContentWrapperStyle}>
        {/* Header Section */}
        <div style={welcomeHeaderStyle} className="animate-fade-up">
          <div style={badgeStyle}>
            <span style={dotStyle('#22c55e')} />
            NOMAD PRIVÉ
          </div>

          <h1 style={titleStyle}>
            WELCOME, <span style={{ color: '#ffffff', fontWeight: 400 }}>{inviteData?.display_name?.toUpperCase() || 'GUEST'}</span>
          </h1>

          <p style={descriptionStyle}>
            An invitation to curate, influence, and shape the private circle of NOMAD.
          </p>
        </div>

        {/* Benefits Section with staggered scroll animations */}
        <div style={benefitsGridStyle}>
          <div style={benefitCardStyle} className="animate-fade-up delay-1">
            <span style={benefitNumberStyle}>01</span>
            <div style={benefitTitleStyle}>CURATED STOREFRONT</div>
            <p style={benefitDescStyle}>Your personal digital gallery to display handpicked collections.</p>
          </div>

          <div style={benefitCardStyle} className="animate-fade-up delay-2">
            <span style={benefitNumberStyle}>02</span>
            <div style={benefitTitleStyle}>AUTOMATED EARNINGS</div>
            <p style={benefitDescStyle}>Seamless real-time commission tracking and automated payouts.</p>
          </div>

          <div style={benefitCardStyle} className="animate-fade-up delay-3">
            <span style={benefitNumberStyle}>03</span>
            <div style={benefitTitleStyle}>PRIVÉ PRIVILEGES</div>
            <p style={benefitDescStyle}>Early access to archival drops and bespoke private links.</p>
          </div>
        </div>

        {/* Interactive Form Box */}
        <div style={cardStyle} className="animate-fade-up delay-4">
          {/* Minimal Line Tab Controller */}
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

          {/* Status Banners */}
          {isCheckingEmail && (
            <div style={statusBannerStyle('#3b82f6', '0 0 24px 0')}>
              VERIFYING IDENTITY...
            </div>
          )}

          {!isCheckingEmail && accountFound === true && (
            <div style={statusBannerStyle('#22c55e', '0 0 24px 0')}>
              ✓ EXISTING ACCOUNT DETECTED
            </div>
          )}

          {errorMessage && (
            <div style={statusBannerStyle('#ef4444', '0 0 24px 0')}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {mode === 'signup' && (
              <div style={inputWrapperStyle}>
                <input 
                  type="text" 
                  style={{
                    ...underlineInputStyle,
                    borderColor: focusedInput === 'fullName' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                  }} 
                  value={fullName} 
                  onFocus={() => setFocusedInput('fullName')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Full Name"
                  required 
                />
              </div>
            )}

            <div style={inputWrapperStyle}>
              <input 
                type="email" 
                style={{
                  ...underlineInputStyle,
                  borderColor: focusedInput === 'email' ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                }} 
                value={email} 
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email Address"
                required 
              />
            </div>

            <div style={inputWrapperStyle}>
              <input 
                type="password" 
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
                  ? 'JOIN AMBASSADOR CIRCLE' 
                  : 'ENTER PRIVÉ DASHBOARD'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------------- ANIMATIONS & INLINE STYLES ----------------

const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08); }
  }

  .animate-fade-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .delay-1 { animation-delay: 0.1s; opacity: 0; }
  .delay-2 { animation-delay: 0.2s; opacity: 0; }
  .delay-3 { animation-delay: 0.3s; opacity: 0; }
  .delay-4 { animation-delay: 0.4s; opacity: 0; }
`;

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};

const bgGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '30%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
  pointerEvents: 'none',
  zIndex: 0,
  animation: 'pulseGlow 8s ease-in-out infinite',
};

const mainContentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  display: 'flex',
  flexDirection: 'column',
  gap: '36px',
  position: 'relative',
  zIndex: 1,
};

const welcomeHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 16px',
  borderRadius: '100px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  color: '#ffffff',
  marginBottom: '24px',
};

const dotStyle = (color: string): React.CSSProperties => ({
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  backgroundColor: color,
  boxShadow: `0 0 6px ${color}`,
});

const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 200,
  letterSpacing: '3px',
  margin: '0 0 14px 0',
  lineHeight: '1.3',
  color: 'rgba(255, 255, 255, 0.6)',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#777777',
  lineHeight: '1.7',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.2px',
};

const benefitsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const benefitCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '16px 20px',
  transition: 'border-color 0.3s ease, background-color 0.3s ease',
};

const benefitNumberStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#555555',
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '4px',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '4px',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888888',
  margin: 0,
  lineHeight: '1.6',
  fontWeight: 300,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 0',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  marginBottom: '28px',
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  color: active ? '#ffffff' : '#444444',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid #ffffff' : '2px solid transparent',
  marginBottom: '-1px',
  transition: 'all 0.3s ease',
  outline: 'none',
});

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 300,
  letterSpacing: '0.5px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '2px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '11px',
  letterSpacing: '2.5px',
  marginTop: '12px',
  transition: 'all 0.2s ease',
};

const statusBannerStyle = (color: string, margin: string): React.CSSProperties => ({
  fontSize: '11px',
  color,
  letterSpacing: '1.5px',
  fontWeight: 500,
  textAlign: 'center',
  margin,
});
