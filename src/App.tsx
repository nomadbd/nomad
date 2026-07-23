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

// ⚡ কার্ট সিস্টেমের জন্য নতুন ইম্পোর্টসমূহ যুক্ত করা হলো
import { CartProvider } from './context/CartContext';
import CartOverlay from './components/CartOverlay';

// ⚡ অ্যাডমিন সিকিউরিটি ও ড্যাশবোর্ডের জন্য নতুন ইম্পোর্ট (যুক্ত করা হয়েছে)
import { AdminRoute } from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();

  // ⚡ অ্যাডমিন পেজে যাতে মেইন ওয়েবসাইট হেডার না দেখায় সেজন্য condition আপডেট করা হয়েছে
  const showHeader = !['/profile', '/update-password'].includes(location.pathname) && !location.pathname.startsWith('/admin');

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

        {/* ⚡ অ্যাডমিন ড্যাশবোর্ড সিকিউর রাউট (যুক্ত করা হয়েছে) */}
        <Route 
          path="/admin/*" 
          element={
            <AdminRoute session={session}>
              <AdminDashboard session={session} />
            </AdminRoute>
          } 
        />
      </Routes>

      {/* ⚡ নতুন ওয়ান-পেজ কার্ট ওভারলে এখানে যুক্ত করা হলো */}
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
    // ⚡ পুরো অ্যাপে কার্ট স্টেট শেয়ার করার জন্য CartProvider দিয়ে মুড়ে দেওয়া হলো
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
