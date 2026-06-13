import React from 'react';
import MailIcon from './icon/MailIcon';
import WhatsAppIcon from './icon/WhatsAppIcon';

const Header: React.FC = () => {
  return (
    <header 
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px', 
        backgroundColor: 'black', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase', fontStyle: 'italic', flexShrink: 1, overflow: 'hidden' }}>
        nomad
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '15px', flexShrink: 0 }}>
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block' }}>
          <MailIcon size={22} color="white" />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <WhatsAppIcon size={22} color="white" />
        </a>
      </div>
    </header>
  );
};

export default Header;
