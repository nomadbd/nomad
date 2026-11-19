import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { SearchIcon, CartIcon, UserIcon } from '@/components/icons';

interface HeaderProps {
  onSearchOpen: () => void;
  onAuthOpen: () => void;
  isSearchOpen: boolean;
  isAuthOpen: boolean;
  isProfileActive: boolean;
  isCheckingOut?: boolean;
  onCheckoutBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearchOpen,
  onAuthOpen,
  isSearchOpen,
  isAuthOpen,
  isProfileActive,
  isCheckingOut = false,
  onCheckoutBack,
}) => {
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);
  const { isCartOpen, setIsCartOpen, cartItems } = useCart();

  const isOverlayActive = isSearchOpen || isCartOpen;

  useEffect(() => {
    const handleScroll = () => {
      if (isOverlayActive) {
        setShow(true);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShow(false);
      } else {
        setShow(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOverlayActive]);

  const handleCloseActiveOverlay = () => {
    if (isSearchOpen) {
      onSearchOpen();
    }
    if (isCartOpen) {
      if (isCheckingOut && onCheckoutBack) {
        onCheckoutBack();
      }
      setIsCartOpen(false);
    }
  };

  const renderLeftTitle = () => {
    if (isCartOpen && isCheckingOut) {
      return (
        <span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.18em',
            color: 'white',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap',
          }}
        >
          CHECKOUT
        </span>
      );
    }

    if (isCartOpen) {
      return (
        <span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.18em',
            color: 'white',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap',
          }}
        >
          NOMAD BAG ({cartItems.length})
        </span>
      );
    }

    if (isSearchOpen) {
      return (
        <span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.18em',
            color: 'white',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap',
          }}
        >
          SEARCH
        </span>
      );
    }

    return (
      <span
        style={{
          fontSize: '24px',
          fontWeight: '900',
          letterSpacing: '0.08em',
          color: 'white',
          textTransform: 'uppercase',
          transition: 'all 0.25s ease',
          whiteSpace: 'nowrap',
        }}
      >
        nomad
      </span>
    );
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'black',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        boxSizing: 'border-box',
        position: 'fixed',
        top: show ? '0' : '-80px',
        transition: 'top 0.3s ease, background-color 0.3s ease',
        zIndex: 1000,
      }}
    >
      <div
        onClick={() => {
          if (isCartOpen && isCheckingOut && onCheckoutBack) {
            onCheckoutBack();
          } else if (isOverlayActive) {
            handleCloseActiveOverlay();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          minHeight: '32px',
        }}
      >
        {renderLeftTitle()}
      </div>

      {isOverlayActive ? (
        <button
          type="button"
          onClick={handleCloseActiveOverlay}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onSearchOpen}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Search"
          >
            <SearchIcon stroke={isSearchOpen ? 'white' : '#b3b3b3'} />
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(!isCartOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'block',
              lineHeight: 0,
              position: 'relative',
            }}
            aria-label="Cart"
          >
            <CartIcon stroke={isCartOpen ? 'white' : '#b3b3b3'} />

            {cartItems.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: 'white',
                  color: 'black',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                }}
              >
                {cartItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onAuthOpen}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'block',
              lineHeight: 0,
            }}
            aria-label="Profile"
          >
            <UserIcon stroke={isAuthOpen || isProfileActive ? 'white' : '#b3b3b3'} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
