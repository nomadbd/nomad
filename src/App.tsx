import React, { useState } from 'react';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero'; 
import AuthForm from './components/auth/AuthForm'; 

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white', position: 'relative' }}>
      {/* হেডার শুধু ক্লিক অ্যাকশনগুলো App.tsx-এ পাঠাবে */}
      <Header 
        onSearchOpen={() => setIsSearchOpen(true)} 
        onProfileOpen={() => setIsAuthOpen(true)} 
      />

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
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '400px', 
            backgroundColor: '#ffffff', 
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }}>
            {/* ক্লোজ বাটন */}
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
            >
              ✕
            </button>
            <AuthForm />
          </div>
        </div>
      )}

      {/* হিরো ব্যানার সেকশন */}
      <Hero />

      <main style={{ padding: '32px' }}>
        {/* আপনার অন্যান্য কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
