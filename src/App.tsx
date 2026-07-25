import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import Header from './components/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import AuthOverlay from './components/auth/AuthOverlay';
import Profile from './pages/Profile';
import AuthForm from './components/auth/AuthForm';
import ProductList from './components/ProductList';

// ⚡ কার্ট সিস্টেমের জন্য ইম্পোর্ট
import { CartProvider } from './context/CartContext';
import CartOverlay from './components/CartOverlay';

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();

  // ⚡ /profile এবং /update-password পেজে মেইন হেডার হাইড থাকবে
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
            <main style={{ padding: '32px' }}>
              <ProductList />
            </main>
          </>
        } />

        {/* ⚡ প্রোফাইল রাউট: Profile.tsx নিজেই চেক করে AdminDashboard বা কাস্টমার ভিউ দেখাবে */}
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />

        {/* Password Update Route */}
        <Route 
          path="/update-password" 
          element={<AuthForm isRecoveryPage={true} />} 
        />
      </Routes>

      {/* ওয়ান-পেজ কার্ট ওভারলে */}
      <CartOverlay session={session} />
    </div>
  );
};

const App: React.FC = () => {
  const { session, loading } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (loading) return null;

  return (
    <CartProvider>
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
    </CartProvider>
  );
};

export default App;
