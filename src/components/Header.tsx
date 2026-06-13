import React from 'react';

const Header: React.FC = () => {
  // আইকনের জন্য সাধারণ স্টাইল অবজেক্ট
  const iconLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s ease-in-out',
    cursor: 'pointer',
    width: '32px', // ক্লিকেবল এরিয়া বাড়ানোর জন্য
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

        {/* WhatsApp SVG - Fixed Roundness and Refined */}
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={iconLinkStyle}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          {/* এই SVG-তে আমরা circle ব্যবহার করেছি নিখুঁত গোলাকার অংশের জন্য */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* নিখুঁত গোলাকার ব্যাকগ্রাউন্ড সার্কেল */}
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.8" fill="none" />
            
            {/* WhatsApp মেসেজ টেইল এবং ভেতরের আইকনের সিম্বলিক রিপ্রেজেন্টেশন */}
            <path 
              d="M7.83 17.17L6.5 21l3.83-1.33A8.35 8.35 0 0 0 12 20.35a8.35 8.35 0 1 0-4.17-15.68"
              stroke="white" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
            {/* বিকল্প: আপনি চাইলে simple circle এবং tail ব্যবহার করতে পারেন, 
               এখানে আমি classic vector Look রাখার জন্য optimized shape ব্যবহার করেছি */}
          </svg>
        </a>
      </div>
    </header>
  );
};

export default Header;
