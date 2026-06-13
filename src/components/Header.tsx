import React from 'react';

const Header: React.FC = () => {
  return (
    <header 
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 20px', 
        backgroundColor: 'transparent', 
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* লোগো বা টেক্সট */}
      <div style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: 'white', 
        letterSpacing: '2px' 
      }}>
        NOMAD
      </div>

      {/* আইকন সেকশন */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
        
        {/* Mail Icon */}
        <a href="mailto:nomadbysh@gmail.com" style={{ opacity: 0.7, transition: 'opacity 0.3s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>

        {/* WhatsApp Icon */}
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7, transition: 'opacity 0.3s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
