 import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Checkout from './Checkout'; 

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isCartOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      setIsCheckingOut(false); 
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isCartOpen]);

  useEffect(() => {
    setSelectedIds(cartItems.map(item => `${item.id}-${item.color || ''}-${item.size || ''}`)); 
  }, [cartItems]);

  if (!isCartOpen) return null;

  const subtotal = cartItems
    .filter(item => selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const selectedItemsForCheckout = cartItems.filter(item => 
    selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`)
  );

  const toggleSelect = (itemKey: string) => {
    if (selectedIds.includes(itemKey)) {
      setSelectedIds(selectedIds.filter(key => key !== itemKey));
    } else {
      setSelectedIds([...selectedIds, itemKey]);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100dvh',
        backgroundColor: '#000', 
        zIndex: 9999, 
        overflow: 'hidden', 
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '500px', width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '35px 24px 0 24px' }}>

        {/* Close Button */}
        <button 
          onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); }} 
          style={{ 
            position: 'absolute', 
            top: '32px', 
            right: '24px', 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            padding: '5px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 10 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Balanced & Bold Header */}
        <h2 style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '1.5px', textAlign: 'left', marginBottom: '30px', fontFamily: 'monospace', color: 'white', flexShrink: 0, textTransform: 'uppercase' }}>
          {isCheckingOut ? 'CHECKOUT' : `NOMAD BAG (${cartItems.length})`}
        </h2>

        {isCheckingOut ? (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
            <Checkout 
              selectedItems={selectedItemsForCheckout} 
              onSuccess={() => {
                setIsCheckingOut(false);
                setIsCartOpen(false);
              }} 
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'left', color: '#555', padding: '40px 0', fontSize: '12px', letterSpacing: '1px', flex: 1, textTransform: 'uppercase', fontWeight: '600' }}>YOUR BAG IS EMPTY</p>
            ) : (
              <>
                <div className="cart-items-scroll-area" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '5px', paddingBottom: '20px' }}>
                  {cartItems.map((item) => {
                    const itemKey = `${item.id}-${item.color || ''}-${item.size || ''}`;
                    const isSelected = selectedIds.includes(itemKey);

                    const itemImage = item.image_url || 
                      item.product_media?.find((m: any) => m.media_type === 'image')?.media_url || 
                      item.product_media?.[0]?.media_url;

                    return (
                      <div key={itemKey} style={{ display: 'flex', gap: '18px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>

                        <img 
                          src={itemImage} 
                          alt={item.name} 
                          style={{ width: '70px', height: '90px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#111' }} 
                        />

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#f5f5f5', letterSpacing: '0.3px', paddingRight: '15px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                {item.name}
                              </h4>
                              {(item.color || item.size) && (
                                <div style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>
                                  {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
                                </div>
                              )}
                            </div>

                            <div 
                              onClick={() => toggleSelect(itemKey)}
                              style={{ width: '16px', height: '16px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #444', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none', flexShrink: 0 }}
                            >
                              {isSelected && <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                              <button 
                                onClick={() => decrementQuantity(item.id, item.color, item.size)} 
                                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                              >
                                —
                              </button>
                              <span style={{ color: 'white', fontSize: '12px', fontFamily: 'monospace', minWidth: '22px', textAlign: 'center', userSelect: 'none', fontWeight: '500' }}>{item.quantity}</span>
                              <button 
                                onClick={() => incrementQuantity(item.id, item.color, item.size)} 
                                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: '500' }}>৳{item.price * item.quantity}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ 
                  marginTop: 'auto', 
                  padding: '15px 0 calc(35px + env(safe-area-inset-bottom)) 0', 
                  backgroundColor: '#000', 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  flexShrink: 0 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px', letterSpacing: '0.5px' }}>
                    <span style={{ color: '#888', textTransform: 'uppercase', fontWeight: '500' }}>Subtotal</span>
                    <span style={{ color: 'white', fontWeight: '600', fontFamily: 'monospace', fontSize: '15px' }}>৳{subtotal}</span>
                  </div>

                  <button 
                    disabled={selectedIds.length === 0}
                    onClick={() => setIsCheckingOut(true)} 
                    style={{ 
                      width: '100%', padding: '15px', background: 'transparent', 
                      color: selectedIds.length > 0 ? 'white' : '#444', 
                      border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid #222', 
                      fontWeight: '600', letterSpacing: '2px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.2s ease',
                      outline: 'none', opacity: selectedIds.length > 0 ? 1 : 0.3
                    }}
                  >
                    PROCEED TO CHECKOUT ({selectedIds.length})
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '9px', color: '#555', letterSpacing: '1px', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: '500' }}>
                    Secure Checkout • Nomad Concepts
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .cart-items-scroll-area::-webkit-scrollbar { display: none; }
        .cart-items-scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CartOverlay;
