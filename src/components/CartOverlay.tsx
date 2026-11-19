import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Checkout from './Checkout';

interface CartOverlayProps {
  session?: any;
  isCheckingOut?: boolean;
  setIsCheckingOut?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CartOverlay: React.FC<CartOverlayProps> = ({
  isCheckingOut: externalIsCheckingOut,
  setIsCheckingOut: externalSetIsCheckingOut,
}) => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  const [internalIsCheckingOut, setInternalIsCheckingOut] = useState(false);
  const isCheckingOut = externalIsCheckingOut ?? internalIsCheckingOut;
  const setIsCheckingOut = externalSetIsCheckingOut ?? setInternalIsCheckingOut;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<typeof cartItems>([]);

  useEffect(() => {
    if (!isCheckingOut) {
      setCheckoutSnapshot([]);
    }
  }, [isCheckingOut]);

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
      setCheckoutSnapshot([]);
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
  }, [isCartOpen, setIsCheckingOut]);

  useEffect(() => {
    setSelectedIds(cartItems.map((item) => `${item.id}-${item.color || ''}-${item.size || ''}`));
  }, [cartItems]);

  if (!isCartOpen) return null;

  const subtotal = cartItems
    .filter((item) => selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const selectedItemsForCheckout = cartItems.filter((item) =>
    selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`)
  );

  const toggleSelect = (itemKey: string) => {
    if (selectedIds.includes(itemKey)) {
      setSelectedIds(selectedIds.filter((key) => key !== itemKey));
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
        maxWidth: '100vw',
        height: '100dvh',
        backgroundColor: '#000',
        zIndex: 900,
        overflow: 'hidden',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        paddingTop: '64px',
        paddingLeft: isCheckingOut ? '0px' : '20px',
        paddingRight: isCheckingOut ? '0px' : '20px',
        paddingBottom: '0px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isCheckingOut ? '100%' : '500px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {isCheckingOut ? (
          <div
            style={{
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingBottom: '40px',
              boxSizing: 'border-box',
            }}
          >
            <Checkout
              selectedItems={checkoutSnapshot.length > 0 ? checkoutSnapshot : selectedItemsForCheckout}
              onSuccess={() => {
                setCheckoutSnapshot([]);
                setIsCheckingOut(false);
                setIsCartOpen(false);
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {cartItems.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  paddingBottom: '80px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 'clamp(36px, 10vw, 52px)',
                    fontWeight: '800',
                    lineHeight: '1.05',
                    letterSpacing: '-1px',
                    color: '#3a3a3a',
                    textTransform: 'uppercase',
                    fontFamily: 'sans-serif',
                  }}
                >
                  YOUR
                  <br />
                  BAG IS
                  <br />
                  EMPTY
                </h3>
              </div>
            ) : (
              <>
                <div
                  className="cart-items-scroll-area"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    paddingRight: '5px',
                    paddingBottom: '20px',
                  }}
                >
                  {cartItems.map((item) => {
                    const itemKey = `${item.id}-${item.color || ''}-${item.size || ''}`;
                    const isSelected = selectedIds.includes(itemKey);

                    const itemImage =
                      item.image_url ||
                      item.product_media?.find((m: any) => m.media_type === 'image')?.media_url ||
                      item.product_media?.[0]?.media_url;

                    return (
                      <div
                        key={itemKey}
                        style={{
                          display: 'flex',
                          gap: '18px',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          paddingBottom: '20px',
                        }}
                      >
                        <img
                          src={itemImage}
                          alt={item.name}
                          style={{
                            width: '70px',
                            height: '90px',
                            objectFit: 'cover',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backgroundColor: '#111',
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#f5f5f5',
                                  letterSpacing: '0.3px',
                                  paddingRight: '15px',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {item.name}
                              </h4>
                              {(item.color || item.size) && (
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: '#b5b5b5',
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontWeight: '500',
                                  }}
                                >
                                  {item.color}
                                  {item.color && item.size ? ' / ' : ''}
                                  {item.size}
                                </div>
                              )}
                            </div>

                            <div
                              onClick={() => toggleSelect(itemKey)}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: isSelected ? '1px solid #fff' : '1px solid #666',
                                backgroundColor: isSelected ? '#fff' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                userSelect: 'none',
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && (
                                <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '2px',
                              }}
                            >
                              <button
                                onClick={() => decrementQuantity(item.id, item.color, item.size)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#b5b5b5',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  width: '30px',
                                  height: '26px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  outline: 'none',
                                }}
                              >
                                —
                              </button>
                              <span
                                style={{
                                  color: 'white',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  minWidth: '22px',
                                  textAlign: 'center',
                                  userSelect: 'none',
                                  fontWeight: '500',
                                }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => incrementQuantity(item.id, item.color, item.size)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#b5b5b5',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  width: '30px',
                                  height: '26px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  outline: 'none',
                                }}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: '500' }}>
                              ৳{item.price * item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    padding: '15px 0 calc(35px + env(safe-area-inset-bottom)) 0',
                    backgroundColor: '#000',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <span style={{ color: '#b5b5b5', textTransform: 'uppercase', fontWeight: '500' }}>Subtotal</span>
                    <span style={{ color: 'white', fontWeight: '600', fontFamily: 'monospace', fontSize: '15px' }}>
                      ৳{subtotal}
                    </span>
                  </div>

                  <button
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                      setCheckoutSnapshot(selectedItemsForCheckout);
                      setIsCheckingOut(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'transparent',
                      color: selectedIds.length > 0 ? 'white' : '#666',
                      border:
                        selectedIds.length > 0
                          ? '1px solid rgba(255, 255, 255, 0.9)'
                          : '1px solid #333',
                      fontWeight: '600',
                      letterSpacing: '2px',
                      cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      opacity: selectedIds.length > 0 ? 1 : 0.4,
                    }}
                  >
                    PROCEED TO CHECKOUT ({selectedIds.length})
                  </button>

                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '15px',
                      fontSize: '9px',
                      color: '#b5b5b5',
                      letterSpacing: '1px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      fontWeight: '500',
                    }}
                  >
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
