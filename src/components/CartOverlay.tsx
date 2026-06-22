import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  // সিলেক্ট করা আইটেমগুলোর আইডি ট্র্যাক করার স্টেট
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // কার্টে কোনো নতুন প্রোডাক্ট ঢুকলে সেটি ডিফল্টভাবে সিলেক্টেড থাকবে
  useEffect(() => {
    setSelectedIds(cartItems.map(item => item.id));
  }, [cartItems]);

  if (!isCartOpen) return null;

  // শুধুমাত্র সিলেক্টেড আইটেমগুলোর সাবটোটাল হিসাব করার লজিক
  const subtotal = cartItems
    .filter(item => selectedIds.includes(item.id))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  // চেকবক্স অন/অফ করার লজিক
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.96)', zIndex: 2000, overflowY: 'auto', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>

        {/* বন্ধ করার ক্রস বাটন */}
        <button onClick={() => setIsCartOpen(false)} style={{ position: 'absolute', top: '-10px', right: '0', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}>
          &times;
        </button>

        <h2 style={{ fontSize: '20px', letterSpacing: '2px', textAlign: 'center', marginBottom: '35px', fontFamily: 'monospace', color: 'white' }}>
          NOMAD BAG
        </h2>

        <div>
          {/* উজ্জ্বল ধূসর টেক্সট কালার (#b3b3b3) */}
          <h3 style={{ fontSize: '12px', letterSpacing: '1px', color: '#b3b3b3', marginBottom: '25px', textTransform: 'uppercase' }}>
            Cart Items ({cartItems.length})
          </h3>

          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#b3b3b3', padding: '40px 0', fontSize: '14px', letterSpacing: '1px' }}>YOUR BAG IS EMPTY</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {cartItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #1a1a1a', paddingBottom: '20px' }}>

                    {/* প্রোডাক্ট ইমেজ */}
                    <img src={item.image_url} alt={item.name} style={{ width: '75px', height: '90px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />

                    {/* তথ্য ও কন্ট্রোল এরিয়া */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* লাইন ১: প্রোডাক্টের নাম এবং গোল চেকবক্স */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '15px', 
                          fontWeight: 'normal', 
                          color: 'white', 
                          letterSpacing: '0.5px',
                          paddingRight: '15px',   
                          lineHeight: '1.4',      
                          wordBreak: 'break-word' 
                        }}>
                          {item.name}
                        </h4>

                        {/* রাউন্ডেড চেকবক্স */}
                        <div 
                          onClick={() => toggleSelect(item.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #10b981' : '2px solid #666',
                            backgroundColor: isSelected ? '#10b981' : '#141414',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            userSelect: 'none',
                            flexShrink: 0 
                          }}
                        >
                          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      </div>

                      {/* line ২: প্লাস-মাইনাস বাটন এবং মূল্য */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        {/* প্লাস-মাইনাস স্টিপার */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                          <button 
                            onClick={() => decrementQuantity(item.id)} 
                            style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}
                          >
                            —
                          </button>
                          <span style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace', minWidth: '10px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => incrementQuantity(item.id)} 
                            style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}
                          >
                            +
                          </button>
                        </div>

                        {/* প্রোডাক্টের টোটাল প্রাইস */}
                        <div style={{ color: 'white', fontSize: '15px', fontFamily: 'monospace', fontWeight: '500' }}>
                          ৳{item.price * item.quantity}
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}

              {/* সাবটোটাল এবং চেকআউট সেকশন */}
              <div style={{ marginTop: '10px', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '15px', letterSpacing: '0.5px' }}>
                  <span style={{ color: '#b3b3b3' }}>Subtotal</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>৳{subtotal}</span>
                </div>

{/* ⚡ আল্ট্রা-লাক্সারি লাইট বর্ডার ও হোয়াইট ফন্ট বাটন */}
<button 
  disabled={selectedIds.length === 0}
  style={{ 
    width: '100%', 
    padding: '15px', 
    background: 'transparent', // সলিড সাদার বদলে সম্পূর্ণ ট্রান্সপারেন্ট
    color: selectedIds.length > 0 ? 'white' : '#555', // একটিভ হলে সাদা ফন্ট, ডিজেবল হলে ডার্ক গ্রে
    border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid #222', // হালকা ফাইন বর্ডার
    fontWeight: '600', 
    letterSpacing: '3px', 
    cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
    fontSize: '11px', 
    textTransform: 'uppercase',
    transition: 'all 0.25s ease-in-out',
    outline: 'none',
    // হালকা একটি হোভার বা প্রেসড ইফেক্ট (মোবাইলের জন্য)
    opacity: selectedIds.length > 0 ? 1 : 0.5
  }}
  // একটিভ অবস্থায় বাটনে চাপ দিলে ব্যাকগ্রাউন্ড সামান্য ইনভার্ট হওয়ার ফিল দেওয়ার জন্য (ঐচ্ছিক)
  onMouseEnter={(e) => {
    if(selectedIds.length > 0) {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    }
  }}
  onMouseLeave={(e) => {
    if(selectedIds.length > 0) {
      e.currentTarget.style.background = 'transparent';
    }
  }}
>
  PROCEED TO CHECKOUT ({selectedIds.length})
</button>

    
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CartOverlay;
