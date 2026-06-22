import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  // সিলেক্ট করা আইটেমগুলোর আইডি ট্র্যাক করার স্টেট
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔒 জাদুকরী সমাধান: বডি স্ক্রল লক (Body Scroll Lock)
  // কার্ট ওপেন হলে ব্যাকগ্রাউন্ড পেজ স্ক্রল হবে না, বন্ধ হলে আবার স্বাভাবিক হবে।
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // কম্পোনেন্ট আনমাউন্ট হলে সেফটি ক্লিনআপ
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

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
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,   // 💡 ডেক্সটপে চারকোনা লক নিশ্চিত করতে যুক্ত করা হলো
        bottom: 0,  // 💡 ডেক্সটপে চারকোনা লক নিশ্চিত করতে যুক্ত করা হলো
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'rgba(0, 0, 0, 0.98)', // ✨ ব্যাকগ্রাউন্ড লিক বন্ধ করতে অপাসিটি সামান্য বাড়ানো হলো (.98)
        zIndex: 9999, // 💡 সর্বোচ্চ জেন-ইনডেক্স যাতে কোনো এলিমেন্ট এর ওপরে না উঠতে পারে
        overflowY: 'auto', 
        padding: '40px 20px', 
        boxSizing: 'border-box' 
      }}
    >
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
                        
                        {/* 🎨 আপডেটেড লাক্সারি সফট অফ-হোয়াইট কালার */}
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '15px', 
                          fontWeight: 'normal', 
                          color: '#e5e5e5', // ✨ পিওর হোয়াইটের বদলে সফট অফ-হোয়াইট করা হলো
                          letterSpacing: '0.5px',
                          paddingRight: '15px',   
                          lineHeight: '1.4',      
                          wordBreak: 'break-word' 
                        }}>
                          {item.name}
                        </h4>

                        {/* আল্ট্রা-প্রিমিয়াম রাউন্ডেড চেকবক্স */}
                        <div 
                          onClick={() => toggleSelect(item.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '1px solid #fff' : '1px solid #444',
                            backgroundColor: isSelected ? '#fff' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            userSelect: 'none',
                            flexShrink: 0 
                          }}
                        >
                          {isSelected && <span style={{ color: '#000', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
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

                {/* আল্ট্রা-লাক্সারি লাইট বর্ডার ও হোয়াইট ফন্ট বাটন */}
                <button 
                  disabled={selectedIds.length === 0}
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    background: 'transparent', 
                    color: selectedIds.length > 0 ? 'white' : '#555', 
                    border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid #222', 
                    fontWeight: '600', 
                    letterSpacing: '3px', 
                    cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                    fontSize: '11px', 
                    textTransform: 'uppercase',
                    transition: 'all 0.25s ease-in-out',
                    outline: 'none',
                    opacity: selectedIds.length > 0 ? 1 : 0.4
                  }}
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
