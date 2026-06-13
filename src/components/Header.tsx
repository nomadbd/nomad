import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between w-full px-4 md:px-8 py-6 bg-black border-b border-white/10 gap-8">
      {/* লোগো - প্রিমিয়াম টাইপোগ্রাফি */}
      <div className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic whitespace-nowrap">
        nomad
      </div>

      {/* আইকন সেকশন - মিনিমাল এবং সাদা */}
      <div className="flex items-center gap-4 md:gap-6">
        <a 
          href="mailto:nomadbysh@gmail.com" 
          className="text-white transition-all duration-300 hover:text-white/80 hover:scale-110 p-2 rounded-lg hover:bg-white/5"
          aria-label="Email"
        >
          <Mail size={22} strokeWidth={1.5} />
        </a>
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white transition-all duration-300 hover:text-white/80 hover:scale-110 p-2 rounded-lg hover:bg-white/5"
          aria-label="WhatsApp"
        >
          <MessageCircle size={22} strokeWidth={1.5} />
        </a>
      </div>
    </header>
  );
};

export default Header;
