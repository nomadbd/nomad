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

  // ১. মেয়াদ ও নাম ইনিশিয়াল সেটআপ
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

  // ২. ইমেইল চেক ফাংশন
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

  // ৩. ফর্ম সাবমিট হ্যান্ডলার
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

      // আসল ডাটাবেজ টোকেন পাঠানো হচ্ছে
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: inviteData.token,
        new_user_id: userId,
        user_email: userEmail,
        user_name: userName
      });

      if (rpcErr || !rpcRes?.success) {
        throw new Error(rpcRes?.message || rpcErr?.message || 'REGISTRATION FAILED');
      }

      // সফল হলে রিলোড না করে পেজ রিফ্রেশ করে ড্যাশবোর্ডে নিয়ে যাবে
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'SOMETHING WENT WRONG');
    } finally {
      setSubmitting(false);
    }
  };

  // ৪. রিনিউ লিংক রিকোয়েস্ট
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

  // মেয়াদ উত্তীর্ণ হলে
  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, letterSpacing: '2px', fontSize: '14px', color: '#ef4444' }}>LINK EXPIRED</h2>
          <p style={{ color: '#888888', fontSize: '11px', lineHeight: '1.6' }}>
            This VIP invitation link is no longer active. You may request a renewal link from the administrator.
          </p>

          {reissueSubmitted ? (
            <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', marginTop: '20px' }}>
              <p style={{ margin: 0, color: '#22c55e', fontSize: '10px', letterSpacing: '1px' }}>
                ✓ RENEWAL REQUEST SENT TO ADMIN
              </p>
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '24px' }}>
              <textarea
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                placeholder="Message for requesting new link..."
                value={reissueMsg}
                onChange={(e) => setReissueMsg(e.target.value)}
                required
              />
              <button type="submit" disabled={submitting} style={buttonStyle}>
                {submitting ? 'SENDING...' : 'REQUEST NEW LINK'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={mainContentWrapperStyle}>
        <div style={welcomeHeaderStyle}>
          <div style={subtitleStyle}>NOMAD AMBASSADOR CIRCLE</div>
          <h1 style={titleStyle}>
            EXCLUSIVELY PREPARED FOR {inviteData?.display_name?.toUpperCase() || 'YOU'}
          </h1>
          <p style={descriptionStyle}>
            We invite you to represent NOMAD. Build your personalized storefront, curate iconic pieces, and earn exclusive privileges.
          </p>
        </div>

        <div style={benefitsGridStyle}>
          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>01</span>
            <div style={benefitTitleStyle}>PERSONALIZED STOREFRONT</div>
            <p style={benefitDescStyle}>Your bespoke brand storefront to share directly with your audience.</p>
          </div>
          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>02</span>
            <div style={benefitTitleStyle}>EARN COMMISSIONS</div>
            <p style={benefitDescStyle}>Automated earnings on orders with real-time payout tracking.</p>
          </div>
          <div style={benefitCardStyle}>
            <span style={benefitNumberStyle}>03</span>
            <div style={benefitTitleStyle}>CURATED SELECTION</div>
            <p style={benefitDescStyle}>Curate and showcase your handpicked NOMAD collection freely.</p>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <div style={tabStyle(mode === 'signup')} onClick={() => setMode('signup')}>NEW ACCOUNT</div>
            <div style={tabStyle(mode === 'login')} onClick={() => setMode('login')}>EXISTING USER</div>
          </div>

          {isCheckingEmail && (
            <div style={infoStatusStyle}>CHECKING ACCOUNT STATUS...</div>
          )}

          {!isCheckingEmail && accountFound === true && (
            <div style={successStatusStyle}>
              ✓ EXISTING ACCOUNT DETECTED — LOG IN TO CLAIM STORE
            </div>
          )}

          {!isCheckingEmail && accountFound === false && email.includes('@') && (
            <div style={neutralStatusStyle}>
              • NEW USER DETECTED — COMPLETE SIGN UP
            </div>
          )}

          {errorMessage && (
            <div style={errorStatusStyle}>{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label style={labelStyle}>FULL NAME</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Enter full name"
                  required 
                />
              </>
            )}

            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              style={inputStyle} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@example.com"
              required 
            />

            <label style={labelStyle}>{mode === 'signup' ? 'CREATE PASSWORD' : 'PASSWORD'}</label>
            <input 
              type="password" 
              style={inputStyle} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
              minLength={6} 
            />

            <button type="submit" disabled={submitting || isCheckingEmail} style={buttonStyle}>
              {submitting 
                ? 'PROCESSING...' 
                : mode === 'signup' 
                  ? 'JOIN AS AMBASSADOR' 
                  : 'CLAIM MY STORE & UPGRADE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#030303',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: 'monospace, sans-serif',
  boxSizing: 'border-box',
};

const mainContentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const welcomeHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '3px',
  color: '#888888',
  marginBottom: '10px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  margin: '0 0 12px 0',
  lineHeight: '1.4',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaaaaa',
  lineHeight: '1.7',
  margin: '0 auto',
  maxWidth: '380px',
};

const benefitsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(1, 1fr)',
  gap: '12px',
};

const benefitCardStyle: React.CSSProperties = {
  backgroundColor: '#070707',
  border: '1px solid #141414',
  padding: '16px 20px',
  position: 'relative',
};

const benefitNumberStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#555555',
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '4px',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '1.5px',
  color: '#ffffff',
  marginBottom: '4px',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#777777',
  margin: 0,
  lineHeight: '1.5',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #1a1a1a',
  backgroundColor: '#050505',
  padding: '32px 24px',
  boxSizing: 'border-box',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  marginBottom: '20px',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid #ffffff',
  color: '#ffffff',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#888888',
  display: 'block',
  marginBottom: '4px',
  letterSpacing: '1px',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '11px',
  letterSpacing: '2px',
  marginTop: '12px',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  borderBottom: active ? '1px solid #ffffff' : '1px solid #222222',
  color: active ? '#ffffff' : '#555555',
});

const infoStatusStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#3b82f6',
  backgroundColor: 'rgba(59, 130, 246, 0.08)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  padding: '8px 10px',
  marginBottom: '18px',
  letterSpacing: '1px',
};

const successStatusStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#22c55e',
  backgroundColor: 'rgba(34, 197, 94, 0.08)',
  border: '1px solid rgba(34, 197, 94, 0.2)',
  padding: '8px 10px',
  marginBottom: '18px',
  letterSpacing: '1px',
};

const neutralStatusStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#aaa',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '8px 10px',
  marginBottom: '18px',
  letterSpacing: '1px',
};

const errorStatusStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#ef4444',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '8px 10px',
  marginBottom: '18px',
  letterSpacing: '1px',
};
