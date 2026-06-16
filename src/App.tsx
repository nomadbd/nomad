import React, { useState } from 'react';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import AuthOverlay from './components/auth/AuthOverlay'; // নতুন স্বাধীন ওভারলে ইমপোর্ট
import Hero from './components/Hero/Hero'; 

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false); // প্রোফাইলের জন্য স্টেট

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', color: 'white' }}>
      
      {/* হেডার */}
      <Header 
        onSearchOpen={() => setIsSearchOpen(true)} 
        onProfileOpen={() => setIsAuthOpen(true)} 
      />

      {/* সার্চ ওভারলে কম্পোনেন্ট */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* প্রোফাইল অথেনটিকেশন ওভারলে কম্পোনেন্ট */}
      <AuthOverlay 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      {/* হিরো ব্যানার সেকশন */}
      <Hero />

      <main style={{ padding: '32px' }}>
        {/* আপনার অন্যান্য কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
