import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AmbassadorJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [reissueMsg, setReissueMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reissueSubmitted, setReissueSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('No invite token provided.');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create Supabase Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${inviteData.assigned_slug.toLowerCase()}@ambassador.brand`, // Or dynamic input
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'ambassador',
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Registration failed');
      }

      // 2. Update Ambassador Record
      const { error: updateError } = await supabase
        .from('ambassador')
        .update({
          user_id: authData.user.id,
          is_registered: true,
          registered_at: new Date().toISOString(),
        })
        .eq('id', inviteData.id);

      if (updateError) throw updateError;

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
    padding: '24px',
    fontFamily: 'sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '440px',
    border: '1px solid #222',
    backgroundColor: '#0a0a0a',
    padding: '32px',
    borderRadius: '8px',
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
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>VALIDATING VIP INVITATION...</p>
      </div>
    );
  }

  if (errorMessage && !inviteData) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ color: '#ff4d4d', marginTop: 0 }}>Access Denied</h2>
          <p style={{ color: '#aaa' }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, letterSpacing: '1px' }}>LINK EXPIRED</h2>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
            This invitation token is no longer active. You may request a one-time link extension from the concierge.
          </p>

          {reissueSubmitted ? (
            <div style={{ padding: '16px', backgroundColor: '#112211', border: '1px solid #225522', borderRadius: '4px', marginTop: '16px' }}>
              <p style={{ margin: 0, color: '#4edf4e', fontSize: '14px' }}>
                ✓ Request submitted. Our team will review your message shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReissueRequest} style={{ marginTop: '20px' }}>
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                placeholder="Reason for requesting re-activation..."
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
        <div style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '3px', color: '#888', marginBottom: '8px' }}>
          Exclusive Invitation
        </div>
        <h1 style={{ marginTop: 0, fontSize: '24px', fontWeight: 'normal', letterSpacing: '1px' }}>
          WELCOME, {inviteData?.recipient_identifier}
        </h1>

        {inviteData?.initial_admin_message && (
          <div style={{ padding: '12px', backgroundColor: '#141414', borderLeft: '2px solid #fff', marginBottom: '24px', fontSize: '13px', color: '#ccc' }}>
            "{inviteData.initial_admin_message}"
          </div>
        )}

        {errorMessage && (
          <p style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{errorMessage}</p>
        )}

        <form onSubmit={handleRegister}>
          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
          <input
            type="text"
            style={inputStyle}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>CREATE PASSWORD</label>
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button type="submit" disabled={submitting} style={{ ...buttonStyle, marginTop: '8px' }}>
            {submitting ? 'ACTIVATING...' : 'ACCEPT & JOIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
