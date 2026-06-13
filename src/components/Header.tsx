import React from 'react';
import MailIcon from './icon/MailIcon';
import WhatsAppIcon from './icon/WhatsAppIcon';

const Header: React.FC = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-6 bg-black border-b border-white/10">
      <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
        nomad
      </h1>

      <div className="flex items-center gap-6">
        <a href="mailto:nomadbysh@gmail.com">
          <MailIcon size={28} color="white" />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={28} color="white" />
        </a>
      </div>
    </header>
  );
};

export default Header;
