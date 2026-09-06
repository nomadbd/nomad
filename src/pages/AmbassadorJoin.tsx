import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AmbassadorJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Support both short '?t=' and legacy '?token='
  const token = searchParams.get('t') || searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mode: 'signup' (New Account) or 'login' (Account Upgrade)
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reissueMsg, setReissueMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reissueSubmitted, setReissueSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('No invitation token provided.');
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
          setErrorMessage('Invalid or expired invitation link.');
          setLoading(false);
          return;
        }

        const isTimeExpired = new Date(data.expires_at) < new Date();
        if (isTimeExpired || data.is_registered) {
          setIsExpired(true);
          setInviteData(data);
          if (data.reissue_requested) {
            setReissueSubmitted(true);
          }
        } else {
          setInviteData(data);
        }
      } catch (err) {
        setErrorMessage('Failed to validate invitation.');
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
        // 1. Create New Account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: fullName, role: 'AMBASSADOR' }
          }
        });

        if (authError || !authData.user) {
          throw new Error(authError?.message || 'Sign up failed.');
        }
        userId = authData.user.id;
      } else {
        // 2. Existing Customer Login (Account Upgrade)
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (authError || !authData.user) {
          throw new Error('Invalid email or password.');
        }
        userId = authData.user.id;
        userEmail = authData.user.email || email;
        
        // Fetch existing name if full name input is blank
        if (!userName) {
          const { data: prof } = await supabase.from('profiles').select('name').eq('id', userId).single();
          userName = prof?.name || userEmail.split('@')[0];
        }
      }

      // 3. Upgrade Role to AMBASSADOR via RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: token,
        new_user_id: userId,
        user_email: userEmail,
        user_name: userName
      });

      if (rpcErr || !rpcRes?.success) {
        throw new Error(rpcRes?.message || rpcErr?.message || 'Failed to complete registration.');
      }

      navigate('/profile');
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong.');
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
        setErrorMessage(data?.message || 'Failed to submit request.');
      } else {
        setReissueSubmitted(true);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
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
    fontFamily: "'Inter', sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #222',
    backgroundColor: '#0a0a0a',
    padding: '28px',
    borderRadius: '8px',
    boxSizing: 'border-box',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#141414',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: '4px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
    letterSpacing: '1px',
    marginTop: '10px'
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    borderBottom: active ? '2px solid #fff' : '2px solid #222',
    color: active ? '#fff' : '#666',
    transition: 'all 0.2s ease',
  });

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ letterSpacing: '2px', fontSize: '12px', color: '#888' }}>VERIFYING LINK...</p>
      </div>
    );
  }

  if (errorMessage && !inviteData) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h3 style={{ color: '#ff4d4d', marginTop: 0 }}>Access Denied</h3>
          <p style={{ color: '#aaa', fontSize: '14px' }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, letterSpacing: '1px', fontSize: '20px' }}>LINK EXPIRED</h2>
          <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
            This invitation link is no longer active. Request a renewal below.
          </p>

          {reissueSubmitted ? (
            <div style={{ padding: '14px', backgroundColor: '#112211', border: '1px solid #225522', borderRadius: '4px', marginTop: '16px' }}>
              <p style={{ margin: 0, color: '#4edf4e', fontSize: '13px' }}>
                ✓ Renewal request sent to admin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '20px' }}>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
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
        <div style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '3px', color: '#888', marginBottom: '6px' }}>
          Exclusive VIP Invitation
        </div>
        <h2 style={{ marginTop: 0, fontSize: '20px', fontWeight: '500', letterSpacing: '1px' }}>
          WELCOME, {inviteData?.recipient_identifier}
        </h2>

        {inviteData?.initial_admin_message && (
          <div style={{ padding: '12px', backgroundColor: '#141414', borderLeft: '2px solid #fff', marginBottom: '20px', fontSize: '13px', color: '#ccc' }}>
            "{inviteData.initial_admin_message}"
          </div>
        )}

        {/* Tab Switcher: Sign Up vs Account Upgrade */}
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <div style={tabStyle(mode === 'signup')} onClick={() => setMode('signup')}>
            NEW ACCOUNT
          </div>
          <div style={tabStyle(mode === 'login')} onClick={() => setMode('login')}>
            EXISTING USER
          </div>
        </div>

        {errorMessage && (
          <p style={{ color: '#ff4d4d', fontSize: '13px', marginBottom: '16px' }}>{errorMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
              <input
                type="text"
                style={inputStyle}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </>
          )}

          <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS</label>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
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
            {submitting ? 'PROCESSING...' : mode === 'signup' ? 'JOIN AS AMBASSADOR' : 'UPGRADE MY ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
