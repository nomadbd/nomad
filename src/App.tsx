import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import {
  LoadingProvider,
  useGlobalLoading,
} from './context/LoadingContext';
import { useSession } from './hooks/useSession';

import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/dashboard/AdminDashboard';

import Header from './components/ui/Header';
import SearchOverlay from './components/SearchOverlay';
import Hero from './components/Hero/Hero';
import ProductList from './components/shop/products/ProductList';
import CartOverlay from './components/shop/cart/CartOverlay';
import AuthOverlay from './components/auth/AuthOverlay';
import AuthForm from './components/auth/AuthForm';
import ReminderLoading from './components/ui/ReminderLoading';
import { GlobalSkeleton } from './components/ui/GlobalSkeleton';

const AmbassadorJoin = lazy(
  () => import('./components/ambassador/join/AmbassadorJoin')
);

const AmbassadorPortal = lazy(
  () => import('./components/ambassador/portal/AmbassadorPortal')
);

interface AppContentProps {
  session: any;
  sessionLoading: boolean;
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
  sessionLoading,
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
  const { isPageLoading } = useGlobalLoading();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProfileRoute =
    location.pathname === '/profile' ||
    location.pathname.startsWith('/profile/');
  const isHomeRoute = location.pathname === '/';
  const showHeader = !isAdminRoute && !isProfileRoute;

  // Home uses the App Header. Profile has its own view-specific headers.
  const hasHeaderBelowWhichLoaderShouldStart =
    isHomeRoute || isProfileRoute;

  useEffect(() => {
    if (isHomeRoute && isPageLoading) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }
  }, [isHomeRoute, isPageLoading]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const renderLoader = () => {
    if (isAdminRoute) {
      return <ReminderLoading label="" />;
    }

    return <GlobalSkeleton />;
  };

  const headerProps = {
    onSearchOpen: () => setIsSearchOpen(true),
    onSearchClose: handleCloseSearch,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
    onAuthOpen: () => {
      if (session) {
        navigate('/profile');
      } else {
        setIsAuthOpen(true);
      }
    },
    isSearchOpen,
    isAuthOpen,
    isProfileActive: isProfileRoute,
    isCheckingOut,
    onCheckoutBack: () => setIsCheckingOut(false),
  };

  if (sessionLoading) {
    if (isHomeRoute && showHeader) {
      return (
        <>
          <Header {...headerProps} />

          <div
            style={{
              position: 'fixed',
              top: '70px',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              backgroundColor: '#000',
              overflowY: 'auto',
            }}
          >
            {renderLoader()}
          </div>
        </>
      );
    }

    return renderLoader();
  }

  const hideHomeContent = isHomeRoute && isPageLoading;

  return (
    <>
      {isPageLoading && (
        <div
          style={
            hasHeaderBelowWhichLoaderShouldStart
              ? {
                  position: 'fixed',
                  top: '70px',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  // Header uses z-index 1000; keep this overlay underneath it.
                  zIndex: 999,
                  backgroundColor: '#000',
                  overflowY: 'auto',
                }
              : {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 100000,
                  backgroundColor: '#000',
                  overflowY: 'auto',
                }
          }
        >
          {renderLoader()}
        </div>
      )}

      {showHeader && <Header {...headerProps} />}

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          paddingTop: showHeader ? '70px' : 0,
          visibility: hideHomeContent ? 'hidden' : 'visible',
          pointerEvents: hideHomeContent ? 'none' : 'auto',
        }}
      >
        <Suspense fallback={renderLoader()}>
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

            <Route
              path="/profile"
              element={
                session ? (
                  <ProfilePage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/vip/:token"
              element={<AmbassadorJoin />}
            />

            <Route
              path="/:slug"
              element={<AmbassadorPortal />}
            />

            <Route
              path="/admin"
              element={
                session ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/update-password"
              element={<AuthForm isRecoveryPage={true} />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Suspense>
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

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <LoadingProvider>
      <CartProvider>
        <Router>
          <AppContent
            session={session}
            sessionLoading={loading}
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

          <AuthOverlay
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
          />
        </Router>
      </CartProvider>
    </LoadingProvider>
  );
};

export default App;
