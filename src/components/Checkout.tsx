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

// ⚡ ক্যাশ অন ডেলিভারি সহ গেটওয়ে লিস্ট আপডেট করা হয়েছে
const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH (PERSONAL)', value: 'bkash' },
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

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01521731371');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) return setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');
    
    // ⚡ COD না হলে শুধুমাত্র তখনই ট্রানজেকশন আইডি ভ্যালিডেশন কাজ করবে
    if (paymentMethod !== 'cod' && (!formData.senderPhone.trim() || !transactionId.trim())) {
      return setErrorMessage('SENDER NUMBER AND TRANSACTION ID ARE REQUIRED.');
    }
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN ALL REQUIRED SHIPPING FIELDS.');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // ১. ওর্ডার্স টেবিলে ডাটা ইনসার্ট (COD কন্ডিশন হ্যান্ডেল সহ)
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

      // ২. অর্ডার আইটেমস টেবিলে ডাটা ইনসার্ট
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

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '15px 15px 140px 15px' : '60px 20px 90px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: isMobile ? '100vh' : 'auto',
      overflowY: 'auto' as const,
      boxSizing: 'border-box' as const,
    },
    layoutGrid: {
      display: 'flex',
      flexDirection: isMobile ? 'column-reverse' as const : 'row' as const,
      gap: isMobile ? '40px' : '70px',
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
      border: '1px solid #0d0d0d',
      padding: isMobile ? '30px 20px' : '40px',
      boxSizing: 'border-box' as const,
      marginBottom: isMobile ? '15px' : '0',
    },
    sectionHeading: {
      fontSize: '11px',
      letterSpacing: '4px',
      color: '#fff',
      textTransform: 'uppercase' as const,
      marginBottom: '30px',
      borderBottom: '1px solid #0d0d0d',
      paddingBottom: '14px',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #161616',
      padding: '18px 0',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '28px',
      outline: 'none',
      borderRadius: 0,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
      padding: '30px 25px', 
      background: '#030303', 
      border: '1px solid #0d0d0d', 
      marginBottom: '35px',
    },
    copyBtn: {
      background: 'transparent',
      border: '1px solid #222',
      color: '#888',
      padding: '5px 12px',
      fontSize: '8px',
      letterSpacing: '1.5px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      marginTop: '20px',
    },
    errorAlert: {
      background: '#0a0505',
      border: '1px solid #260f0f',
      color: '#ff4d4d',
      padding: '16px',
      fontSize: '10px',
      letterSpacing: '2px',
      marginBottom: '30px',
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

            {/* শিপিং এরিয়া */}
            <h2 style={styles.sectionHeading}>SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #161616'}
            />
            <input
              style={styles.input}
              placeholder="CONTACT NUMBER"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #161616'}
            />
            <input
              style={styles.input}
              placeholder="COMPLETE SHIPPING ADDRESS"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #161616'}
            />

            {/* পেমেন্ট এরিয়া */}
            <h2 style={{ ...styles.sectionHeading, marginTop: '25px' }}>PAYMENT METHOD</h2>
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
                  borderBottom: isDropdownOpen ? '1px solid #fff' : '1px solid #161616'
                }}
              >
                <span style={{ fontSize: '11px', letterSpacing: '2px' }}>{paymentLabel}</span>
                <span style={{ fontSize: '7px', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#444' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#030303', border: '1px solid #0d0d0d', zIndex: 9999, marginTop: '-29px' }}>
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
                        padding: '18px 20px',
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

            {/* ⚡ গেটওয়ে প্যানেল: শুধুমাত্র COD না হলে (অর্থাৎ বিকাশ/রকেটে) এটি দেখাবে */}
            {paymentMethod && paymentMethod !== 'cod' && (
              <div style={styles.mfsPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', margin: 0 }}>SEND MONEY TO [PERSONAL]:</p>
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
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #161616'}
                />
                <input
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="TRANSACTION ID"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid #161616'}
                />
              </div>
            )}

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
                  <div style={{ flexGrow: 1, minWidth: 0 }}> 
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '8px', width: '100%' }}>
                      <span style={{ color: '#fff', fontSize: '11px', letterSpacing: '1.5px', fontWeight: 500, textTransform: 'uppercase', lineHeight: '1.4' }}>
                        {item.name}
                      </span>
                      <span style={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '2px' }}>
                        ৳{item.price * item.quantity}
                      </span>
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

            {/* হিসাব প্যানেল */}
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
