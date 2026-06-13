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

      <div style={{ display: 'flex', flexDirection: 'row', gap: '18px', flexShrink: 0 }}>
        {/* Mail SVG - Refined */}
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block', lineHeight: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
            <polyline points="2 5 12 12 22 5" />
          </svg>
        </a>

        {/* WhatsApp SVG - Refined */}
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block', lineHeight: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 1 1-8.5-8.5" />
            <path d="M21 11.5L16 16.5" />
            <path d="M21 11.5V16.5" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
