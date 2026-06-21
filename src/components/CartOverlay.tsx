import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const CartOverlay = ({ session }: { session: any }) => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart } = useCart();
  
  // ট্র্যাকিং স্টেটসমূহ
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState(''); // খালি ইনপুট বা ভুল ডাটার এরর মেসেজ

  if (!isCartOpen) return null;

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setTrackingStatus(null);

    // ⚡ কাস্টম ভ্যালিডেশন: ইনপুট না দিয়ে বাটনে ক্লিক করলে সুন্দর করে জানিয়ে দেবে
    if (!orderId.trim() || !phone.trim()) {
      setErrorMessage('অর্ডার আইডি এবং ফোন নম্বর—দুটি তথ্যই দেওয়া আবশ্যক।');
      return;
    }

    try {
      // ডাটাবেজ থেকে চেক করা
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId.trim())
        .eq('phone', phone.trim())
        .single();

      if (error || !data) {
        setErrorMessage('দুঃখিত, এই আইডি বা ফোন নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি।');
      } else {
        // সফল হলে ফর্ম অদৃশ্য হয়ে যাবে এবং স্ট্যাটাস সেট হবে
        setTrackingStatus(data.status);
      }
    } catch (err) {
      setErrorMessage('নেটওয়ার্ক সমস্যা! অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.96)', zIndex: 2000, overflowY: 'auto', padding: '40px 20px', boxSizing: 'border-box' }}>
      
      <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
        
        {/* ক্লোজ বাটন */}
        <button onClick={() => setIsCartOpen(false)} style={{ position: 'absolute', top: '-10px', right: '0', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}>
          &times;
        </button>

        <h2 style={{ fontSize: '20px', letterSpacing: '2px', textAlign: 'center', marginBottom: '35px', fontFamily: 'monospace' }}>
          NOMAD BAG
        </h2>

        {/* ⚡ গেস্ট ট্র্যাকিং এরিয়া (লগইন না থাকলে সরাসরি প্রথমে দেখাবে) */}
        {!session && (
          <div style={{ backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #1c1c1c', marginBottom: '30px', transition: 'all 0.3s ease' }}>
            
            {/* কন্ডিশন ১: স্ট্যাটাস যখন নাই, তখন শুধু ইনপুট ফর্ম ও বাটন দেখাবে */}
            {!trackingStatus ? (
              <form onSubmit={handleTrackOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', letterSpacing: '1px', color: '#666' }}>অর্ডারের অবস্থা জানুন</h4>
                
                <input type="text" placeholder="অর্ডার আইডি দিন" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={{ padding: '12px', background: 'black', border: '1px solid #222', color: 'white', fontSize: '14px', outline: 'none' }} />
                <input type="text" placeholder="ফোন নম্বর দিন" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '12px', background: 'black', border: '1px solid #222', color: 'white', fontSize: '14px', outline: 'none' }} />
                
                {/* কাস্টম ভ্যালিডেশন বা ডাটাবেজ এরর মেসেজ */}
                {errorMessage && (
                  <div style={{ fontSize: '13px', color: '#ff4444', marginTop: '2px' }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <button type="submit" style={{ padding: '12px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', marginTop: '4px' }}>
                  Track your order
                </button>
              </form>
            ) : (
              /* কন্ডিশন ২: বাটনে ক্লিকের পর ফর্ম ও বাটন অদৃশ্য হয়ে ঠিক এই জায়গায় স্ট্যাটাস ভেসে উঠবে */
              <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.5s ease' }}>
                <span style={{ fontSize: '12px', color: '#666', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>ORDER STATUS ({orderId})</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50', letterSpacing: '1px' }}>
                  ● {trackingStatus.toUpperCase()}
                </div>
                {/* গেস্ট চাইলে আবার চেক করার জন্য একটি রিস্টার্ট বাটন (ঐচ্ছিক) */}
                <button onClick={() => { setTrackingStatus(null); setOrderId(''); setPhone(''); }} style={{ background: 'none', border: 'none', color: '#555', fontSize: '11px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                  Track Another Order
                </button>
              </div>
            )}

          </div>
        )}

        {/* ⚡ কার্ট প্রোডাক্ট এরিয়া (হালকা গ্যাপ দিয়ে নিচে থাকবে) */}
        <div>
          <h3 style={{ fontSize: '13px', letterSpacing: '1px', color: '#555', marginBottom: '15px', textTransform: 'uppercase' }}>
            Cart Items ({cartItems.length})
          </h3>

          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#444', padding: '30px 0', fontSize: '14px' }}>Your shopping bag is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #0f0f0f', paddingBottom: '15px' }}>
                  <img src={item.image_url} alt={item.name} style={{ width: '70px', height: '80px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'normal' }}>{item.name}</h4>
                    <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>৳{item.price} x {item.quantity}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                    Remove
                  </button>
                </div>
              ))}

              {/* সাবটোটাল ও চেকআউট বাটন */}
              <div style={{ marginTop: '15px', padding: '15px 0', borderTop: '1px solid #1c1c1c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '16px' }}>
                  <span style={{ color: '#777' }}>Subtotal</span>
                  <span>৳{totalPrice}</span>
                </div>
                <button style={{ width: '100%', padding: '14px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', letterSpacing: '1px', cursor: 'pointer', fontSize: '13px' }}>
                  PROCEED TO CHECKOUT
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
