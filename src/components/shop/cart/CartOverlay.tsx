import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Checkout from '@/components/shop/checkout/Checkout';
import EmptyCart from './EmptyCart';
import CartItemRow from './CartItemRow';
import CartFooter from './CartFooter';

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
              <EmptyCart />
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

                    return (
                      <CartItemRow
                        key={itemKey}
                        item={item}
                        itemKey={itemKey}
                        isSelected={isSelected}
                        onToggleSelect={toggleSelect}
                        onIncrement={incrementQuantity}
                        onDecrement={decrementQuantity}
                      />
                    );
                  })}
                </div>

                <CartFooter
                  subtotal={subtotal}
                  selectedCount={selectedIds.length}
                  onProceedToCheckout={() => {
                    setCheckoutSnapshot(selectedItemsForCheckout);
                    setIsCheckingOut(true);
                  }}
                />
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
