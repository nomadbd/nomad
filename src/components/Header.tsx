import React, { useState, useEffect } from 'react';
import SearchOverlay from './SearchOverlay'; // সার্চ ওভারলে ইমপোর্ট করা হলো
import AuthForm from './auth/AuthForm'; // AuthForm ইমপোর্ট করা হলো

const Header: React.FC = () => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // সার্চ এবং প্রোফাইল ফর্ম ওপেন/ক্লোজ করার স্টেট
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const controlHeader = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        // নিচে স্ক্রল করলে হেডার লুকিয়ে যাবে
        setShow(false);
      } else {
        // ওপরে স্ক্রল করলে হেডার দেখা যাবে
        setShow(true);
      }
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlHeader);
      return () => {
        window.removeEventListener('scroll', controlHeader);
      };
    }
  }, [lastScrollY]);

  return (
    <>
      <header 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '16px 20px', backgroundColor: 'black', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', boxSizing: 'border-box',
          position: 'fixed', top: show ? '0' : '-80px', transition: 'top 0.3s ease', zIndex: 1000
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>
          nomad
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* সার্চ আইকন */}
          <button 
            onClick={() => setIsSearchOpen(true)} // এখানে ক্লিক করলে সার্চ ওপেন হবে
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Search"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 21-4.34-4.34"/>
              <circle cx="11" cy="11" r="8"/>
            </svg>
          </button>

          {/* কার্ট আইকন */}
          <button 
            onClick={() => console.log("Cart clicked!")} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', lineHeight: 0 }}
            aria-label="Cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"/>
              <path d="M8 11V6a4 4 0 0 1 8 0v5"/>
            </svg>
          </button>

          {/* প্রোফাইল আইকন */}
          <button 
            onClick={() => setIsAuthOpen(true)} // এখানে ক্লিক করলে প্রোফাইল ফর্ম ওপেন হবে
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', lineHeight: 0 }}
            aria-label="Profile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </header>

      {/* সার্চ ওভারলে কম্পোনেন্ট */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* প্রিমিয়াম ব্লার ব্যাকগ্রাউন্ডসহ AuthForm পপ-আপ ওভারলে */}
      {isAuthOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // পেছনের অংশ হালকা অন্ধকার দেখাবে
          backdropFilter: 'blur(8px)', // প্রিমিয়াম অ্যাপল-স্টাইল ব্লার ইফেক্ট
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          {/* এই কার্ডের ভেতর ফর্মটি থাকবে, যা ফর্মের ব্যাকগ্রাউন্ড সাদা রাখবে */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '400px', 
            backgroundColor: '#ffffff', 
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}>
            {/* ফর্মটি বন্ধ করার ক্লোজ (✕) বাটন */}
            <button 
              onClick={() => setIsAuthOpen(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#333333',
                fontSize: '22px',
                cursor: 'pointer',
                zIndex: 10000,
                padding: '5px',
                lineHeight: 1
              }}
              aria-label="Close Form"
            >
              ✕
            </button>
            <AuthForm />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
