import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { SearchIcon, CartIcon, UserIcon, CloseIcon, BackIcon } from '@/components/icons';

interface HeaderProps {
  onSearchOpen: () => void;
  onSearchClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onAuthOpen: () => void;
  isSearchOpen: boolean;
  isAuthOpen: boolean;
  isProfileActive: boolean;
  isCheckingOut?: boolean;
  onCheckoutBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearchOpen,
  onSearchClose,
  searchQuery,
  onSearchQueryChange,
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
      onSearchClose();
    }

    if (isCartOpen) {
      if (isCheckingOut && onCheckoutBack) {
        onCheckoutBack();
      }
      setIsCartOpen(false);
    }
  };

  const handleBackFromCheckout = () => {
    if (onCheckoutBack) {
      onCheckoutBack();
    }
  };

  const renderLeftContent = () => {
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
            whiteSpace: 'nowrap',
          }}
        >
          NOMAD BAG ({cartItems.length})
        </span>
      );
    }

    if (isSearchOpen) {
      return (
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            letterSpacing: '0.08em',
            padding: 0,
            margin: 0,
          }}
        />
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
        transition: 'top 0.3s ease',
        zIndex: 1000,
        gap: '12px',
      }}
    >
      <div
        onClick={() => {
          if (isSearchOpen) return;
          if (!isOverlayActive) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        style={{
          cursor: isSearchOpen ? 'text' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          minHeight: '32px',
          flex: isSearchOpen ? 1 : 'initial',
        }}
      >
        {renderLeftContent()}
      </div>

      {isOverlayActive ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {isCartOpen && isCheckingOut && (
            <button
              type="button"
              onClick={handleBackFromCheckout}
              aria-label="Back to bag"
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
              <BackIcon color="white" size={20} />
            </button>
          )}

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
            <CloseIcon color="white" size={20} />
          </button>
        </div>
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
