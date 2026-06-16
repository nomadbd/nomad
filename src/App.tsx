import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './hooks/useSession'; // হুক ইমপোর্ট
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const { session, loading } = useSession(); // হুক থেকে সেশন ও লোডিং স্টেট পাওয়া যাচ্ছে
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // লোডিং অবস্থায় থাকলে কিছু না দেখানো বা লোডার দেখানো
  if (loading) return null;

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
            // সেশন থাকলে প্রোফাইলে যাবে, না থাকলে অথ ফর্ম খুলবে
            if (session) {
              window.location.href = '/profile';
            } else {
              setIsAuthOpen(true);
            }
          }}
        />

        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />

        <AuthOverlay 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />

        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <main style={{ padding: '32px' }}></main>
            </>
          } />
          {/* প্রোটেক্টেড রুট: সেশন চেক করে প্রোফাইল দেখাবে */}
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
