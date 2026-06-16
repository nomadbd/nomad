import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // রাউটিং ইমপোর্ট
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile'; // প্রোফাইল পেজ ইমপোর্ট

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => setIsAuthOpen(true)} 
        />

        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />

        <AuthOverlay 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />

        {/* রাউটিং কনফিগারেশন */}
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <main style={{ padding: '32px' }}></main>
            </>
          } />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
