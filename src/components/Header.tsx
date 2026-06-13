import React from 'react';
import MailIcon from './icon/MailIcon';
import WhatsAppIcon from './icon/WhatsAppIcon';

const Header: React.FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-4 py-4 bg-black border-b border-white/10 shrink-0">
      {/* লোগো - এখানে min-w-0 ব্যবহার করা হয়েছে যাতে বড় টেক্সট কন্টেইনার না ভাঙে */}
      <div className="min-w-0 pr-4">
        <div className="text-2xl font-black text-white uppercase italic tracking-tighter truncate">
          nomad
        </div>
      </div>

      {/* আইকন কন্টেইনার - flex-shrink-0 নিশ্চিত করে যে আইকনগুলো ছোট হবে না */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <a href="mailto:nomadbysh@gmail.com" className="text-white flex items-center hover:opacity-80 transition-opacity">
          <MailIcon size={24} color="white" />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white flex items-center hover:opacity-80 transition-opacity">
          <WhatsAppIcon size={24} color="white" />
        </a>
      </div>
    </header>
  );
};

export default Header;
