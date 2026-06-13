import React from 'react';

interface HeaderProps {
  onSearchOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchOpen }) => {
  return (
    <header 
      style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '16px 20px', backgroundColor: 'black', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>
        nomad
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* সার্চ আইকন - শার্প */}
        <button onClick={onSearchOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="white" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  <path d="m21 21-4.34-4.34"/>
  <circle cx="11" cy="11" r="8"/>
</svg>


        </button>

        {/* মেইল আইকন - আগের বোল্ড ভার্সন */}
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block' }}>

          <svg 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="white" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
  <rect x="2" y="4" width="20" height="16" rx="2"/>
</svg>


        </a>

        {/* হোয়াটসঅ্যাপ আইকন - আগের বোল্ড ভার্সন */}
        <a 
  href="https://wa.me/8801521731371" 
  target="_blank" 
  rel="noopener noreferrer" 
  style={{ display: 'block', lineHeight: 0 }}
>
  <svg 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="white" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>
</svg>

</a>


      </div>
    </header>
  );
};

export default Header;
