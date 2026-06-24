import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH (PERSONAL)', value: 'bkash' },
  { label: 'NAGAD (PERSONAL)', value: 'nagad' },
  { label: 'ROCKET (PERSONAL)', value: 'rocket' }
];

export default function Checkout({ onSuccess }: { onSuccess: () => void }) {
  // totalPrice-এর ব্যাকআপ হিসেবে সেফটি নেট রাখা হলো
  const { cartItems, clearCart, totalPrice } = useCart() as any;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // কার্ট আইটেমগুলোর মোট মূল্য হিসাব করার ব্যাকআপ লজিক
  const displayTotal = totalPrice || cartItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) return setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');
    
    // ক্যাশ অন ডেলিভারি ছাড়া অন্য পেমেন্টে ভ্যালিডেশন চেক
    if (paymentMethod !== 'cod' && (!transactionId.trim() || !formData.senderPhone.trim())) {
      return setErrorMessage('SENDER NUMBER AND TRANSACTION ID ARE REQUIRED.');
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN ALL REQUIRED SHIPPING FIELDS.');
    }

    setLoading(true);
    try {
      // ১. ওর্ডার্স টেবিলে ডাটা ইনসার্ট
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
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

      // ২. অর্ডার আইটেমস টেবিলে ডাটা ইনসার্ট (কার্টের অরিজিনাল সাইজ ও কালারসহ)
      const items = cartItems.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size || null,   // জোরপূর্বক কোনো ইনপুট ভ্যালু যাবে না
        color: item.color || null  // কার্টে যা আছে হুবহু তাই যাবে
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

  // থিম ও লেআউট টোকেন (NOMAD ব্র্যান্ডের মিনিমাল ডার্ক লাক্সারি থিম)
  const styles = {
    container: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box' as const,
      padding: '10px 4px 40px 4px',
      color: '#fff',
      backgroundColor: '#000',
    },
    productBlock: {
      background: '#0a0a0a',
      padding: '18px 20px',
      border: '1px solid #141414',
      marginBottom: '15px',
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #222',
      padding: '16px 0',
      color: '#fff',
      fontSize: '12px',
      letterSpacing: '2px',
      marginBottom: '25px',
      outline: 'none',
      borderRadius: 0,
      transition: 'border-color 0.3s ease',
    },
    errorText: {
      color: '#ff4d4d',
      fontSize: '11px',
      letterSpacing: '1.5px',
      textAlign: 'center' as const,
      marginBottom: '20px',
      fontWeight: 500,
      fontFamily: 'monospace'
    },
    submitBtn: {
      width: '100%',
      padding: '18px',
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      color: '#fff',
      cursor: 'pointer',
      letterSpacing: '3px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      transition: 'all 0.25s ease-in-out',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', boxSizing: 'border-box' }}>

        {/* প্রোডাক্ট সামারি লিস্টিং */}
        <div style={{ marginBottom: '35px' }}>
          {cartItems.map((item: CartItem) => (
            <div key={item.id} style={styles.productBlock}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px', letterSpacing: '0.5px' }}>
                <span style={{ color: '#e5e5e5', fontWeight: 'normal' }}>
                  {item.name.toUpperCase()} <span style={{ color: '#555', fontSize: '11px', fontFamily: 'monospace', marginLeft: '5px' }}>×{item.quantity}</span>
                </span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>৳{item.price * item.quantity}</span>
              </div>

              {/* সরাসরি লেবেল ছাড়া Black / M ফরম্যাটে সামারি প্রদর্শন (যদি ডেটা থাকে) */}
              {(item.color || item.size) && (
                <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: '6px' }}>
                  {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
                </div>
              )}
            </div>
          ))}

          {/* গ্র্যান্ড টোটাল */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '15px 10px 0 10px', letterSpacing: '2px', borderTop: '1px solid #111' }}>
            <span style={{ color: '#888' }}>TOTAL AMOUNT</span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>৳{displayTotal}</span>
          </div>
        </div>

        {/* শিপিং ইনফরমেশন ইনপুট */}
        <input
          style={styles.input}
          placeholder="FULL NAME"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
          onBlur={(e) => e.target.style.borderBottom = '1px solid #222'}
        />
        <input
          style={styles.input}
          placeholder="CONTACT NUMBER"
          required
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
          onBlur={(e) => e.target.style.borderBottom = '1px solid #222'}
        />
        <input
          style={styles.input}
          placeholder="SHIPPING ADDRESS"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
          onBlur={(e) => e.target.style.borderBottom = '1px solid #222'}
        />

        {/* কাস্টম মিনিমাল ড্রপডাউন সিলেক্টর */}
        <div style={{ position: 'relative', marginBottom: '35px' }}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              ...styles.input, 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              color: paymentMethod ? '#fff' : '#888',
              borderBottom: isDropdownOpen ? '1px solid #666' : '1px solid #222'
            }}
          >
            <span>{paymentLabel}</span>
            <span style={{ fontSize: '8px', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#050505', border: '1px solid #141414', zIndex: 9999, marginTop: '-15px' }}>
              {PAYMENT_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setPaymentMethod(opt.value);
                    setPaymentLabel(opt.label);
                    setIsDropdownOpen(false);
                    setErrorMessage(null); // পেমেন্ট মেথড চেঞ্জ হলে এরর ক্লিন হবে
                  }}
                  style={{
                    padding: '16px 20px',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #0a0a0a',
                    color: paymentMethod === opt.value ? '#fff' : '#666',
                    backgroundColor: paymentMethod === opt.value ? '#0a0a0a' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* এমএফএস মোবাইল ব্যাংকিং প্যানেল (ক্যাশ অন ডেলিভারি মোডে এটি হাইড থাকবে) */}
        {paymentMethod && paymentMethod !== 'cod' && (
          <div style={{ padding: '25px 20px', background: '#050505', border: '1px solid #141414', marginBottom: '30px' }}>
            <p style={{ fontSize: '10px', color: '#666', letterSpacing: '2px', marginBottom: '6px', textTransform: 'uppercase' }}>SEND MONEY TO [PERSONAL]:</p>
            <p style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '25px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>01521731371</p>

            <input
              style={styles.input}
              placeholder="SENDER PHONE NUMBER"
              required
              value={formData.senderPhone}
              onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #222'}
            />
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="TRANSACTION ID"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #222'}
            />
          </div>
        )}

        {/* এরর মেসেজ ডিসপ্লে */}
        {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

        {/* সাবমিট বাটন */}
        <button
          type="submit"
          disabled={loading}
          style={styles.submitBtn}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#fff';
            }
          }}
        >
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </form>
    </div>
  );
}
