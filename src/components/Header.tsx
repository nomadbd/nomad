import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4 bg-black border-b border-white/10" style={{ flexDirection: 'row !important', display: 'flex !important' }}>
      <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
        nomad
      </h1>

      <div className="flex items-center gap-6" style={{ flexDirection: 'row !important', display: 'flex !important' }}>
        <a href="mailto:nomadbysh@gmail.com" className="text-white">
          <Mail size={24} />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white">
          <MessageCircle size={24} />
        </a>
      </div>
    </header>
  );
};

export default Header;
