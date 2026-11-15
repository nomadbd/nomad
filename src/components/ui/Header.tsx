import React from 'react';
import { useCart } from '@/context/CartContext'; 
import { SearchIcon, CartIcon, UserIcon } from '@/components/icons';

interface HeaderProps {
  onSearchOpen: () => void;
  onAuthOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchOpen, onAuthOpen }) => {
  const { setIsCartOpen, cartItems } = useCart();

  return (
    <header 
      style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '16px 20px', backgroundColor: 'black', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', boxSizing: 'border-box',
        position: 'fixed', top: '0', left: '0', zIndex: 1000
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>
        nomad
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button 
          onClick={onSearchOpen} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Search"
        >
          <SearchIcon stroke="white" />
        </button>

        <button 
          onClick={() => setIsCartOpen(true)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', lineHeight: 0, position: 'relative' }} 
          aria-label="Cart"
        >
          <CartIcon stroke="white" />

          {cartItems.length > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              backgroundColor: 'white', color: 'black', borderRadius: '50%',
              width: '15px', height: '15px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace'
            }}>
              {cartItems.length}
            </span>
          )}
        </button>

        <button 
          onClick={onAuthOpen} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', lineHeight: 0 }}
          aria-label="Profile"
        >
          <UserIcon stroke="white" />
        </button>
      </div>
    </header>
  );
};

export default Header;
