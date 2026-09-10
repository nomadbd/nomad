import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

export default function AmbassadorJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reissueMsg, setReissueMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reissueSubmitted, setReissueSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('NO INVITATION TOKEN PROVIDED');
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const { data, error } = await supabase
          .from('ambassador')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !data) {
          setErrorMessage('INVALID OR EXPIRED INVITATION LINK');
          setLoading(false);
          return;
        }

        const isTimeExpired = new Date(data.expires_at) < new Date();
        setInviteData(data);

        if (data.display_name) setFullName(data.display_name);
        if (data.recipient_identifier && data.recipient_identifier.includes('@')) {
          setEmail(data.recipient_identifier);
        }

        if (isTimeExpired || data.is_registered) {
          setIsExpired(true);
          if (data.reissue_requested) setReissueSubmitted(true);
        }
      } catch (err) {
        setErrorMessage('FAILED TO VALIDATE INVITATION');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || submitting || !token) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      let userId = '';
      let userEmail = email;
      let userName = fullName;

      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role: 'AMBASSADOR' } }
        });

        if (authError || !authData.user) throw new Error(authError?.message || 'SIGN UP FAILED');
        userId = authData.user.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError || !authData.user) throw new Error('INVALID EMAIL OR PASSWORD');
        userId = authData.user.id;
        userEmail = authData.user.email || email;
      }

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: token,
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
    if (!token || !reissueMsg.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('request_ambassador_invite_reissue', {
        invite_token: token,
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

  if (loading) return null;

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, letterSpacing: '2px', fontSize: '14px' }}>LINK EXPIRED</h2>
          <p style={{ color: '#888888', fontSize: '11px', lineHeight: '1.6' }}>
            This invitation link is no longer active. Request a renewal below.
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
      <div style={cardStyle}>
        <div style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '3px', color: '#888888', marginBottom: '8px' }}>
          NOMAD AMBASSADOR CIRCLE
        </div>
        <h2 style={{ marginTop: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '1px', marginBottom: '24px', textTransform: 'uppercase' }}>
          WELCOME, {inviteData?.display_name || 'AMBASSADOR'}
        </h2>

        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={tabStyle(mode === 'signup')} onClick={() => setMode('signup')}>NEW ACCOUNT</div>
          <div style={tabStyle(mode === 'login')} onClick={() => setMode('login')}>EXISTING USER</div>
        </div>

        {errorMessage && (
          <div style={{ fontSize: '10px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 10px', marginBottom: '18px', letterSpacing: '1px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>FULL NAME</label>
              <input type="text" style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </>
          )}

          <label style={labelStyle}>EMAIL ADDRESS</label>
          <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label style={labelStyle}>{mode === 'signup' ? 'CREATE PASSWORD' : 'PASSWORD'}</label>
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? 'PROCESSING...' : mode === 'signup' ? 'JOIN AS AMBASSADOR' : 'CLAIM MY STORE'}
          </button>
        </form>
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
  padding: '20px',
  fontFamily: 'monospace, sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
  border: '1px solid #1a1a1a',
  backgroundColor: '#050505',
  padding: '36px 28px',
  boxSizing: 'border-box',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
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
