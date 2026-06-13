import React from 'react';
import MailIcon from './icon/MailIcon';
import WhatsAppIcon from './icon/WhatsAppIcon';

const Header: React.FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-4 py-4 bg-black border-b border-white/10 flex-nowrap overflow-hidden">
      {/* লোগো */}
      <div className="text-2xl font-black text-white uppercase italic tracking-tighter whitespace-nowrap">
        nomad
      </div>

      {/* আইকন কন্টেইনার - আইকনগুলো যেন কোনোভাবেই নিচে না নামে */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <a href="mailto:nomadbysh@gmail.com" className="text-white block">
          <MailIcon size={24} color="white" />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" className="text-white block">
          <WhatsAppIcon size={24} color="white" />
        </a>
      </div>
    </header>
  );
};

export default Header;
