import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { useSession } from './hooks/useSession';

import ProfilePage from './pages/ProfilePage';

import Header from './components/ui/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import ProductList from './components/ProductList';
import CartOverlay from './components/CartOverlay';
import AuthOverlay from './components/auth/AuthOverlay';
import AuthForm from './components/auth/AuthForm';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AmbassadorJoin = lazy(() => import('./components/ambassador/AmbassadorJoin'));
const AmbassadorPortal = lazy(() => import('./components/ambassador/AmbassadorPortal'));

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  
  const showHeader = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: '#fff' }}>
      {showHeader && (
        <Header 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
            if (session) {
              navigate('/profile');
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

        <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/" replace />} />

        <Route 
          path="/vip/:token" 
          element={
            <Suspense fallback={null}>
              <AmbassadorJoin />
            </Suspense>
          } 
        />

        <Route 
          path="/:slug" 
          element={
            <Suspense fallback={null}>
              <AmbassadorPortal />
            </Suspense>
          } 
        />

        <Route 
          path="/admin" 
          element={
            session ? (
              <Suspense fallback={
                <div style={{ backgroundColor: '#030303', color: '#fff', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                  LOADING DASHBOARD...
                </div>
              }>
                <AdminDashboard />
              </Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        <Route 
          path="/update-password" 
          element={<AuthForm isRecoveryPage={true} />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
