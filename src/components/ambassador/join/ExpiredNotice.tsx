import React from 'react';

interface ExpiredNoticeProps {
  isPageMounted: boolean;
  reissueSubmitted: boolean;
  reissueMsg: string;
  setReissueMsg: (val: string) => void;
  handleReissueRequest: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const ExpiredNotice: React.FC<ExpiredNoticeProps> = ({
  isPageMounted,
  reissueSubmitted,
  reissueMsg,
  setReissueMsg,
  handleReissueRequest,
  submitting
}) => {
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
        <p style={{ fontSize: '12px', color: '#bbbbbb', lineHeight: '1.6', margin: 0, fontWeight: 300 }}>
          This private pass key is no longer active. Submit a request to the administrator for renewal.
        </p>

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

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box'
};

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  letterSpacing: '0.5px',
  outline: 'none',
  boxSizing: 'border-box'
};

const pillButtonStyle: React.CSSProperties = {
  padding: '12px 32px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '9999px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '10px',
  letterSpacing: '2.5px',
  outline: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease, opacity 0.15s ease',
  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)'
};
