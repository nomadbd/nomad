import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex flex-row items-center justify-between w-full px-4 py-4 bg-black border-b border-white/10" style={{ display: 'flex', flexWrap: 'nowrap' }}>
      
      {/* লোগো - flex-none ensures it doesn't shrink */}
      <div className="flex-none text-xl font-black text-white uppercase italic tracking-tighter">
        nomad
      </div>

      {/* আইকন সেকশন - ml-auto pushes it to the right */}
      <div className="flex flex-none flex-row items-center gap-6 ml-auto">
        <a href="mailto:nomadbysh@gmail.com" className="text-white/60 hover:text-white transition-all">
          <Mail size={22} />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all">
          <MessageCircle size={22} />
        </a>
      </div>
    </header>
  );
};

export default Header;
