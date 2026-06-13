import React from 'react';

const Header: React.FC = () => {
  return (
    <header 
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px', 
        backgroundColor: 'black', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase', flexShrink: 1, overflow: 'hidden' }}>
        nomad
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexShrink: 0 }}>
        {/* Mail SVG - Minimalistic & Balanced */}
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block', opacity: 0.8, transition: 'opacity 0.2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>

        {/* WhatsApp SVG - Smooth & Premium */}
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block', opacity: 0.8, transition: 'opacity 0.2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v-1.17c0-1.17-.63-2.25-1.65-2.81l-2.07-1.13c-.48-.26-1.07-.26-1.55 0l-1.37.75c-.34.18-.75.18-1.09 0l-6.27-3.41c-.34-.19-.57-.54-.62-.93l-.22-1.37c-.08-.5.1-1.01.48-1.38l1.45-1.45c.42-.42.42-1.1 0-1.52L6.15 1.76c-.42-.42-1.1-.42-1.52 0L2.1 3.29C.85 4.54.85 6.58 2.1 7.83l7.07 7.07c1.25 1.25 3.29 1.25 4.54 0l1.17-1.17c.42-.42 1.1-.42 1.52 0l1.45 1.45c.37.37.55.88.48 1.38z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
