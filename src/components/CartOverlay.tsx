import React from 'react';
import { useCart } from '../context/CartContext';

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, addToCart, decrementQuantity } = useCart();

  if (!isCartOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.96)', zIndex: 2000, overflowY: 'auto', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>

        {/* বন্ধ করার বাটন */}
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
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #111', paddingBottom: '20px' }}>
                  
                  {/* প্রডাক্ট ইমেজ */}
                  <img src={item.image_url} alt={item.name} style={{ width: '75px', height: '90px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />
                  
                  {/* প্রডাক্ট ইনফো ও প্রিমিয়াম স্টিপার */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'normal', color: 'white', letterSpacing: '0.5px' }}>{item.name}</h4>
                    <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>৳{item.price}</p>
                    
                    {/* 💎 প্রিমিয়াম প্লাস-মাইনাস কন্ট্রোলার (কোনো সস্তা বর্ডার বা ব্যাকগ্রাউন্ড নেই) */}
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
                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })} 
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', padding: '0 5px', transition: 'color 0.2s' }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
                        onMouseOut={(e) => (e.currentTarget.style.color = '#666')}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* ডান পাশে টোটাল প্রাইস প্রদর্শন */}
                  <div style={{ color: 'white', fontSize: '15px' }}>
                    ৳{item.price * item.quantity}
                  </div>

                </div>
              ))}

              {/* সাবটোটাল এবং চেকআউট বাটন */}
              <div style={{ marginTop: '10px', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '15px', letterSpacing: '0.5px' }}>
                  <span style={{ color: '#777' }}>Subtotal</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>৳{subtotal}</span>
                </div>
                
                <button 
                  style={{ width: '100%', padding: '16px', backgroundColor: 'white', color: 'black', border: 'none', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', transition: 'opacity 0.2s' }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  onClick={() => alert("Proceeding to Shipping Form...")}
                >
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
