import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH (PERSONAL)', value: 'bkash' },
  { label: 'NAGAD (PERSONAL)', value: 'nagad' },
  { label: 'ROCKET (PERSONAL)', value: 'rocket' }
];

// ⚡ এখানে selectedItems প্রপ্স যোগ করা হয়েছে
export default function Checkout({ selectedItems, onSuccess }: { selectedItems: CartItem[], onSuccess: () => void }) {
  // 🛠️ এখান থেকে cartItems এবং totalPrice বাদ দিয়ে শুধু clearCart রাখা হয়েছে
  const { clearCart } = useCart() as any;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // রেসপনসিভ লেআউটের জন্য স্ক্রিন সাইজ ট্র্যাকিং
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ⚡ এখন টোটাল প্রাইস হিসাব হবে শুধুমাত্র সিলেক্ট করা আইটেমগুলোর ওপর ভিত্তি করে
  const displayTotal = selectedItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) return setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');

    if (paymentMethod !== 'cod' && (!transactionId.trim() || !formData.senderPhone.trim())) {
      return setErrorMessage('SENDER NUMBER AND TRANSACTION ID ARE REQUIRED.');
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN ALL REQUIRED SHIPPING FIELDS.');
    }

    setLoading(true);
    try {
      // প্রোফাইলে স্ট্যাটাস দেখানোর জন্য কারেন্ট লগইন করা ইউজারের ID নেওয়া হচ্ছে
      const { data: { user } } = await supabase.auth.getUser();

      // ১. ওর্ডার্স টেবিলে ডাটা ইনসার্ট (user_id সহ)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null, 
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          sender_phone: paymentMethod !== 'cod' ? formData.senderPhone : null,
          payment_method: paymentMethod,
          transaction_id: paymentMethod !== 'cod' ? transactionId : null,
          total_amount: displayTotal,
          status: 'pending' 
        }])
        .select().single();

      if (orderError) throw orderError;

      // ২. অর্ডার আইটেমস টেবিলে ডাটা ইনসার্ট (⚡ এখন cartItems এর বদলে selectedItems ম্যাপ হবে)
      const items = selectedItems.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size || null,   
        color: item.color || null  
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      clearCart();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'ORDER FAILED. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  // NOMAD প্রিমিয়াম লাক্সারি থিম স্টাইলস
  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '20px 15px 60px 15px' : '50px 20px 80px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    layoutGrid: {
      display: 'flex',
      flexDirection: isMobile ? 'column-reverse' as const : 'row' as const,
      gap: '50px',
      alignItems: 'flex-start',
    },
    leftColumn: {
      flex: '1 1 60%',
      width: '100%',
    },
    rightColumn: {
      flex: '1 1 40%',
      width: '100%',
      position: isMobile ? 'relative' as const : 'sticky' as const,
      top: '40px',
      background: '#050505',
      border: '1px solid #111',
      padding: '30px',
    },
    sectionHeading: {
      fontSize: '11px',
      letterSpacing: '3px',
      color: '#666',
      textTransform: 'uppercase' as const,
      marginBottom: '30px',
      borderBottom: '1px solid #111',
      paddingBottom: '10px',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #1a1a1a',
      padding: '18px 0',
      color: '#fff',
      fontSize: '12px',
      letterSpacing: '2px',
      marginBottom: '30px',
      outline: 'none',
      borderRadius: 0,
      transition: 'border-color 0.4s ease',
    },
    productRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      paddingBottom: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #111',
    },
    productImg: {
      width: '60px',
      height: '75px',
      objectFit: 'cover' as const,
      background: '#111',
      border: '1px solid #1a1a1a',
    },
    submitBtn: {
      width: '100%',
      padding: '20px',
      background: '#fff',
      border: '1px solid #fff',
      color: '#000',
      cursor: 'pointer',
      letterSpacing: '4px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      transition: 'all 0.3s ease-in-out',
      marginTop: '20px',
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <div style={styles.layoutGrid}>

          {/* বাম পাশ: কাস্টমার এবং পেমেন্ট ইনফো ফর্ম */}
          <div style={styles.leftColumn}>

            {/* সেকশন ১:  শিপিং ঠিকানা */}
            <h2 style={styles.sectionHeading}>01 / SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'}
            />
            <input
              style={styles.input}
              placeholder="CONTACT NUMBER"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'}
            />
            <input
              style={styles.input}
              placeholder="SHIPPING ADDRESS (STREET, CITY, ZIP)"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'}
            />

            {/* সেকশন ২: পেমেন্ট মেথড */}
            <h2 style={{ ...styles.sectionHeading, marginTop: '20px' }}>02 / PAYMENT METHOD</h2>
            <div style={{ position: 'relative', marginBottom: '35px' }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  ...styles.input, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  color: paymentMethod ? '#fff' : '#666',
                  borderBottom: isDropdownOpen ? '1px solid #fff' : '1px solid #1a1a1a'
                }}
              >
                <span style={{ fontSize: '12px', letterSpacing: '2px' }}>{paymentLabel}</span>
                <span style={{ fontSize: '8px', transition: 'transform 0.3s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#090909', border: '1px solid #111', zIndex: 9999, marginTop: '-31px' }}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setPaymentMethod(opt.value);
                        setPaymentLabel(opt.label);
                        setIsDropdownOpen(false);
                        setErrorMessage(null);
                      }}
                      style={{
                        padding: '18px 20px',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        color: paymentMethod === opt.value ? '#000' : '#888',
                        backgroundColor: paymentMethod === opt.value ? '#fff' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* এমএফএস মোবাইল ব্যাংকিং প্যানেল */}
            {paymentMethod && paymentMethod !== 'cod' && (
              <div style={{ padding: '30px 25px', background: '#050505', border: '1px solid #111', marginBottom: '40px' }}>
                <p style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', marginBottom: '8px' }}>SEND MONEY TO [PERSONAL]:</p>
                <p style={{ fontSize: '20px', letterSpacing: '3px', marginBottom: '30px', color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>01521731371</p>

                <input
                  style={styles.input}
                  placeholder="SENDER PHONE NUMBER"
                  required
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'}
                />
                <input
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="TRANSACTION ID"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'}
                />
              </div>
            )}

            {errorMessage && (
              <div style={{ color: '#ff4d4d', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '20px', fontFamily: 'monospace' }}>
                {errorMessage.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#000';
                }
              }}
            >
              {loading ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>

          {/* ডান পাশ: স্টিকি অর্ডার সামারি */}
          <div style={styles.rightColumn}>
            <h2 style={{ ...styles.sectionHeading, marginBottom: '25px', borderBottom: '1px solid #222' }}>ORDER SUMMARY</h2>

            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
              {/* ⚡ এখন cartItems এর বদলে selectedItems ম্যাপ হচ্ছে */}
              {selectedItems.map((item: CartItem) => (
                <div key={item.id} style={styles.productRow}>
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/60x75?text=NOMAD'} 
                    alt={item.name} 
                    style={styles.productImg} 
                  />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', letterSpacing: '1px', marginBottom: '5px' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{item.name.toUpperCase()}</span>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>৳{item.price * item.quantity}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', letterSpacing: '1px' }}>
                      QTY: {item.quantity} 
                      {(item.size || item.color) && ` • `}
                      {item.color?.toUpperCase()}{item.color && item.size ? ' / ' : ''}{item.size?.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* হিসাব-নিকাশ টোটাল প্যানেল */}
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', letterSpacing: '1px', marginBottom: '12px', color: '#888' }}>
                <span>SUBTOTAL</span>
                <span style={{ fontFamily: 'monospace' }}>৳{displayTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', letterSpacing: '1px', marginBottom: '20px', color: '#888' }}>
                <span>SHIPPING</span>
                <span style={{ fontSize: '11px', letterSpacing: '1px' }}>COMPLIMENTARY</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', letterSpacing: '2px', paddingTop: '15px', borderTop: '1px dashed #222', color: '#fff', fontWeight: 'bold' }}>
                <span>TOTAL</span>
                <span style={{ fontFamily: 'monospace' }}>৳{displayTotal}</span>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
