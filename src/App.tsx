import React, { useState } from 'react';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero'; // Hero কম্পোনেন্ট ইমপোর্ট করা হলো
import AuthOverlay from './components/auth/AuthOverlay'; // AuthOverlay ইমপোর্ট করা হলো

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false); // প্রোফাইল ওপেন করার স্টেট

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
      {/* হেডার যেখানে সার্চ এবং প্রোফাইল আইকন আছে */}
      <Header 
        onSearchOpen={() => setIsSearchOpen(true)} 
        onAuthOpen={() => setIsAuthOpen(true)} // প্রোফাইল ক্লিকের হ্যান্ডলার পাস করা হলো
      />

      {/* সার্চ ওভারলে কম্পোনেন্ট */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* অথরাইজেশন ওভারলে (সাইন আপ/লগইন ফর্ম) */}
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
