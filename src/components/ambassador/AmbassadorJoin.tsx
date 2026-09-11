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

  const [mounted, setMounted] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const displayName = (inviteData?.display_name || 'GUEST').toUpperCase();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
        <div style={{ ...wrapperStyle, textAlign: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '4px', color: '#ef4444', margin: '0 0 16px 0' }}>
            INVITATION EXPIRED
          </h2>
          <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.8', margin: 0, fontWeight: 300 }}>
            This pass key is no longer active. Request authorization renewal below.
          </p>

          {reissueSubmitted ? (
            <div style={statusStyle('#22c55e')}>✓ RENEWAL REQUEST SUBMITTED</div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '32px' }}>
              <input
                style={{
                  ...underlineInputStyle,
                  borderColor: focusedInput === 'reissue' ? '#ffffff' : 'rgba(255,255,255,0.15)',
                  marginBottom: '24px'
                }}
                placeholder="Reason for renewal request..."
                value={reissueMsg}
                onFocus={() => setFocusedInput('reissue')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setReissueMsg(e.target.value)}
                required
              />
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
      <div style={{
        ...wrapperStyle,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* Title Block - Clean 2-Line High Fashion Typography */}
        <div>
          <h1 style={titleStyle}>
            <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 200 }}>WELCOME,</span>
            <br />
            <span style={{ color: '#ffffff', fontWeight: 400 }}>{displayName}</span>
          </h1>

          <p style={descriptionStyle}>
            Exclusive authorization to represent NOMAD and curate selected allocations.
          </p>
        </div>

        {/* Benefit Items */}
        <div style={benefitsStyle}>
          <div style={benefitItemStyle}>
            <span style={numberStyle}>01</span>
            <div>
              <div style={benefitTitleStyle}>CURATED ALLOCATION</div>
              <p style={benefitDescStyle}>Access designated high-margin drops for your private storefront.</p>
            </div>
          </div>

          <div style={benefitItemStyle}>
            <span style={numberStyle}>02</span>
            <div>
              <div style={benefitTitleStyle}>AUTOMATED PAYOUTS</div>
              <p style={benefitDescStyle}>Real-time order attribution and direct settlement reporting.</p>
            </div>
          </div>

          <div style={benefitItemStyle}>
            <span style={numberStyle}>03</span>
            <div>
              <div style={benefitTitleStyle}>PRIVÉ ACCESS</div>
              <p style={benefitDescStyle}>Bespoke tracking links and early access to archival releases.</p>
            </div>
          </div>
        </div>

        {/* Minimal Form */}
        <div>
          <div style={tabHeaderStyle}>
            <button 
              type="button" 
              style={tabStyle(mode === 'signup')} 
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
            <button 
              type="button" 
              style={tabStyle(mode === 'login')} 
              onClick={() => setMode('login')}
            >
              LOG IN
            </button>
          </div>

          {isCheckingEmail && <div style={statusStyle('#3b82f6')}>VERIFYING...</div>}
          {!isCheckingEmail && accountFound === true && <div style={statusStyle('#22c55e')}>✓ ACCOUNT DETECTED</div>}
          {errorMessage && <div style={statusStyle('#ef4444')}>{errorMessage}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {mode === 'signup' && (
              <input 
                type="text" 
                style={{
                  ...underlineInputStyle,
                  borderColor: focusedInput === 'fullName' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
                }} 
                value={fullName} 
                onFocus={() => setFocusedInput('fullName')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Full Name"
                required 
              />
            )}

            <input 
              type="email" 
              style={{
                ...underlineInputStyle,
                borderColor: focusedInput === 'email' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
              }} 
              value={email} 
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email Address"
              required 
            />

            <input 
              type="password" 
              style={{
                ...underlineInputStyle,
                borderColor: focusedInput === 'password' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
              }} 
              value={password} 
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              onChange={(e) => setPassword(e.target.value)} 
              placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
              required 
              minLength={6} 
            />

            <button type="submit" disabled={submitting || isCheckingEmail} style={buttonStyle}>
              {submitting 
                ? 'PROCESSING...' 
                : mode === 'signup' 
                  ? 'JOIN AMBASSADOR CIRCLE' 
                  : 'ENTER PRIVÉ PORTAL'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

// ---------------- STYLES ----------------

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 24px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
  boxSizing: 'border-box',
};

const wrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  letterSpacing: '4px',
  margin: '0 0 12px 0',
  lineHeight: '1.3',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#777777',
  lineHeight: '1.7',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.2px',
};

const benefitsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '8px 0',
};

const benefitItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
};

const numberStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 500,
  color: '#444444',
  letterSpacing: '1px',
  paddingTop: '2px',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '3px',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#666666',
  margin: 0,
  lineHeight: '1.5',
  fontWeight: 300,
};

const tabHeaderStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '28px',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  color: active ? '#ffffff' : '#444444',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? '1px solid #ffffff' : '1px solid transparent',
  marginBottom: '-1px',
  transition: 'color 0.2s ease, border-color 0.2s ease',
  outline: 'none',
});

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  letterSpacing: '0.5px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.25s ease',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '0px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '10px',
  letterSpacing: '2.5px',
  marginTop: '8px',
  transition: 'opacity 0.2s ease',
};

const statusStyle = (color: string): React.CSSProperties => ({
  fontSize: '10px',
  color,
  letterSpacing: '1.5px',
  fontWeight: 500,
  marginBottom: '20px',
});
