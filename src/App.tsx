import React, { useState } from 'react';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero'; // Hero কম্পোনেন্ট ইমপোর্ট করা হলো

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
      {/* হেডার যেখানে সার্চ আইকন আছে */}
      <Header onSearchOpen={() => setIsSearchOpen(true)} />

      {/* সার্চ ওভারলে কম্পোনেন্ট */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
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
