import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartModal({ onClose }) {
  const { cart, removeFromCart } = useCart();

  const total = cart.reduce((sum, item) => {
    const price = parseInt(item.priceText.replace(/[^0-9]/g, "")) || 0;
    return sum + price;
  }, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, padding: '20px', overflowY: 'auto' }}>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>CLOSE</button>
      
      <div style={{ maxWidth: '400px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '18px', letterSpacing: '4px', marginBottom: '30px', textAlign: 'center' }}>YOUR BAG ({cart.length})</h2>
        
        {cart.length === 0 ? <p style={{ textAlign: 'center', color: '#444' }}>BAG IS EMPTY</p> : (
          <div>
            {cart.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                <div>
                  <p style={{ fontSize: '14px' }}>{item.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>{item.priceText}</p>
                </div>
                <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>TOTAL: ৳{total}</p>
              <button style={{ width: '100%', padding: '15px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>CHECKOUT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
