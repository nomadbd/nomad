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

        // অ্যাডমিনের দেওয়া নাম ও ইমেইল স্বয়ংক্রিয়ভাবে ইনপুট ফিল্ডে সেট করা
        if (data.display_name) {
          setFullName(data.display_name);
        }
        if (data.recipient_identifier && data.recipient_identifier.includes('@')) {
          setEmail(data.recipient_identifier);
        }

        if (isTimeExpired || data.is_registered) {
          setIsExpired(true);
          if (data.reissue_requested) {
            setReissueSubmitted(true);
          }
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
          email: email,
          password: password,
          options: {
            data: { full_name: fullName, role: 'AMBASSADOR' }
          }
        });

        if (authError || !authData.user) {
          throw new Error(authError?.message || 'SIGN UP FAILED');
        }
        userId = authData.user.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (authError || !authData.user) {
          throw new Error('INVALID EMAIL OR PASSWORD');
        }
        userId = authData.user.id;
        userEmail = authData.user.email || email;

        if (!userName) {
          const { data: prof } = await supabase.from('profiles').select('name').eq('id', userId).single();
          userName = prof?.name || userEmail.split('@')[0];
        }
      }

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: token,
        new_user_id: userId,
        user_email: userEmail,
        user_name: userName
      });

      if (rpcErr || !rpcRes?.success) {
        throw new Error(rpcRes?.message || rpcErr?.message || 'FAILED TO COMPLETE REGISTRATION');
      }

      navigate('/profile');
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
    maxWidth: '400px',
    border: '1px solid #1a1a1a',
    backgroundColor: '#050505',
    padding: '36px 30px',
    boxSizing: 'border-box',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
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
    letterSpacing: '0.5px',
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
    textTransform: 'uppercase',
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
    transition: 'all 0.2s ease',
  });

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ letterSpacing: '3px', fontSize: '10px', color: '#888888' }}>VERIFYING INVITATION...</p>
      </div>
    );
  }

  if (errorMessage && !inviteData) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h3 style={{ color: '#ef4444', marginTop: 0, fontSize: '12px', letterSpacing: '2px' }}>ACCESS DENIED</h3>
          <p style={{ color: '#888888', fontSize: '11px', letterSpacing: '0.5px' }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, letterSpacing: '2px', fontSize: '14px' }}>LINK EXPIRED</h2>
          <p style={{ color: '#888888', fontSize: '11px', lineHeight: '1.6' }}>
            This private invitation link is no longer active. You may request a renewal below.
          </p>

          {reissueSubmitted ? (
            <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', marginTop: '20px' }}>
              <p style={{ margin: 0, color: '#22c55e', fontSize: '10px', letterSpacing: '1px' }}>
                ✓ RENEWAL REQUEST SENT TO ADMIN.
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
        <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', letterSpacing: '1px', marginBottom: '24px', textTransform: 'uppercase' }}>
          WELCOME, {inviteData?.display_name || inviteData?.recipient_identifier}
        </h2>

        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={tabStyle(mode === 'signup')} onClick={() => setMode('signup')}>
            NEW ACCOUNT
          </div>
          <div style={tabStyle(mode === 'login')} onClick={() => setMode('login')}>
            EXISTING USER
          </div>
        </div>

        {errorMessage && (
          <div style={{ fontSize: '10px', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 10px', marginBottom: '18px', letterSpacing: '1px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={{ fontSize: '9px', color: '#888888', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>FULL NAME</label>
              <input
                type="text"
                style={inputStyle}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </>
          )}

          <label style={{ fontSize: '9px', color: '#888888', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>EMAIL ADDRESS</label>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={{ fontSize: '9px', color: '#888888', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>
            {mode === 'signup' ? 'CREATE PASSWORD' : 'PASSWORD'}
          </label>
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? 'PROCESSING...' : mode === 'signup' ? 'JOIN AS AMBASSADOR' : 'CLAIM MY STORE'}
          </button>
        </form>
      </div>
    </div>
  );
}
