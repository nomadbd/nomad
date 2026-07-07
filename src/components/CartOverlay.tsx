import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Checkout from './Checkout'; 
import { supabase } from '../supabaseClient'; // 🔥 গেস্ট অর্ডারের লাইভ স্ট্যাটাস চেক করার জন্য সুপাবেস ইম্পোর্ট

const CartOverlay = () => {
  const { cartItems, isCartOpen, setIsCartOpen, incrementQuantity, decrementQuantity } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🔥 গেস্ট অর্ডার ট্র্যাকিংয়ের জন্য নতুন স্টেটসমূহ
  const [guestOrder, setGuestOrder] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsCheckingOut(false); 
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  // ভ্যারিয়েন্টসহ ইউনিক আইডি ট্র্যাকিং (ID + Color + Size)
  useEffect(() => {
    setSelectedIds(cartItems.map(item => `${item.id}-${item.color || ''}-${item.size || ''}`)); 
  }, [cartItems]);

  // 🔥 কার্ট ওপেন হলে ব্রাউজার মেমরি চেক করে গেস্ট অর্ডারের লাইভ স্ট্যাটাস নিয়ে আসার ইফেক্ট
  useEffect(() => {
    const fetchGuestOrderStatus = async () => {
      const storedGuestOrderId = localStorage.getItem('nomad_guest_order_id');
      
      if (!storedGuestOrderId) {
        setGuestOrder(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, status')
          .eq('id', storedGuestOrderId)
          .single();

        if (!error && data) {
          setGuestOrder(data);
        } else {
          setGuestOrder(null);
        }
      } catch (err) {
        console.error("Error fetching guest order status:", err);
      }
    };

    if (isCartOpen) {
      fetchGuestOrderStatus();
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // সিলেক্টেড ভ্যারিয়েন্টের ওপর ভিত্তি করে সাবটোটাল হিসাব
  const subtotal = cartItems
    .filter(item => selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`))
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  // শুধুমাত্র সিলেক্টেড প্রোডাক্টগুলো ফিল্টার করে চেকআউটে পাঠানোর জন্য অ্যারে
  const selectedItemsForCheckout = cartItems.filter(item => 
    selectedIds.includes(`${item.id}-${item.color || ''}-${item.size || ''}`)
  );

  const toggleSelect = (itemKey: string) => {
    if (selectedIds.includes(itemKey)) {
      setSelectedIds(selectedIds.filter(key => key !== itemKey));
    } else {
      setSelectedIds([...selectedIds, itemKey]);
    }
  };

  // গেস্ট ট্র্যাকার স্টেপস
  const statusSteps = ['pending', 'received', 'shipped', 'delivered'];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100dvh', /* ⚡ 100vh এর বদলে Dynamic Viewport Height যা মোবাইল ব্রাউজার বারকে চিনে নেয় */
        backgroundColor: 'rgba(0, 0, 0, 0.98)', 
        zIndex: 9999, 
        overflow: 'hidden', 
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
    >
      {/* 📦 মেইন ফ্লেক্স কন্টেইনার (প্যাডিং ভেতরে নিয়ে আসা হয়েছে যাতে কন্টেন্ট নিচে পুশ না হয়) */}
      <div style={{ maxWidth: '500px', width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '30px 20px 0 20px' }}>

        {/* ✖️ ক্লোজ বাটন (⚡ হেডিং লেখার সাথে একই লাইনে অ্যালাইন করা হয়েছে) */}
        <button 
          onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); }} 
          style={{ 
            position: 'absolute', 
            top: '28px', 
            right: '20px', 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            padding: '5px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 10 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: '400', letterSpacing: '3px', textAlign: 'center', marginBottom: '35px', fontFamily: 'monospace', color: 'white', flexShrink: 0 }}>
          {isCheckingOut ? 'CHECKOUT' : 'NOMAD BAG'}
        </h2>

        {isCheckingOut ? (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
            <Checkout 
              selectedItems={selectedItemsForCheckout} 
              onSuccess={() => {
                setIsCheckingOut(false);
                setIsCartOpen(false);
              }} 
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* 🔥 গেস্ট ইউজারদের লাইভ অর্ডার ট্র্যাকার ইউআই (UI) সেকশন */}
            {guestOrder && (
              <div style={{ backgroundColor: '#050505', border: '1px solid #111', padding: '15px', marginBottom: '20px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '8px', letterSpacing: '1.5px', color: '#555', fontWeight: 600 }}>GUEST ORDER TRACKING</span>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('nomad_guest_order_id');
                      setGuestOrder(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '8px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', padding: 0, fontWeight: 'bold' }}
                  >
                    Dismiss
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#fff', marginBottom: '15px', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                  <span>#{guestOrder.id.slice(0, 8).toUpperCase()}</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#fff', fontSize: '10px', letterSpacing: '1px' }}>{guestOrder.status}</span>
                </div>
                
                {/* মিনিমাল ডট স্টেপার */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {statusSteps.map((step, idx) => {
                    const currentStatusLower = guestOrder.status ? guestOrder.status.toLowerCase() : 'pending';
                    const currentStepIndex = statusSteps.indexOf(currentStatusLower);
                    const isActive = idx <= currentStepIndex;

                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#fff' : '#222',
                          boxShadow: isActive ? '0 0 6px #fff' : 'none',
                          transition: 'all 0.3s ease'
                        }} />
                        <span style={{ fontSize: '7px', letterSpacing: '0.5px', marginTop: '6px', color: isActive ? '#aaa' : '#333', textTransform: 'uppercase' }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#666', marginBottom: '25px', textTransform: 'uppercase', fontWeight: '500', flexShrink: 0 }}>
              Cart Items ({cartItems.length})
            </h3>

            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '60px 0', fontSize: '13px', letterSpacing: '1.5px', flex: 1 }}>YOUR BAG IS EMPTY</p>
            ) : (
              <>
                {/* 📜 স্ক্রলযোগ্য প্রোডাক্ট লিস্ট এরিয়া */}
                <div className="cart-items-scroll-area" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px', paddingRight: '5px', paddingBottom: '20px' }}>
                  {cartItems.map((item) => {
                    const itemKey = `${item.id}-${item.color || ''}-${item.size || ''}`;
                    const isSelected = selectedIds.includes(itemKey);

                    const itemImage = item.image_url || 
                      item.product_media?.find((m: any) => m.media_type === 'image')?.media_url || 
                      item.product_media?.[0]?.media_url;

                    return (
                      <div key={itemKey} style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '25px' }}>

                        <img 
                          src={itemImage} 
                          alt={item.name} 
                          style={{ width: '75px', height: '95px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111' }} 
                        />

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '400', color: '#efefef', letterSpacing: '0.5px', paddingRight: '15px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                {item.name}
                              </h4>
                              {(item.color || item.size) && (
                                <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
                                </div>
                              )}
                            </div>

                            <div 
                              onClick={() => toggleSelect(itemKey)}
                              style={{ width: '16px', height: '16px', borderRadius: '50%', border: isSelected ? '1px solid #fff' : '1px solid #333', backgroundColor: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none', flexShrink: 0 }}
                            >
                              {isSelected && <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                              <button 
                                onClick={() => decrementQuantity(item.id, item.color, item.size)} 
                                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                              >
                                —
                              </button>
                              <span style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', minWidth: '24px', textAlign: 'center', userSelect: 'none' }}>{item.quantity}</span>
                              <button 
                                onClick={() => incrementQuantity(item.id, item.color, item.size)} 
                                style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px', width: '32px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ color: 'white', fontSize: '14px', fontFamily: 'monospace', fontWeight: '400' }}>৳{item.price * item.quantity}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🔒 ফিক্সড বটম এরিয়া (বাটন ও টেক্সটকে উপরে তোলার জন্য প্যাডিং বৃদ্ধি করা হয়েছে) */}
                <div style={{ 
                  marginTop: 'auto', 
                  padding: '15px 0 calc(35px + env(safe-area-inset-bottom)) 0', /* 🛠️ ৩৫ পিক্সেল প্যাডিং বাটন ও টেক্সটকে মোবাইল ব্রাউজার বারের উপরে দৃশ্যমান রাখবে */
                  backgroundColor: 'rgba(0, 0, 0, 0.98)', 
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  flexShrink: 0 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '14px', letterSpacing: '0.5px' }}>
                    <span style={{ color: '#666' }}>Subtotal</span>
                    <span style={{ color: 'white', fontWeight: '500', fontFamily: 'monospace', fontSize: '16px' }}>৳{subtotal}</span>
                  </div>

                  <button 
                    disabled={selectedIds.length === 0}
                    onClick={() => setIsCheckingOut(true)} 
                    style={{ 
                      width: '100%', padding: '16px', background: 'transparent', 
                      color: selectedIds.length > 0 ? 'white' : '#444', 
                      border: selectedIds.length > 0 ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid #222', 
                      fontWeight: '600', letterSpacing: '3px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', 
                      fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.2s ease',
                      outline: 'none', opacity: selectedIds.length > 0 ? 1 : 0.3
                    }}
                  >
                    PROCEED TO CHECKOUT ({selectedIds.length})
                  </button>

                  {/* 🪙 মিনিমালিস্ট লাক্সারি মেসেজ (এখন এটি নিশ্চিতভাবে বাটনের নিচে শো করবে) */}
                  <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '9px', color: '#444', letterSpacing: '2px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    Secure Checkout • Nomad Concepts
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .cart-items-scroll-area::-webkit-scrollbar { display: none; }
        .cart-items-scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CartOverlay;
