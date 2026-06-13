import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4 bg-black border-b border-white/10">
      <div className="text-2xl font-black text-white uppercase italic tracking-tighter">
        nomad
      </div>

      <div className="flex items-center gap-6">
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
