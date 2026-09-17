import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { AmbassadorInviteData } from '@/types/ambassador';
import { containerStyle, descStyle, underlineInputStyle, pillButtonStyle } from './styles';

interface ExpiredViewProps {
  inviteData: AmbassadorInviteData;
  isPageMounted: boolean;
  reissueSubmitted: boolean;
  setReissueSubmitted: (val: boolean) => void;
}

export const ExpiredView: React.FC<ExpiredViewProps> = ({
  inviteData,
  isPageMounted,
  reissueSubmitted,
  setReissueSubmitted
}) => {
  const [reissueMsg, setReissueMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    } catch {
      setErrorMessage('AN UNEXPECTED ERROR OCCURRED');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          transform: isPageMounted ? 'translateY(0)' : 'translateY(35px)',
          opacity: isPageMounted ? 1 : 0,
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '3px', color: '#ef4444', margin: '0 0 12px 0' }}>
          INVITATION EXPIRED
        </h2>
        <p style={descStyle}>
          This private pass key is no longer active. Submit a request to the administrator for renewal.
        </p>

        {errorMessage && (
          <p style={{ fontSize: '10px', color: '#ef4444', marginTop: '12px' }}>{errorMessage}</p>
        )}

        {reissueSubmitted ? (
          <div style={{ fontSize: '10px', color: '#22c55e', letterSpacing: '1.5px', marginTop: '20px' }}>
            ✓ RENEWAL REQUEST SENT
          </div>
        ) : (
          <form onSubmit={handleReissueRequest} style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '24px', width: '100%' }}>
              <textarea
                style={underlineInputStyle}
                placeholder="Reason for renewal request..."
                value={reissueMsg}
                onChange={(e) => setReissueMsg(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={submitting} style={pillButtonStyle}>
              {submitting ? 'SENDING...' : 'REQUEST RENEWAL'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
