import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState<any>(null); // সেশন ট্র্যাক করার স্টেট

  useEffect(() => {
    // অ্যাপ চালু হওয়ার সময় সেশন চেক করা
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // সেশন পরিবর্তন (লগইন/লগআউট) হলে আপডেট করা
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
            // যদি আগে থেকেই লগইন থাকে, প্রোফাইলে পাঠাও। না থাকলে ফর্ম খোলো।
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
          {/* প্রোটেক্টেড রুট: সেশন থাকলে প্রোফাইল, না থাকলে হোম */}
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
