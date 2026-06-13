import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between w-full">
        
        {/* লোগো */}
        <div className="text-2xl font-black text-white uppercase italic tracking-tighter">
          nomad
        </div>

        {/* আইকন সেকশন - সরাসরি SVG ব্যবহার করা হয়েছে */}
        <div className="flex items-center gap-6">
          {/* Email Icon */}
          <a href="mailto:nomadbysh@gmail.com" className="text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </a>

          {/* WhatsApp Icon */}
          <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
