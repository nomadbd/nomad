import React from 'react';

interface JoinFooterProps {
  handleOpenConcierge: () => void;
  hasUnread: boolean;
}

export const JoinFooter: React.FC<JoinFooterProps> = ({ handleOpenConcierge, hasUnread }) => {
  return (
    <div style={footerStyle}>
      <div style={footerLinksContainerStyle}>
        <button 
          type="button" 
          onClick={handleOpenConcierge} 
          style={{
            ...footerLinkStyle,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          CONCIERGE
          {hasUnread && (
            <span 
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 6px #ef4444'
              }} 
            />
          )}
        </button>
        <span style={dotStyle}>•</span>
        <a href="/terms" style={footerLinkStyle}>TERMS</a>
        <span style={dotStyle}>•</span>
        <a href="/privacy" style={footerLinkStyle}>PRIVACY POLICY</a>
      </div>
      <p style={{ color: '#555555', fontSize: '8px', letterSpacing: '2px', margin: 0, fontWeight: 300 }}>
        © 2026 NOMAD. ALL RIGHTS RESERVED.
      </p>
    </div>
  );
};

const footerStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const footerLinksContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'nowrap'
};

const footerLinkStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '9px',
  letterSpacing: '1.2px',
  textDecoration: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  whiteSpace: 'nowrap'
};

const dotStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.2)',
  fontSize: '8px'
};
