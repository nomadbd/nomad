import React, { useState } from 'react';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black' }}>
      {/* হেডার যেখানে সার্চ আইকন আছে */}
      <Header onSearchOpen={() => setIsSearchOpen(true)} />

      {/* সার্চ ওভারলে কম্পোনেন্ট */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <main style={{ padding: '32px' }}>
        {/* আপনার মূল কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
