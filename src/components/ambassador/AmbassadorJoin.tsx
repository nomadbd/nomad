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
        <div style={bgGlowStyle} />
        <div style={expiredCardStyle}>
          <div style={badgeStyle('#ef4444')}>
            <span style={dotStyle('#ef4444')} />
            INVITATION EXPIRED
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', margin: '16px 0 8px 0', color: '#fff' }}>
            Link No Longer Active
          </h2>
          <p style={{ color: '#86868b', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            This VIP invitation link has reached its expiration window. You can request an updated invitation key directly from the administrator.
          </p>

          {reissueSubmitted ? (
            <div style={statusBannerStyle('#22c55e', 'rgba(34, 197, 94, 0.08)', 'rgba(34, 197, 94, 0.2)', '20px')}>
              ✓ RENEWAL REQUEST SENT TO ADMIN
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '24px' }}>
              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label style={labelStyle}>REQUEST MESSAGE</label>
                <textarea
                  style={textareaStyle}
                  placeholder="State your reason or leave a note for the admin..."
                  value={reissueMsg}
                  onChange={(e) => setReissueMsg(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} style={buttonStyle}>
                {submitting ? 'SENDING REQUEST...' : 'REQUEST NEW LINK'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Background Ambient Light */}
      <div style={bgGlowStyle} />

      <div style={mainContentWrapperStyle}>
        {/* Apple Style Welcome Header */}
        <div style={welcomeHeaderStyle}>
          <div style={badgeStyle('#ffffff')}>
            <span style={dotStyle('#22c55e')} />
            VIP AMBASSADOR INVITATION
          </div>

          <h1 style={titleStyle}>
            Prepared Exclusively for{' '}
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {inviteData?.display_name || 'You'}
            </span>
          </h1>

          <p style={descriptionStyle}>
            Represent NOMAD. Build your bespoke storefront, curate iconic pieces, and join our global private partner network.
          </p>
        </div>

        {/* Benefits Grid - Clean Minimal Cards */}
        <div style={benefitsGridStyle}>
          <div style={benefitCardStyle}>
            <div style={benefitHeaderStyle}>
              <span style={benefitNumberStyle}>01</span>
              <span style={benefitTitleStyle}>Bespoke Storefront</span>
            </div>
            <p style={benefitDescStyle}>Your branded destination to share collections directly with your community.</p>
          </div>

          <div style={benefitCardStyle}>
            <div style={benefitHeaderStyle}>
              <span style={benefitNumberStyle}>02</span>
              <span style={benefitTitleStyle}>Automated Commissions</span>
            </div>
            <p style={benefitDescStyle}>Real-time tracking on orders with automated payout reporting.</p>
          </div>

          <div style={benefitCardStyle}>
            <div style={benefitHeaderStyle}>
              <span style={benefitNumberStyle}>03</span>
              <span style={benefitTitleStyle}>Curated Access</span>
            </div>
            <p style={benefitDescStyle}>Handpick products, access early drops, and set up custom offer links.</p>
          </div>
        </div>

        {/* Form Card */}
        <div style={cardStyle}>
          {/* Segmented Controller (Apple style tabs) */}
          <div style={segmentedControlStyle}>
            <button 
              type="button" 
              style={tabButtonStyle(mode === 'signup')} 
              onClick={() => setMode('signup')}
            >
              New Account
            </button>
            <button 
              type="button" 
              style={tabButtonStyle(mode === 'login')} 
              onClick={() => setMode('login')}
            >
              Existing User
            </button>
          </div>

          {/* Account Status Indicators */}
          {isCheckingEmail && (
            <div style={statusBannerStyle('#3b82f6', 'rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.2)', '0 0 20px 0')}>
              Verifying account status...
            </div>
          )}

          {!isCheckingEmail && accountFound === true && (
            <div style={statusBannerStyle('#22c55e', 'rgba(34, 197, 94, 0.08)', 'rgba(34, 197, 94, 0.2)', '0 0 20px 0')}>
              ✓ Account detected — Log in to claim store
            </div>
          )}

          {!isCheckingEmail && accountFound === false && email.includes('@') && (
            <div style={statusBannerStyle('#a1a1aa', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.1)', '0 0 20px 0')}>
              • New user detected — Complete sign up
            </div>
          )}

          {errorMessage && (
            <div style={statusBannerStyle('#ef4444', 'rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.2)', '0 0 20px 0')}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="e.g. Alex Morgan"
                  required 
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input 
                type="email" 
                style={inputStyle} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com"
                required 
              />
            </div>

            <div>
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
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={buttonStyle}>
              {submitting 
                ? 'Processing...' 
                : mode === 'signup' 
                  ? 'Join as Ambassador' 
                  : 'Claim Store & Upgrade'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------------- STYLES (Apple & Google Design Systems Inspired) ----------------

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#f5f5f7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};

const bgGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '600px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 70%)',
  pointerEvents: 'none',
  zIndex: 0,
};

const mainContentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  position: 'relative',
  zIndex: 1,
};

const welcomeHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const badgeStyle = (textColor: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: '99px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: textColor,
  marginBottom: '20px',
});

const dotStyle = (color: string): React.CSSProperties => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: color,
  boxShadow: `0 0 8px ${color}`,
});

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 500,
  letterSpacing: '-0.03em',
  margin: '0 0 12px 0',
  lineHeight: '1.25',
  color: '#86868b',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#86868b',
  lineHeight: '1.6',
  margin: '0 auto',
  maxWidth: '400px',
  fontWeight: 400,
};

const benefitsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const benefitCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '16px',
  padding: '16px 20px',
  backdropFilter: 'blur(20px)',
};

const benefitHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '4px',
};

const benefitNumberStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6e6e73',
  letterSpacing: '0.05em',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: '#f5f5f7',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#86868b',
  margin: 0,
  lineHeight: '1.5',
  paddingLeft: '24px',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  backgroundColor: 'rgba(18, 18, 18, 0.75)',
  backdropFilter: 'blur(30px)',
  padding: '32px 28px',
  boxSizing: 'border-box',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
};

const expiredCardStyle: React.CSSProperties = {
  ...cardStyle,
  maxWidth: '420px',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
};

const segmentedControlStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: '12px',
  padding: '3px',
  marginBottom: '24px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: active ? 600 : 400,
  color: active ? '#ffffff' : '#86868b',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
  border: 'none',
  borderRadius: '9px',
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  outline: 'none',
});

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#86868b',
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.08em',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '13px',
  letterSpacing: '-0.01em',
  marginTop: '8px',
  transition: 'transform 0.15s ease, opacity 0.2s ease',
};

const statusBannerStyle = (
  color: string,
  bgColor: string,
  borderColor: string,
  margin: string
): React.CSSProperties => ({
  fontSize: '12px',
  color,
  backgroundColor: bgColor,
  border: `1px solid ${borderColor}`,
  borderRadius: '12px',
  padding: '10px 14px',
  margin,
  letterSpacing: '-0.01em',
  fontWeight: 500,
  textAlign: 'center',
});
