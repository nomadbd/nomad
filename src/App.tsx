import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true); // নতুন লোডিং স্টেট

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // চেক শেষ হলে লোডিং বন্ধ
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{backgroundColor: 'black', height: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Loading...</div>;

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
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
          {/* সেশন থাকলে প্রোফাইল, না থাকলে হোম */}
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
