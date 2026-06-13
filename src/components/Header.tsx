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
        {/* Mail SVG - Refined */}
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" ry="3" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </a>

        {/* WhatsApp SVG - Refined and Smoother */}
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 1 1-6.5-8.25L21 4.5l-1.25 5.5z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
