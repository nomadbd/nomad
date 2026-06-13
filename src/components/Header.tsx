import React from 'react';

const Header: React.FC = () => {
  // আইকনের জন্য সাধারণ স্টাইল অবজেক্ট
  const iconLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s ease-in-out',
    cursor: 'pointer',
    width: '32px', // ক্লিকেবল এরিয়া বাড়ানো হয়েছে
    height: '32px'
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
      {/* Brand Logo - Added subtle letter spacing for premium look */}
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        nomad
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
        
        {/* Mail SVG - Refined and Balanced */}
        <a 
          href="mailto:nomadbysh@gmail.com" 
          style={iconLinkStyle}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>

        {/* WhatsApp SVG - Standard Icon with Rounded Body and Tail */}
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={iconLinkStyle}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          {/* এই SVG-তে আমরা একটি সার্কেল এবং একটি পাথ ব্যবহার করেছি যাতে এটি সম্পূর্ণ WhatsApp আইকন হয় */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* নিখুঁত গোলাকার বডি */}
            <circle cx="12" cy="11.5" r="9" stroke="white" strokeWidth="1.8" />
            {/* নিচের দিকের টেইল (Tail) */}
            <path d="M12 21.5l-3.5-3.5" stroke="white" strokeWidth="1.8" />
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
