import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';
import AuthForm from './components/auth/AuthForm';
// প্রোডাক্ট লিস্ট কম্পোনেন্টটি ইম্পোর্ট করা হলো
import ProductList from './components/ProductList';

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();

  const showHeader = !['/profile', '/update-password'].includes(location.pathname);

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
            {/* মেইন ট্যাগের ভেতরে প্রোডাক্ট লিস্ট বসানো হলো */}
            <main style={{ padding: '32px' }}>
              <ProductList />
            </main>
          </>
        } />

        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />

        {/* Password Update Route - এখানে পরিবর্তন করেছি */}
        <Route 
          path="/update-password" 
          element={<AuthForm isRecoveryPage={true} />} 
        />
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
