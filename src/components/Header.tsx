import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="!flex !flex-row items-center justify-between w-full px-4 py-4 bg-black border-b border-white/10">
      <div className="text-xl font-black tracking-tighter text-white uppercase italic">
        nomad
      </div>

      <div className="!flex !flex-row items-center gap-4">
        <a href="mailto:nomadbysh@gmail.com" className="text-white/60 hover:text-white">
          <Mail size={22} />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">
          <MessageCircle size={22} />
        </a>
      </div>
    </header>
  );
};

export default Header;
