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
    padding: '24px 20px', // প্যাডিং বাড়িয়ে একটু স্পেস তৈরি করা হলো
    backgroundColor: 'transparent', // ব্যাকগ্রাউন্ড সরিয়ে দেওয়া হলো
    width: '100%',
    boxSizing: 'border-box'
  }}
>
  <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-1px' }}>
    nomad
  </div>

  <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
    <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block', opacity: 0.8, transition: 'opacity 0.3s' }}>
      <MailIcon size={24} color="white" />
    </a>
    <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block', opacity: 0.8, transition: 'opacity 0.3s' }}>
      <WhatsAppIcon size={24} color="white" />
    </a>
  </div>
</header>

  );
};

export default Header;
