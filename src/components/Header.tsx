import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
      <div className="text-2xl font-bold tracking-tighter text-gray-900 uppercase">
        nomad
      </div>
      
      <div className="flex items-center gap-4">
        <a 
          href="mailto:nomadbysh@gmail.com" 
          className="p-2 transition-all border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 hover:text-black"
          aria-label="Email"
        >
          <Mail size={20} />
        </a>
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 transition-all border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 hover:text-green-600"
          aria-label="WhatsApp"
        >
          <MessageCircle size={20} />
        </a>
      </div>
    </header>
  );
};

export default Header;
