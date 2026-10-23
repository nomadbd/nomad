import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { useSession } from './hooks/useSession';
import { subscribeUserToPush } from './utils/pushManager';

import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'; // সরাসরি ইমপোর্ট করা হলো (ডাবল লোডিং এড়াতে)

import Header from './components/ui/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import ProductList from './components/ProductList';
import CartOverlay from './components/CartOverlay';
import AuthOverlay from './components/auth/AuthOverlay';
import AuthForm from './components/auth/AuthForm';
import ReminderLoading from './components/ui/ReminderLoading';

const AmbassadorJoin = lazy(() => import('./components/ambassador/join/AmbassadorJoin'));
const AmbassadorPortal = lazy(() => import('./components/ambassador/portal/AmbassadorPortal'));

const AppContent = ({ session, setIsSearchOpen, setIsAuthOpen }: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;

    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isAdminRoute) {
      subscribeUserToPush();
    }
  }, [session, location.pathname]);

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
            <Suspense fallback={<ReminderLoading label="LOADING VIP PORTAL..." />}>
              <AmbassadorJoin />
            </Suspense>
          } 
        />

        <Route 
          path="/:slug" 
          element={
            <Suspense fallback={<ReminderLoading label="LOADING AMBASSADOR PAGE..." />}>
              <AmbassadorPortal />
            </Suspense>
          } 
        />

        {/* সরাসরি AdminDashboard রেন্ডার করা হলো, কোনো Suspense বা ডাবল লোডিং ছাড়াই */}
        <Route 
          path="/admin" 
          element={
            session ? <AdminDashboard /> : <Navigate to="/" replace />
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

  if (loading) return <ReminderLoading label="INITIALIZING SYSTEM..." />;

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
