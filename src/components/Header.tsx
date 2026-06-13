import React from 'react';

const Header: React.FC = () => {
  // আইকনের জন্য স্টাইল অবজেক্ট
  const iconStyle = {
    display: 'block',
    transition: 'opacity 0.2s ease-in-out',
    cursor: 'pointer'
  };

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
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
        nomad
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center' }}>
        
        {/* Mail SVG - Refined */}
        <a 
          href="mailto:nomadbysh@gmail.com" 
          style={iconStyle}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>

        {/* WhatsApp SVG - Refined */}
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={iconStyle}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8.5 8.5v.5z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
