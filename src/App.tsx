import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { useSession } from './hooks/useSession';

import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/dashboard/AdminDashboard';

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

interface AppContentProps {
  session: any;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isAuthOpen: boolean;
  setIsAuthOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCheckingOut: boolean;
  setIsCheckingOut: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContent: React.FC<AppContentProps> = ({
  session,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  isAuthOpen,
  setIsAuthOpen,
  isCheckingOut,
  setIsCheckingOut,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isProfileRoute =
    location.pathname === '/profile' || location.pathname.startsWith('/profile/');
  const showHeader = !location.pathname.startsWith('/admin') && !isProfileRoute;

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {showHeader && (
        <Header
          onSearchOpen={() => setIsSearchOpen(true)}
          onSearchClose={handleCloseSearch}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onAuthOpen={() => {
            if (session) {
              navigate('/profile');
            } else {
              setIsAuthOpen(true);
            }
          }}
          isSearchOpen={isSearchOpen}
          isAuthOpen={isAuthOpen}
          isProfileActive={isProfileRoute}
          isCheckingOut={isCheckingOut}
          onCheckoutBack={() => setIsCheckingOut(false)}
        />
      )}

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'black',
          color: '#fff',
          paddingTop: showHeader ? '70px' : '0',
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <main style={{ padding: '32px' }}>
                  <ProductList />
                </main>
              </>
            }
          />

          <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/" replace />} />

          <Route
            path="/vip/:token"
            element={
              <Suspense fallback={<ReminderLoading label="" />}>
                <AmbassadorJoin />
              </Suspense>
            }
          />

          <Route
            path="/:slug"
            element={
              <Suspense fallback={<ReminderLoading label="" />}>
                <AmbassadorPortal />
              </Suspense>
            }
          />

          <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/" replace />} />

          <Route path="/update-password" element={<AuthForm isRecoveryPage={true} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const { session, loading } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (loading) return <ReminderLoading label="" />;

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <CartProvider>
      <Router>
        <AppContent
          session={session}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAuthOpen={isAuthOpen}
          setIsAuthOpen={setIsAuthOpen}
          isCheckingOut={isCheckingOut}
          setIsCheckingOut={setIsCheckingOut}
        />

        <CartOverlay
          session={session}
          isCheckingOut={isCheckingOut}
          setIsCheckingOut={setIsCheckingOut}
        />

        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={handleCloseSearch}
          searchQuery={searchQuery}
        />

        <AuthOverlay isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </Router>
    </CartProvider>
  );
};

export default App;
