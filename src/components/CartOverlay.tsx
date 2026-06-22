import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, addToCart, decrementQuantity } = useCart();
  
  // সিলেক্ট করা আইটেমের আইডি রাখার স্টেট
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ডিফল্টভাবে সব আইটেম সিলেক্টেড থাকবে
  useEffect(() => {
    setSelectedIds(cartItems.map(item => item.id));
  }, [cartItems]);

  if (!isCartOpen) return null;

  // শুধু সিলেক্ট করা আইটেমগুলোর সাবটোটাল হিসাব করা
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'black', zIndex: 2000, overflowY: 'auto', padding: '40px 20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <button onClick={() => setIsCartOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer' }}>&times;</button>
        <h2 style={{ color: 'white', textAlign: 'center', letterSpacing: '3px', marginBottom: '40px' }}>NOMAD BAG</h2>

        {cartItems.length === 0 ? (
          <p style={{ color: '#555', textAlign: 'center' }}>YOUR BAG IS EMPTY</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {cartItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', opacity: isSelected ? 1 : 0.4 }}>
                  
                  {/* 💎 প্রিমিয়াম সিলেকশন বক্স */}
                  <div 
                    onClick={() => toggleSelect(item.id)}
                    style={{ width: '18px', height: '18px', border: '1px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isSelected && <div style={{ width: '8px', height: '8px', backgroundColor: 'white' }} />}
                  </div>

                  <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '70px', objectFit: 'cover' }} />
                  
                  <div style={{ flex: 1, color: 'white' }}>
                    <div style={{ fontSize: '14px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>৳{item.price}</div>
                    
                    {/* প্লাস-মাইনাস বাটন */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                      <button onClick={() => decrementQuantity(item.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>—</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>

                  <div style={{ color: 'white' }}>৳{item.price * item.quantity}</div>
                </div>
              );
            })}

            {/* সাবটোটাল এবং চেকআউট */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '20px' }}>
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <button 
                disabled={selectedIds.length === 0}
                style={{ width: '100%', padding: '15px', backgroundColor: selectedIds.length > 0 ? 'white' : '#222', color: selectedIds.length > 0 ? 'black' : '#555', border: 'none', fontWeight: 'bold', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed' }}
              >
                PROCEED TO CHECKOUT ({selectedIds.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartOverlay;
