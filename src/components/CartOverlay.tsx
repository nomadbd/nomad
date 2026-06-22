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
                      
                      {/* লাইন ১: প্রোডাক্টের নাম এবং গোল চেকবক্স (বড় নাম হ্যান্ডেল করার জন্য আপডেটেড) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '15px', 
                          fontWeight: 'normal', 
                          color: 'white', 
                          letterSpacing: '0.5px',
                          paddingRight: '15px',   // চেকবক্স থেকে নিরাপদ দূরত্ব
                          lineHeight: '1.4',      // ২ লাইনে গেলে দেখতে পরিচ্ছন্ন লাগবে
                          wordBreak: 'break-word' // বড় নাম হলে স্ক্রিন না ভেঙে নিচে নামবে
                        }}>
                          {item.name}
                        </h4>
                        
                        {/* রাউন্ডেড চেকবক্স (স্পষ্ট আনসিলেক্টড বর্ডার ও সাইজ প্রটেকশন সহ) */}
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
                            flexShrink: 0 // নাম বড় হলেও চেকবক্স কখনো চ্যাপ্টা হবে না
                          }}
                        >
                          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      </div>

                      {/* লাইন ২: প্লাস-মাইনাস বাটন (বামে) এবং একমাত্র উজ্জ্বল মোট মূল্য (ডানে) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        
                        {/* প্লাস-মাইনাস স্টিপার (উজ্জ্বল ধূসর বাটন) */}
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
                    textTransform: 'uppercase'
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
