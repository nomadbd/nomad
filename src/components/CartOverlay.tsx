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
          <h3 style={{ fontSize: '12px', letterSpacing: '1px', color: '#555', marginBottom: '25px', textTransform: 'uppercase' }}>
            Cart Items ({cartItems.length})
          </h3>

          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px', letterSpacing: '1px' }}>YOUR BAG IS EMPTY</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {cartItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderBottom: '1px solid #111', paddingBottom: '20px', opacity: isSelected ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                    
                    {/* প্রোডাক্ট ইমেজ */}
                    <img src={item.image_url} alt={item.name} style={{ width: '75px', height: '90px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />
                    
                    {/* তথ্য ও কন্ট্রোল এরিয়া */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      
                      {/* 🟢 লাইন ১: প্রোডাক্টের নাম এবং একদম ডান পাশে গোল সবুজ চেকবক্স */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'normal', color: 'white', letterSpacing: '0.5px' }}>
                          {item.name}
                        </h4>
                        
                        {/* রাউন্ডেড গ্রীন চেকবক্স (ক্লিক করলে সবুজ হবে, ভেতরে টিক চিহ্ন আসবে) */}
                        <div 
                          onClick={() => toggleSelect(item.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '1px solid #10b981' : '1px solid #444',
                            backgroundColor: isSelected ? '#10b981' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            userSelect: 'none'
                          }}
                        >
                          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      </div>

                      {/* লাইন ২: একক মূল্য এবং ডান পাশে মোট মূল্য */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>৳{item.price}</p>
                        <div style={{ color: 'white', fontSize: '15px', fontFamily: 'monospace' }}>
                          ৳{item.price * item.quantity}
                        </div>
                      </div>
                      
                      {/* লাইন ৩: প্লাস-মাইনাস স্টিপার বাটন */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '4px' }}>
                        <button 
                          onClick={() => decrementQuantity(item.id)} 
                          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', padding: '0 5px', transition: 'color 0.2s' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
                          onMouseOut={(e) => (e.currentTarget.style.color = '#666')}
                        >
                          —
                        </button>
                        <span style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', minWidth: '10px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => incrementQuantity(item.id)} 
                          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', padding: '0 5px', transition: 'color 0.2s' }}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
                          onMouseOut={(e) => (e.currentTarget.style.color = '#666')}
                        >
                          +
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* সাবটোটাল এবং চেকআউট সেকশন */}
              <div style={{ marginTop: '10px', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '15px', letterSpacing: '0.5px' }}>
                  <span style={{ color: '#777' }}>Subtotal</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>৳{subtotal}</span>
                </div>
                
                <button 
                  disabled={selectedIds.length === 0}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    backgroundColor: selectedIds.length > 0 ? 'white' : '#222', 
                    color: selectedIds.length > 0 ? 'black' : '#555', 
                    border: 'none', 
                    fontWeight: 'bold', 
                    letterSpacing: '2px', 
                    cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                    fontSize: '12px', 
                    textTransform: 'uppercase', 
                    transition: 'opacity 0.2s' 
                  }}
                  onMouseOver={(e) => { if(selectedIds.length > 0) e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onClick={() => alert("Proceeding to Checkout with " + selectedIds.length + " items.")}
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
