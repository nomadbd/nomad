import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

// ইন্টারফেস টাইপস (বিশাল কোডবেসের টাইপ-সেফটির জন্য)
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface VariantDetail {
  size: string;
  color: string;
}

interface VariantsState {
  [key: string]: VariantDetail;
}

const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH (PERSONAL)', value: 'bkash' },
  { label: 'NAGAD (PERSONAL)', value: 'nagad' },
  { label: 'ROCKET (PERSONAL)', value: 'rocket' },
  { label: 'UPAY (PERSONAL)', value: 'upay' }
];

export default function Checkout({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart() as { 
    cartItems: CartItem[]; 
    clearCart: () => void; 
    totalPrice: number; 
  };
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // কাস্টম লাক্সারি ড্রপডাউন স্টেট
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // কার্ট আইটেমের ডিফল্ট ভেরিয়েন্ট স্টেট ম্যাপিং
  const [variants, setVariants] = useState<VariantsState>(
    cartItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { size: item.size || 'M', color: item.color || 'BLACK' }
    }), {})
  );

  const updateVariant = (id: string, key: 'size' | 'color', value: string) => {
    setVariants(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) {
      setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');
      return;
    }
    if (paymentMethod !== 'cod' && (!transactionId || !formData.senderPhone)) {
      setErrorMessage('SENDER NUMBER AND TRANSACTION ID ARE REQUIRED.');
      return;
    }

    setLoading(true);
    try {
      // ১. 'orders' টেবিলে ডেটা ইনসার্ট
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          sender_phone: paymentMethod !== 'cod' ? formData.senderPhone : null,
          payment_method: paymentMethod,
          transaction_id: paymentMethod !== 'cod' ? transactionId : null,
          total_amount: totalPrice,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // ২. 'order_items' টেবিলের জন্য অ্যারে প্রস্তুতকরণ
      const items = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: variants[item.id].size,
        color: variants[item.id].color
      }));

      // ৩. 'order_items' টেবিলে বাল্ক ইনসার্ট
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

  // সিগনেচার মিনিমালিস্ট ডিজাইন টোকেনস (CSS-in-JS)
  const styles = {
    container: {
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      padding: '20px 30px 100px 30px',
      color: '#fff',
      backgroundColor: '#000',
      scrollbarWidth: 'none' as const, // Firefox এর জন্য স্ক্রলবার হাইড
    },
    heading: {
      fontSize: '11px',
      letterSpacing: '5px',
      marginBottom: '50px',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
      fontWeight: 400,
      color: '#fff'
    },
    input: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #222',
      padding: '16px 0',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '25px',
      outline: 'none',
      borderRadius: 0,
      textTransform: 'uppercase' as const,
      fontFamily: 'inherit',
      transition: 'border-color 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
    },
    itemRow: {
      marginBottom: '25px',
      borderBottom: '1px solid #111',
      paddingBottom: '20px'
    },
    label: {
      fontSize: '9px',
      color: '#555',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const
    },
    buttonVariant: (isActive: boolean) => ({
      background: 'transparent',
      color: isActive ? '#fff' : '#444',
      border: 'none',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: isActive ? 500 : 300,
      padding: '2px 8px',
      transition: 'color 0.3s ease',
      letterSpacing: '1.5px'
    }),
    submitBtn: {
      width: '100%',
      padding: '20px',
      background: '#fff',
      border: '1px solid #fff',
      color: '#000',
      cursor: 'pointer',
      letterSpacing: '4px',
      fontSize: '11px',
      fontWeight: 500,
      marginTop: '40px',
      transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
      textTransform: 'uppercase' as const
    },
    errorBanner: {
      color: '#ff3333',
      fontSize: '10px',
      letterSpacing: '2px',
      textAlign: 'center' as const,
      marginBottom: '25px',
      textTransform: 'uppercase' as const
    }
  };

  return (
    <div style={styles.container} className="no-scrollbar">
      <form onSubmit={handleSubmit} noValidate>
        
        <h3 style={styles.heading}>CHECKOUT DETAILS</h3>

        {/* এরর মেসেজ ডিসপ্লে */}
        {errorMessage && <div style={styles.errorBanner}>{errorMessage}</div>}

        {/* কার্ট আইটেম সামারি */}
        <div style={{ marginBottom: '50px' }}>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px', letterSpacing: '1.5px' }}>
                <span style={{ color: '#999', fontWeight: 300 }}>{item.name.toUpperCase()} × {item.quantity}</span>
                <span style={{ fontWeight: 400 }}>৳ {item.price * item.quantity}</span>
              </div>

              {/* লাইভ সাইজ ও কালার মডিফায়ার */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={styles.label}>SIZE:</span>
                  {['S', 'M', 'L', 'XL'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateVariant(item.id, 'size', s)}
                      style={styles.buttonVariant(variants[item.id]?.size === s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={styles.label}>COLOR:</span>
                  <input
                    type="text"
                    value={variants[item.id]?.color}
                    onChange={(e) => updateVariant(item.id, 'color', e.target.value.toUpperCase())}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #222',
                      color: '#fff',
                      fontSize: '11px',
                      width: '70px',
                      outline: 'none',
                      padding: '2px 0',
                      textAlign: 'right',
                      letterSpacing: '1px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* গ্র্যান্ড টোটাল শোকেস */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '30px', letterSpacing: '2px' }}>
            <span style={{ color: '#fff', fontWeight: 300 }}>TOTAL AMOUNT</span>
            <span style={{ fontWeight: 600, borderBottom: '1px double #fff', paddingBottom: '2px' }}>৳ {totalPrice}</span>
          </div>
        </div>

        {/* শিপিং ইনফরমেশন ইনপুটস */}
        <input
          style={styles.input}
          placeholder="FULL NAME"
          required
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = '#fff')}
          onBlur={(e) => (e.target.style.borderColor = '#222')}
        />
        <input
          style={styles.input}
          placeholder="CONTACT NUMBER"
          required
          type="tel"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = '#fff')}
          onBlur={(e) => (e.target.style.borderColor = '#222')}
        />
        <input
          style={styles.input}
          placeholder="SHIPPING ADDRESS"
          required
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = '#fff')}
          onBlur={(e) => (e.target.style.borderColor = '#222')}
        />

        {/* প্রিমিয়াম কাস্টম ড্রপডাউন */}
        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              ...styles.input,
              cursor: 'pointer',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              marginBottom: 0,
              color: paymentMethod ? '#fff' : '#555'
            }}
          >
            <span>{paymentLabel}</span>
            <span style={{ 
              fontSize: '7px', 
              transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)', 
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
            }}>
              ▼
            </span>
          </div>

          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              background: '#050505',
              border: '1px solid #111',
              zIndex: 999,
            }}>
              {PAYMENT_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setPaymentMethod(opt.value);
                    setPaymentLabel(opt.label);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    padding: '16px 20px',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #111',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    color: paymentMethod === opt.value ? '#fff' : '#444',
                    backgroundColor: paymentMethod === opt.value ? '#0c0c0c' : 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>{opt.label}</span>
                  {paymentMethod === opt.value && <span style={{ fontSize: '10px' }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* মোবাইল ব্যাংকিং প্যানেল */}
        {paymentMethod && paymentMethod !== 'cod' && (
          <div style={{ 
            padding: '25px 20px', 
            background: '#050505', 
            border: '1px solid #111',
            marginBottom: '25px',
          }}>
            <p style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', marginBottom: '6px' }}>
              SEND MONEY TO [PERSONAL]:
            </p>
            <p style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '3px', marginBottom: '30px', color: '#fff' }}>
              01521731371
            </p>
            
            <input
              style={styles.input}
              placeholder="SENDER PHONE NUMBER"
              required
              onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
              onFocus={(e) => (e.target.style.borderColor = '#fff')}
              onBlur={(e) => (e.target.style.borderColor = '#111')}
            />
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="TRANSACTION ID"
              required
              onChange={(e) => setTransactionId(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#fff')}
              onBlur={(e) => (e.target.style.borderColor = '#111')}
            />
          </div>
        )}

        {/* প্লেস অর্ডার বাটন */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitBtn,
            background: loading ? '#111' : '#fff',
            color: loading ? '#555' : '#000',
            borderColor: loading ? '#111' : '#fff',
          }}
        >
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </form>
    </div>
  );
}
