import React from 'react';

const Header: React.FC = () => {
  // আইকনের স্টাইলগুলো আলাদা করে রাখা ভালো
  const iconStyle: React.CSSProperties = {
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    cursor: 'pointer',
    opacity: 0.8,
  };

  const onHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = 'scale(1.1)';
  };

  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.opacity = '0.8';
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <header 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 40px', 
        backgroundColor: '#000', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>
        NOMAD
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <a 
          href="mailto:nomadbysh@gmail.com" 
          style={{ ...iconStyle, display: 'flex' }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>

        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ ...iconStyle, display: 'flex' }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8.5 8.5v.5z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
