import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function CartModal({ onClose }) {
  const { cart, removeFromCart } = useCart();
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', method: '', sender_no: '', txn_id: '' });

  const total = cart.reduce((sum, item) => {
    const price = parseInt(item.priceText.replace(/[^0-9]/g, "")) || 0;
    return sum + price;
  }, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: cart, total, ...formData })
    });

    if (response.ok) {
      window.location.href = "/order-success"; // অথবা সরাসরি রেসপন্স দেখান
    } else {
      alert("Something went wrong!");
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, padding: '20px', overflowY: 'auto', color: '#fff' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>CLOSE</button>
        <h2 style={{ textAlign: 'center', letterSpacing: '4px', margin: '20px 0' }}>YOUR BAG</h2>

        {cart.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
            <span>{item.name}</span>
            <span>৳{item.priceText.replace(/[^0-9]/g, "")} <button onClick={() => removeFromCart(index)} style={{ border: 'none', background: 'none', color: 'red' }}>✕</button></span>
          </div>
        ))}

        <h3 style={{ textAlign: 'right' }}>TOTAL: ৳{total}</h3>

        <form onSubmit={handleCheckout} style={{ marginTop: '20px' }}>
          <input required placeholder="NAME" onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }} />
          <input required placeholder="PHONE" onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }} />
          <textarea required placeholder="ADDRESS" onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }} />
          
          <select onChange={(e) => setFormData({...formData, method: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }}>
            <option>Bkash</option><option>Nagad</option><option>Rocket</option>
          </select>
          
          <input required placeholder="SENDER NO" onChange={(e) => setFormData({...formData, sender_no: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#111', border: '1px solid #333', color: '#fff' }} />
          <input required placeholder="TXN ID" onChange={(e) => setFormData({...formData, txn_id: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '20px', background: '#111', border: '1px solid #333', color: '#fff' }} />
          
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>CONFIRM ORDER</button>
        </form>
      </div>
    </div>
  );
}
