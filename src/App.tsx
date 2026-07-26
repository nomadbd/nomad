import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

// (ঐচ্ছিক: যদি আলাদা AdminRoute ব্যবহার করতে চান)
// import { AdminRoute } from './components/AdminRoute';
// import { AdminDashboard } from './pages/AdminDashboard';

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();
  const navigate = useNavigate(); // 👈 স্মুথ নেভিগেশনের জন্য

  // ⚡ /profile, /admin এবং /update-password পেজে মেইন হেডার হাইড থাকবে
  const showHeader = !['/profile', '/admin', '/update-password'].includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
      {showHeader && (
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
            if (session) {
              navigate('/profile'); // 👈 window.location.href-এর বদলে navigate ব্যবহার করা হলো
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

        {/* ⚡ অপশন ১: প্রোফাইল রাউট (Profile.tsx নিজেই AdminDashboard বা ইউজার প্রোফাইল হ্যান্ডেল করে) */}
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" replace />} />

        {/* ⚡ অপশন ২: যদি আলাদা /admin রাউট ব্যবহার করতে চান (AdminRoute দিয়ে সুরক্ষার জন্য) */}
        {/* 
        <Route 
          path="/admin" 
          element={
            <AdminRoute session={session}>
              <AdminDashboard session={session} />
            </AdminRoute>
          } 
        /> 
        */}

        {/* Password Update Route */}
        <Route 
          path="/update-password" 
          element={<AuthForm isRecoveryPage={true} />} 
        />

        {/* অজানা যেকোনো লিংকে গেলে হোমে পাঠাবে */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
