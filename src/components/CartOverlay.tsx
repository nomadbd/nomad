import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Checkout from './Checkout'; 

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsCheckingOut(false); 
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  useEffect(() => {
    setSelectedIds(cartItems.map(item => item.id)); 
  }, [cartItems]);

  if (!isCartOpen) return null;

  const subtotal = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
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
        height: '100vh', 
        backgroundColor: 'rgba(0, 0, 0, 0.98)', 
        zIndex: 9999, 
        overflowY: 'auto', 
        padding: '40px 20px', 
        boxSizing: 'border-box' 
      }}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>

        {/* ✖️ র' (Raw) SVG ক্লোজ বাটন */}
        <button 
          onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); }} 
          style={{ position: 'absolute', top: '-5px', right: '0', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: '400', letterSpacing: '3px', textAlign: 'center', marginBottom: '45px', fontFamily: 'monospace', color: 'white' }}>
          {isCheckingOut ? 'CHECKOUT' : 'NOMAD BAG'}
        </h2>

        {isCheckingOut ? (
          <Checkout onSuccess={() => {
            setIsCheckingOut(false);
            setIsCartOpen(false);
          }} />
        ) : (
          <div>
            <h3 style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#666', marginBottom: '30px', textTransform: 'uppercase', fontWeight: '500' }}>
              Cart Items ({cartItems.length})
            </h3>

            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '60px 0', fontSize: '13px', letterSpacing: '1.5px' }}>YOUR BAG IS EMPTY</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {cartItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  const itemImage = item.image_url || 
                    item.product_media?.find((m: any) => m.media_type === 'image')?.media_url || 
                    item.product_media?.[0]?.media_url;

                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '25px' }}>
                      
                      <img 
                        src={itemImage} 
                        alt={item.name} 
                        style={{ width: '75px', height: '95px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111' }} 
                      />

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '400', color: '#efefef', letterSpacing: '0.5px', paddingRight: '15px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {item.name}
                            </h4>
                            {(item.color || item.size) && (
                              <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
                              </div>
                            )}
                          </div>

                          <div 
                            onClick={() => toggleSelect(item.id)}
                            style={{ width: '16px', height: '16px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #333', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none', flexShrink: 0 }}
                          >
                            {isSelected && <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* 🔘 প্রিমিয়াম কোয়ান্টিটি সিলেক্টর (ক্লিক ফ্রেন্ডলি প্যাডিং সহ) */}
                          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                            <button onClick={() => decrementQuantity(item.id)} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>—</button>
                            <span style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', minWidth: '24px', textAlign: 'center', userSelect: 'none' }}>{item.quantity}</span>
                            <button onClick={() => incrementQuantity(item.id)} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>+</button>
                          </div>
                          <div style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace', fontWeight: '400' }}>৳{item.price * item.quantity}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: '15px', padding: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px', letterSpacing: '0.5px' }}>
                    <span style={{ color: '#666' }}>Subtotal</span>
                    <span style={{ color: 'white', fontWeight: '500', fontFamily: 'monospace', fontSize: '16px' }}>৳{subtotal}</span>
                  </div>

                  {/* 🖤 ক্লিন ও মিনিমালিস্ট বাটন (হোভার এফেক্ট ছাড়া) */}
                  <button 
                    disabled={selectedIds.length === 0}
                    onClick={() => setIsCheckingOut(true)} 
                    style={{ 
                      width: '100%', padding: '16px', background: 'transparent', 
                      color: selectedIds.length > 0 ? 'white' : '#444', 
                      border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid #222', 
                      fontWeight: '600', letterSpacing: '3px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.2s ease',
                      outline: 'none', opacity: selectedIds.length > 0 ? 1 : 0.3
                    }}
                  >
                    PROCEED TO CHECKOUT ({selectedIds.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartOverlay;
