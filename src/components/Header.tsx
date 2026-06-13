import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex flex-row items-center justify-between w-full px-6 py-4 bg-black border-b border-white/10">
      {/* লোগো বাম পাশে */}
      <div className="text-2xl font-black text-white uppercase italic tracking-tighter">
        nomad
      </div>

      {/* আইকনগুলো ডান পাশে */}
      <div className="flex flex-row items-center gap-6">
        <a href="mailto:nomadbysh@gmail.com" className="text-white/60 hover:text-white transition-all">
          <Mail size={24} />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all">
          <MessageCircle size={24} />
        </a>
      </div>
    </header>
  );
};

export default Header;
