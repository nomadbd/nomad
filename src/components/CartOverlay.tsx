import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Checkout from './Checkout'; // নতুন Checkout কম্পোনেন্ট ইমপোর্ট করা হলো

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  // চেকআউট ফর্ম দেখানোর স্টেট
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsCheckingOut(false); // কার্ট বন্ধ হলে চেকআউট ভিউ রিসেট হবে
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  useEffect(() => {
    // ইউনিক ভ্যারিয়েন্ট কী (id-size-color) দিয়ে সিলেক্টেড আইটেম ট্র্যাক করা হচ্ছে
    setSelectedIds(cartItems.map(item => `${item.id}-${item.size}-${item.color}`));
  }, [cartItems]);

  if (!isCartOpen) return null;

  const subtotal = cartItems
    .filter(item => selectedIds.includes(`${item.id}-${item.size}-${item.color}`))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

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
        height: '100vh', 
        backgroundColor: 'rgba(0, 0, 0, 0.98)', 
        zIndex: 9999, 
        overflowY: 'auto', 
        padding: '40px 20px', 
        boxSizing: 'border-box' 
      }}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>

        {/* বন্ধ করার ক্রস বাটন - চেকআউট মোড রিসেট করে */}
        <button 
          onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); }} 
          style={{ position: 'absolute', top: '-10px', right: '0', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
        >
          &times;
        </button>

        <h2 style={{ fontSize: '20px', letterSpacing: '2px', textAlign: 'center', marginBottom: '35px', fontFamily: 'monospace', color: 'white' }}>
          {isCheckingOut ? 'CHECKOUT' : 'NOMAD BAG'}
        </h2>

        {/* যদি চেকআউট মোড অন থাকে, ফর্ম দেখাবে, নাহলে কার্ট লিস্ট */}
        {isCheckingOut ? (
          <Checkout onSuccess={() => {
            setIsCheckingOut(false);
            setIsCartOpen(false);
          }} />
        ) : (
          <div>
            <h3 style={{ fontSize: '12px', letterSpacing: '1px', color: '#b3b3b3', marginBottom: '25px', textTransform: 'uppercase' }}>
              Cart Items ({cartItems.length})
            </h3>

            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#b3b3b3', padding: '40px 0', fontSize: '14px', letterSpacing: '1px' }}>YOUR BAG IS EMPTY</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {cartItems.map((item) => {
                  const itemKey = `${item.id}-${item.size}-${item.color}`;
                  const isSelected = selectedIds.includes(itemKey);
                  return (
                    <div key={itemKey} style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #1a1a1a', paddingBottom: '20px' }}>
                      <img src={item.image_url} alt={item.name} style={{ width: '75px', height: '90px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '15px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'normal', color: '#e5e5e5', letterSpacing: '0.5px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {item.name}
                            </h4>
                            {/* মিনিমালিস্ট প্রিমিয়াম সাইজ ও কালার ডিসপ্লে */}
                            <div style={{ fontSize: '10px', color: '#777', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                              SIZE: {item.size} &bull; COLOR: {item.color}
                            </div>
                          </div>
                          <div 
                            onClick={() => toggleSelect(itemKey)}
                            style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #444', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none', flexShrink: 0, marginTop: '2px' }}
                          >
                            {isSelected && <span style={{ color: '#000', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                            <button onClick={() => decrementQuantity(item.id, item.size, item.color)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}>—</button>
                            <span style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace', minWidth: '10px', textAlign: 'center' }}>{item.quantity}</span>
                            <button onClick={() => incrementQuantity(item.id, item.size, item.color)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}>+</button>
                          </div>
                          <div style={{ color: 'white', fontSize: '15px', fontFamily: 'monospace', fontWeight: '500' }}>৳{item.price * item.quantity}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: '10px', padding: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '15px', letterSpacing: '0.5px' }}>
                    <span style={{ color: '#b3b3b3' }}>Subtotal</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>৳{subtotal}</span>
                  </div>

                  <button 
                    disabled={selectedIds.length === 0}
                    onClick={() => setIsCheckingOut(true)} // চেকআউট মোড অন করার বাটন
                    style={{ 
                      width: '100%', padding: '15px', background: 'transparent', 
                      color: selectedIds.length > 0 ? 'white' : '#555', 
                      border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid #222', 
                      fontWeight: '600', letterSpacing: '3px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.25s ease-in-out',
                      outline: 'none', opacity: selectedIds.length > 0 ? 1 : 0.4
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
