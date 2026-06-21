import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext'; // ⚡ নতুন কার্ট কনটেক্সট ইম্পোর্ট করা হলো

interface HeaderProps {
  onSearchOpen: () => void;
  onAuthOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchOpen, onAuthOpen }) => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // ⚡ কার্ট ওপেন করার ফাংশন এবং কার্টের প্রোডাক্ট লিস্ট নিয়ে আসা হলো
  const { setIsCartOpen, cartItems } = useCart();

  const controlHeader = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShow(false);
      } else {
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
          onClick={onSearchOpen} 
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
          onClick={() => setIsCartOpen(true)} // ⚡ কনসোল লগের পরিবর্তে কার্ট ওপেন করার লজিক দেওয়া হলো
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', lineHeight: 0, position: 'relative' }} // পজিশন রিলেটিভ করা হলো কাউন্টারের জন্য
          aria-label="Cart"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"/>
            <path d="M8 11V6a4 4 0 0 1 8 0v5"/>
          </svg>

          {/* ⚡ কার্টে প্রোডাক্ট থাকলে এই ছোট্ট মিনিমাল ডটটি সংখ্যার সাথে দেখাবে */}
          {cartItems.length > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              backgroundColor: 'white', color: 'black', borderRadius: '50%',
              width: '15px', height: '15px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace'
            }}>
              {cartItems.length}
            </span>
          )}
        </button>

        {/* প্রোফাইল আইকন */}
        <button 
          onClick={onAuthOpen} 
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
  );
};

export default Header;
