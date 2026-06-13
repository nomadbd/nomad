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
        padding: '24px 20px', 
        backgroundColor: 'transparent', 
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* ফন্ট ফ্যামিলি এবং টেক্সট ফরম্যাট আপডেট করা হয়েছে */}
      <div style={{ 
        fontSize: '32px', 
        fontWeight: '700', // প্রিমিয়াম লুকের জন্য ফন্ট ওয়েট একটু কমানো হয়েছে
        color: 'white', 
        textTransform: 'uppercase', // প্রিমিয়াম ব্র্যান্ডের জন্য এটিই আদর্শ
        fontFamily: "'Playfair Display', serif", // ক্লাসিক লাক্সারি Serif ফন্ট
        letterSpacing: '2px' // অক্ষরগুলোর মাঝে ফাঁকা দিলে আভিজাত্য বাড়ে
      }}>
        NOMAD
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
        <a href="mailto:nomadbysh@gmail.com" style={{ display: 'block', opacity: 0.7, transition: 'opacity 0.3s' }}>
          <MailIcon size={24} color="white" />
        </a>
        <a href="https://wa.me/8801521731371" target="_blank" rel="noopener noreferrer" style={{ display: 'block', opacity: 0.7, transition: 'opacity 0.3s' }}>
          <WhatsAppIcon size={24} color="white" />
        </a>
      </div>
    </header>
  );
};

export default Header;
