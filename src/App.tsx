import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';
import AuthForm from './components/auth/AuthForm'; // AuthForm ইমপোর্ট নিশ্চিত করুন

// হেডার ও রাউটিং হ্যান্ডেল করার জন্য একটি সাব-কম্পোনেন্ট
const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();

  // প্রোফাইল, ফরগট বা আপডেট পাসওয়ার্ড পেজ ছাড়া অন্য সব পেজে হেডার দেখাবে
  const showHeader = location.pathname !== '/profile' && 
                     location.pathname !== '/update-password';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
      {showHeader && (
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
      )}

      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <main style={{ padding: '32px' }}></main>
          </>
        } />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
        
        {/* পাসওয়ার্ড আপডেটের জন্য রাউট */}
        <Route path="/update-password" element={<AuthForm />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  const { session, loading } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (loading) return null;

  return (
    <Router>
      <AppContent 
        session={session} 
        setIsSearchOpen={setIsSearchOpen} 
        setIsAuthOpen={setIsAuthOpen} 
      />

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <AuthOverlay 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </Router>
  );
};

export default App;
