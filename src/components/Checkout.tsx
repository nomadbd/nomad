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

export default function Checkout({ selectedItems, onSuccess }: { selectedItems: CartItem[], onSuccess: () => void }) {
  const { clearCart } = useCart() as any;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');
  
  // ⚡ নতুন স্টেট: নম্বর কপি করার ফিডব্যাক ট্র্যাকিং
  const [copied, setCopied] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayTotal = selectedItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);

  // ⚡ নম্বর কপি করার ফাংশন
  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01521731371');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      const { data: { user } } = await supabase.auth.getUser();

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

  // NOMAD আল্ট্রা-লাক্সারি মিনিমাল থিম স্টাইলস
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
      gap: isMobile ? '40px' : '60px',
      alignItems: 'flex-start',
    },
    leftColumn: {
      flex: '1 1 58%',
      width: '100%',
    },
    rightColumn: {
      flex: '1 1 42%',
      width: '100%',
      position: isMobile ? 'relative' as const : 'sticky' as const,
      top: '40px',
      background: '#030303',
      border: '1px solid #0a0a0a',
      padding: isMobile ? '25px 20px' : '35px',
    },
    sectionHeading: {
      fontSize: '10px',
      letterSpacing: '4px',
      color: '#555',
      textTransform: 'uppercase' as const,
      marginBottom: '25px',
      borderBottom: '1px solid #0d0d0d',
      paddingBottom: '12px',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #141414',
      padding: '16px 0',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '25px',
      outline: 'none',
      borderRadius: 0,
      transition: 'border-color 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    productRow: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      paddingBottom: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #0d0d0d',
    },
    productImg: {
      width: '65px',
      height: '80px',
      objectFit: 'cover' as const,
      background: '#0a0a0a',
      border: '1px solid #111',
    },
    mfsPanel: {
      padding: '25px', 
      background: '#030303', 
      border: '1px solid #0d0d0d', 
      marginBottom: '35px',
      transition: 'all 0.3s ease'
    },
    copyBtn: {
      background: 'transparent',
      border: '1px solid #222',
      color: '#888',
      padding: '4px 10px',
      fontSize: '8px',
      letterSpacing: '1.5px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: 500
    },
    submitBtn: {
      width: '100%',
      padding: '22px',
      background: '#fff',
      border: '1px solid #fff',
      color: '#000',
      cursor: 'pointer',
      letterSpacing: '5px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
      marginTop: '15px',
    },
    errorAlert: {
      background: '#0a0505',
      border: '1px solid #260f0f',
      color: '#ff4d4d',
      padding: '15px',
      fontSize: '10px',
      letterSpacing: '2px',
      marginBottom: '25px',
      fontFamily: 'monospace',
      textAlign: 'center' as const
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <div style={styles.layoutGrid}>

          {/* বাম পাশ: ফর্ম ফিল্ডস */}
          <div style={styles.leftColumn}>

            {/* সেকশন ১: শিপিং ঠিকানা */}
            <h2 style={styles.sectionHeading}>01 / SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #141414'}
            />
            <input
              style={styles.input}
              placeholder="CONTACT NUMBER"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #141414'}
            />
            <input
              style={styles.input}
              placeholder="COMPLETE SHIPPING ADDRESS" // ⚡ ফিক্স: মোবাইল স্ক্রিনে ট্রাঙ্কেশন এড়াতে প্লেসহোল্ডার অপ্টিমাইজ করা হয়েছে
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #141414'}
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
                  color: paymentMethod ? '#fff' : '#555',
                  borderBottom: isDropdownOpen ? '1px solid #fff' : '1px solid #141414'
                }}
              >
                <span style={{ fontSize: '11px', letterSpacing: '2px' }}>{paymentLabel}</span>
                <span style={{ fontSize: '7px', transition: 'transform 0.3s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#444' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#030303', border: '1px solid #0d0d0d', zIndex: 9999, marginTop: '-26px' }}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setPaymentMethod(opt.value);
                        setPaymentLabel(opt.label);
                        setIsDropdownOpen(false);
                        setErrorMessage(null);
                      }}
                      onMouseEnter={() => setHoveredOption(opt.value)}
                      onMouseLeave={() => setHoveredOption(null)}
                      style={{
                        padding: '16px 20px',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        color: paymentMethod === opt.value ? '#000' : (hoveredOption === opt.value ? '#fff' : '#666'),
                        backgroundColor: paymentMethod === opt.value ? '#fff' : (hoveredOption === opt.value ? '#0a0a0a' : 'transparent'),
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
              <div style={styles.mfsPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', margin: 0 }}>SEND MONEY TO [PERSONAL]:</p>
                  
                  {/* ⚡ প্রিমিয়াম কপি বাটন ইন্টারঅ্যাকশন */}
                  <button 
                    type="button"
                    onClick={handleCopyNumber} 
                    style={{
                      ...styles.copyBtn,
                      borderColor: copied ? '#fff' : '#222',
                      color: copied ? '#fff' : '#888'
                    }}
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <p style={{ fontSize: '22px', letterSpacing: '4px', marginBottom: '25px', color: '#fff', fontWeight: 600, fontFamily: 'monospace', margin: '0 0 25px 0' }}>01521731371</p>

                <input
                  style={styles.input}
                  placeholder="SENDER PHONE NUMBER"
                  required
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #141414'}
                />
                <input
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="TRANSACTION ID"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #141414'}
                />
              </div>
            )}

            {/* ⚡ মিনিমালিস্টিক এরর বক্স */}
            {errorMessage && (
              <div style={styles.errorAlert}>
                {errorMessage.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.5 : 1,
                letterSpacing: loading ? '2px' : '5px'
              }}
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
            <h2 style={{ ...styles.sectionHeading, marginBottom: '25px', borderBottom: '1px solid #0d0d0d' }}>ORDER SUMMARY</h2>

            <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
              {selectedItems.map((item: CartItem) => (
                <div key={item.id} style={styles.productRow}>
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/60x75?text=NOMAD'} 
                    alt={item.name} 
                    style={styles.productImg} 
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}> {/* ⚡ মিক্সিন গার্ড: ফ্লেক্স ওভারফ্লো কমানো */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontSize: '11px', letterSpacing: '1.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                        {item.name.toUpperCase()}
                      </span>
                      <span style={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace', fontWeight: 500 }}>৳{item.price * item.quantity}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
                      QTY: {item.quantity} 
                      {(item.size || item.color) && `  ·  `}
                      {item.color?.toUpperCase()}{item.color && item.size ? ' / ' : ''}{item.size?.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ক্যালকুলেশন প্যানেল */}
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #0d0d0d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '14px', color: '#555' }}>
                <span>SUBTOTAL</span>
                <span style={{ fontFamily: 'monospace' }}>৳{displayTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '25px', color: '#555' }}>
                <span>SHIPPING</span>
                <span style={{ fontSize: '10px', letterSpacing: '1px', color: '#666' }}>COMPLIMENTARY</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '2px', paddingTop: '18px', borderTop: '1px dashed #141414', color: '#fff', fontWeight: 600 }}>
                <span>TOTAL</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{displayTotal}</span>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
