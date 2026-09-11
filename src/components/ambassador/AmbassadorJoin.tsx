import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

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

  const rawDisplayName = inviteData?.display_name || 'GUEST';
  const headerDisplayName = rawDisplayName.toUpperCase();
  const defaultTitleName = toTitleCase(rawDisplayName);

  // কমিশন ও ডিসকাউন্ট ডাটা (প্রয়োজনে ডায়নামিক করা যাবে)
  const commissionRate = inviteData?.commission_rate || '15%';
  const guestDiscount = inviteData?.guest_discount || '10%';

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!inviteData) return;

    const isTimeExpired = new Date(inviteData.expires_at) < new Date();

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
      let userName = fullName.trim() ? toTitleCase(fullName.trim()) : defaultTitleName;

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
        <div style={{ ...cardStyle, maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 300, letterSpacing: '3px', color: '#ef4444', margin: '0 0 12px 0' }}>
            INVITATION EXPIRED
          </h2>
          <p style={{ color: '#666', fontSize: '12px', lineHeight: '1.7', margin: 0, fontWeight: 300 }}>
            This private pass key is no longer active. Submit a request to the administrator for renewal.
          </p>

          {reissueSubmitted ? (
            <div style={statusBannerStyle('#22c55e')}>
              ✓ RENEWAL REQUEST SENT
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <textarea
                  style={{
                    ...underlineInputStyle,
                    minHeight: '60px',
                    resize: 'none',
                    borderColor: focusedInput === 'reissue' ? '#ffffff' : 'rgba(255,255,255,0.15)'
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
      <div style={bgAmbientStyle} />

      <div style={mainContentWrapperStyle}>
        
        {/* Title Block */}
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

        {/* Clean Minimal Benefits & Privileges Block */}
        <div style={{ ...benefitsGridStyle, ...getFadeStyle(mounted) }}>
          <div style={benefitCardStyle}>
            <div style={benefitHeaderRowStyle}>
              <span style={benefitTitleStyle}>CURATED ALLOCATION</span>
              <span style={benefitTagStyle}>PRIVATE GALLERY</span>
            </div>
            <p style={benefitDescStyle}>Select products from our high-tier ambassador allocation to feature in your personal portfolio.</p>
          </div>

          <div style={benefitCardStyle}>
            <div style={benefitHeaderRowStyle}>
              <span style={benefitTitleStyle}>DIRECT COMMISSION</span>
              <span style={benefitHighlightTagStyle}>{commissionRate} PAYOUT</span>
            </div>
            <p style={benefitDescStyle}>Earn a baseline {commissionRate} commission on every successful sale generated via your exclusive link.</p>
          </div>

          <div style={benefitCardStyle}>
            <div style={benefitHeaderRowStyle}>
              <span style={benefitTitleStyle}>GUEST PASS PRIVILEGE</span>
              <span style={benefitTagStyle}>{guestDiscount} OFF CODE</span>
            </div>
            <p style={benefitDescStyle}>Offer your audience a complimentary {guestDiscount} discount on their orders with your custom privilege pass.</p>
          </div>
        </div>

        {/* Form Card */}
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
            {isCheckingEmail && <span style={{ color: '#3b82f6' }}>VERIFYING ACCOUNT...</span>}
            {!isCheckingEmail && accountFound === true && <span style={{ color: '#22c55e' }}>✓ EXISTING ACCOUNT DETECTED</span>}
            {errorMessage && <span style={{ color: '#ef4444' }}>{errorMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{
              maxHeight: mode === 'signup' ? '55px' : '0px',
              opacity: mode === 'signup' ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              pointerEvents: mode === 'signup' ? 'auto' : 'none',
            }}>
              <div style={inputWrapperStyle}>
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
                  placeholder={defaultTitleName || "Full Name"}
                />
              </div>
            </div>

            <div style={inputWrapperStyle}>
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
            </div>

            <div style={inputWrapperStyle}>
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
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={buttonStyle}>
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
  );
}

// ---------------- STYLES (WITH RESPONSIVE CLAMPS) ----------------

const getFadeStyle = (mounted: boolean): React.CSSProperties => ({
  opacity: mounted ? 1 : 0,
  transform: mounted ? 'translateY(0px)' : 'translateY(20px)',
  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
});

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(30px, 6vh, 60px) 20px', // স্কেলিং লিমিট
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
  position: 'relative',
  overflowY: 'auto',
};

const bgAmbientStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '350px',
  height: '350px',
  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 75%)',
  pointerEvents: 'none',
  zIndex: 0,
};

const mainContentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px', // চওড়ায় লিমিট
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(20px, 4vh, 32px)', // ভার্টিক্যাল গ্যাপের রেসপন্সিভ সীমা
  position: 'relative',
  zIndex: 1,
};

const welcomeTitleStyle: React.CSSProperties = {
  fontSize: 'clamp(20px, 5vw, 26px)', // ফন্ট লিমিট: সর্বনিম্নে ২০px, সর্বোচ্চ ২৬px
  fontWeight: 200,
  letterSpacing: '4px',
  margin: '0 0 8px 0',
  lineHeight: '1.25',
  color: '#888888',
};

const nameSpanStyle: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 400,
  letterSpacing: '3px',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 'clamp(11px, 3vw, 12.5px)',
  color: '#666666',
  lineHeight: '1.6',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.2px',
};

const benefitsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

// বাম পাশের বর্ডার রিমুভ করে স্পেস-সেভিং কন্টেইনার
const benefitCardStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const benefitHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
};

const benefitTagStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 500,
  letterSpacing: '1.5px',
  color: '#666666',
};

const benefitHighlightTagStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  color: '#ffffff',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  padding: '2px 6px',
  borderRadius: '2px',
};

const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#777777',
  margin: 0,
  lineHeight: '1.5',
  fontWeight: 300,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '12px',
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  color: active ? '#ffffff' : '#333333',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? '1.5px solid #ffffff' : '1.5px solid transparent',
  marginBottom: '-1px',
  transition: 'color 0.25s ease, border-color 0.25s ease',
  outline: 'none',
});

const statusContainerStyle: React.CSSProperties = {
  minHeight: '18px',
  fontSize: '9.5px',
  letterSpacing: '1px',
  fontWeight: 500,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '8px',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
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
  padding: '15px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '1px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '10.5px',
  letterSpacing: '3px',
  marginTop: '8px',
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
