import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-black border-b border-white/10 px-6 py-4">
      <div className="grid grid-cols-2 items-center w-full">
        
        {/* লোগো - বাম কলাম */}
        <div className="text-2xl font-black text-white uppercase italic tracking-tighter">
          nomad
        </div>

        {/* আইকন - ডান কলাম */}
        <div className="flex items-center justify-end gap-6 text-white">
          <a href="mailto:nomadbysh@gmail.com" className="hover:text-gray-300 transition-colors">
            <Mail size={24} stroke="currentColor" />
          </a>
          <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
            <MessageCircle size={24} stroke="currentColor" />
          </a>
        </div>

      </div>
    </header>
  );
};

export default Header;
