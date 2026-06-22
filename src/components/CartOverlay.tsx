import React, { useState, useEffect } from 'react'; // ✅ ফিক্সড: 'Import' এর বদলে 'import' করা হয়েছে
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const CartOverlay = ({ session }: { session: any }) => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart } = useCart();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // প্রতিবার কার্ট খুললে লোকাল স্টোরেজ চেক করবে এবং সুপাবেজ থেকে লাইভ স্ট্যাটাস আনবে
  useEffect(() => {
    const fetchLiveStatus = async () => {
      const savedOrderId = localStorage.getItem('nomad_guest_order_id');

      if (!savedOrderId || !isCartOpen) {
        setOrderStatus(null);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', savedOrderId)
        .single();

      if (data && !error) {
        setOrderStatus(data.status);
      } else {
        setOrderStatus(null); // যদি ডাটাবেজে অর্ডার না মেলে বা ডিলিট হয়ে যায়
      }
    };

    fetchLiveStatus();
  }, [isCartOpen]);

  if (!isCartOpen) return null;

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

        {/* ⚡ আল্ট্রা-মিনিমাল লাইভ স্ট্যাটাস (কোনো ইনপুট ফর্ম নেই) */}
        {!session && orderStatus && (
          <div style={{ textAlign: 'center', padding: '12px', border: '1px solid #1a1a1a', backgroundColor: '#050505', marginBottom: '30px', letterSpacing: '1px' }}>
            <span style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>YOUR ORDER STATUS</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4caf50', textTransform: 'uppercase' }}>
              ● {orderStatus}
            </span>
          </div>
        )}

        {/* 🛒 কার্ট প্রোডাক্ট এরিয়া */}
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
