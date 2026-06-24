import { useState } from 'react';
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

interface VariantsState {
  [key: string]: { size: string; color: string };
}

const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH (PERSONAL)', value: 'bkash' },
  { label: 'NAGAD (PERSONAL)', value: 'nagad' },
  { label: 'ROCKET (PERSONAL)', value: 'rocket' }
];

export default function Checkout({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart() as { 
    cartItems: CartItem[]; 
    clearCart: () => void; 
    totalPrice: number; 
  };
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  const [variants, setVariants] = useState<VariantsState>(
    cartItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { size: item.size || 'M', color: item.color || 'BLACK' }
    }), {})
  );

  const updateVariant = (id: string, key: 'size' | 'color', value: string) => {
    setVariants(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) return setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');
    if (paymentMethod !== 'cod' && (!transactionId || !formData.senderPhone)) {
      return setErrorMessage('SENDER NUMBER AND TRANSACTION ID ARE REQUIRED.');
    }

    setLoading(true);
    try {
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
        .select().single();

      if (orderError) throw orderError;

      const items = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: variants[item.id].size,
        color: variants[item.id].color
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

  // থিম ও লেআউট টোকেন (শতভাগ রেসপন্সিভ এবং হাই-কনট্রাস্ট)
  const styles = {
    container: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box' as const,
      padding: '10px 4px 60px 4px', // সাইড ওভারফ্লো বন্ধ করতে অপ্টিমাইজড প্যাডিং
      color: '#fff',
      backgroundColor: '#000',
    },
    productBlock: {
      background: '#0a0a0a',
      padding: '20px',
      border: '1px solid #161616',
      marginBottom: '30px'
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #333', // দৃশ্যমান বর্ডার
      padding: '16px 0',
      color: '#fff',
      fontSize: '12px',
      letterSpacing: '2px',
      marginBottom: '25px',
      outline: 'none',
      borderRadius: 0,
    },
    variantSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #161616'
    },
    errorText: {
      color: '#ff4d4d',
      fontSize: '11px',
      letterSpacing: '2px',
      textAlign: 'center' as const,
      marginBottom: '15px',
      fontWeight: 500
    },
    submitBtn: {
      width: '100%',
      padding: '20px',
      background: 'transparent', // ট্রান্সপারেন্ট ভেতরটা
      border: '1px solid rgba(255, 255, 255, 0.8)', // হালকা গ্লসি বর্ডার
      color: '#fff',
      cursor: 'pointer',
      letterSpacing: '4px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', boxSizing: 'border-box' }}>
        
        {/* প্রোডাক্ট ও ভেরিয়েন্ট মডিউল (স্ক্রিনের বাইরে যাবে না) */}
        <div style={{ marginBottom: '35px' }}>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.productBlock}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', letterSpacing: '1px' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>{item.name.toUpperCase()} (×{item.quantity})</span>
                <span style={{ color: '#fff' }}>৳ {item.price * item.quantity}</span>
              </div>

              {/* সাইজ ও কালার সিলেক্টর লেআউট - স্ট্রাকচার্ড ও সুরক্ষিত */}
              <div style={styles.variantSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '10px', color: '#888', letterSpacing: '2px' }}>SIZE:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['S', 'M', 'L', 'XL'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateVariant(item.id, 'size', s)}
                        style={{
                          background: 'transparent',
                          color: variants[item.id]?.size === s ? '#fff' : '#555',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: variants[item.id]?.size === s ? '700' : '400',
                          padding: '2px 6px',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#888', letterSpacing: '2px' }}>COLOR:</span>
                  <input
                    type="text"
                    value={variants[item.id]?.color}
                    onChange={(e) => updateVariant(item.id, 'color', e.target.value.toUpperCase())}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #444',
                      color: '#fff',
                      fontSize: '11px',
                      width: '80px',
                      outline: 'none',
                      letterSpacing: '1px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* গ্র্যান্ড টোটাল */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '0 10px', letterSpacing: '2px' }}>
            <span style={{ color: '#888' }}>TOTAL AMOUNT</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>৳ {totalPrice}</span>
          </div>
        </div>

        {/* ইনপুট ফিল্ডস (হাই কনট্রাস্ট ও রিডেবল) */}
        <input
          style={styles.input}
          placeholder="FULL NAME"
          required
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="CONTACT NUMBER"
          required
          type="tel"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="SHIPPING ADDRESS"
          required
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        {/* ড্রপডাউন */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ ...styles.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}
          >
            <span>{paymentLabel}</span>
            <span style={{ fontSize: '9px' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#090909', border: '1px solid #222', zIndex: 999 }}>
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
                    fontSize: '11px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #111',
                    color: paymentMethod === opt.value ? '#fff' : '#777',
                    backgroundColor: paymentMethod === opt.value ? '#111' : 'transparent'
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* এমএফএস প্যানেল */}
        {paymentMethod && paymentMethod !== 'cod' && (
          <div style={{ padding: '20px', background: '#0a0a0a', border: '1px solid #161616', marginBottom: '30px' }}>
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '4px' }}>SEND MONEY TO [PERSONAL]:</p>
            <p style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '20px', color: '#fff', fontWeight: 600 }}>01521731371</p>
            
            <input
              style={styles.input}
              placeholder="SENDER PHONE NUMBER"
              required
              onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
            />
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="TRANSACTION ID"
              required
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        )}

        {/* ইরোর মেসেজ - এখন বাটনের ঠিক ওপরে রাখা হয়েছে */}
        {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

        {/* সাবমিট বাটন (আউটলাইন লাক্সারি স্টাইল) */}
        <button
          type="submit"
          disabled={loading}
          style={styles.submitBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#fff';
          }}
        >
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </form>
    </div>
  );
}
