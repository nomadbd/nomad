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
  
  const [copied, setCopied] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false); // অর্ডার সাকসেস স্টেট

  const [deliveryCharge, setDeliveryCharge] = useState<number>(100); 
  const [vatRate, setVatRate] = useState<number>(0.05); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const fetchStoreSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('delivery_charge, vat_rate')
          .single();
        
        if (data && !error) {
          setDeliveryCharge(data.delivery_charge);
          setVatRate(Number(data.vat_rate));
        }
      } catch (err) {
        console.error("Settings fetch failed, using fallbacks:", err);
      }
    };

    fetchStoreSettings();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subtotal = selectedItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + deliveryCharge + vatAmount;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01521731371');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!paymentMethod) return setErrorMessage('PLEASE SELECT A PAYMENT METHOD.');
    if (paymentMethod !== 'cod' && (!formData.senderPhone.trim() || !transactionId.trim())) {
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
          shipping_address: formData.address, 
          sender_phone: paymentMethod !== 'cod' ? formData.senderPhone : null,
          payment_method: paymentMethod,
          transaction_id: paymentMethod !== 'cod' ? transactionId : null,
          delivery_charge: deliveryCharge, 
          vat_amount: vatAmount,           
          total_amount: grandTotal, 
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

      clearCart(); // কার্ট খালি হবে
      setIsOrderPlaced(true); // সাকসেস স্ক্রিন দেখাবে
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
      padding: isMobile ? '10px 15px 120px 15px' : '50px 20px 80px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: isMobile ? '100vh' : 'auto',
      boxSizing: 'border-box' as const,
    },
    layoutGrid: {
      display: 'flex',
      flexDirection: isMobile ? 'column-reverse' as const : 'row' as const,
      gap: isMobile ? '30px' : '60px',
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
      background: '#000',
      padding: isMobile ? '10px 0' : '20px',
      boxSizing: 'border-box' as const,
    },
    sectionHeading: {
      fontSize: '11px',
      letterSpacing: '3px',
      color: '#fff',
      textTransform: 'uppercase' as const,
      marginBottom: '25px',
      marginTop: '35px',
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
      marginBottom: '15px',
      outline: 'none',
      borderRadius: 0,
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
    },
    mfsPanel: {
      padding: '25px 20px', 
      background: '#050505', 
      border: '1px solid #0d0d0d', 
      marginBottom: '25px',
      marginTop: '15px'
    },
    copyBtn: {
      background: 'transparent',
      border: '1px solid #222',
      color: '#888',
      padding: '5px 12px',
      fontSize: '8px',
      letterSpacing: '1.5px',
      cursor: 'pointer',
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
      marginTop: '35px',
    },
    // সাকসেস স্ক্রিনের স্টাইল
    successWrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center' as const,
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px',
    }
  };

  // 🎉 অর্ডার সফল হলে এই চমৎকার মিনিমাল স্ক্রিনটি শো করবে
  if (isOrderPlaced) {
    return (
      <div style={styles.container}>
        <div style={styles.successWrapper}>
          <div style={{ fontSize: '32px', marginBottom: '20px' }}>✓</div>
          <h2 style={{ fontSize: '14px', letterSpacing: '4px', fontWeight: 600, marginBottom: '15px', color: '#fff' }}>
            ORDER PLACED SUCCESSFULLY
          </h2>
          <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#666', lineHeight: '1.8', marginBottom: '40px', textTransform: 'uppercase' as const }}>
            Thank you for your purchase. Your order has been received and is currently being processed. We will contact you shortly to confirm your shipment.
          </p>
          <button onClick={onSuccess} style={{ ...styles.submitBtn, marginTop: 0, maxWidth: '280px' }}>
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <div style={styles.layoutGrid}>

          {/* বাম পাশ: ফর্ম */}
          <div style={styles.leftColumn}>
            
            <h2 style={{ ...styles.sectionHeading, marginTop: 0 }}>01 / SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="CONTACT NUMBER"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="COMPLETE SHIPPING ADDRESS"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <h2 style={styles.sectionHeading}>02 / PAYMENT METHOD</h2>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  ...styles.input, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  color: paymentMethod ? '#fff' : '#555',
                  marginBottom: 0
                }}
              >
                <span>{paymentLabel}</span>
                <span style={{ fontSize: '8px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>

              {isDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#050505', border: '1px solid #111', zIndex: 9999 }}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setPaymentMethod(opt.value);
                        setPaymentLabel(opt.label);
                        setIsDropdownOpen(false);
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
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {paymentMethod && paymentMethod !== 'cod' && (
              <div style={styles.mfsPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', margin: 0 }}>SEND MONEY TO [PERSONAL]:</p>
                  <button type="button" onClick={handleCopyNumber} style={styles.copyBtn}>
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <p style={{ fontSize: '20px', letterSpacing: '2px', color: '#fff', fontWeight: 600, margin: '5px 0 20px 0', fontFamily: 'monospace' }}>01521731371</p>

                <input
                  style={styles.input}
                  placeholder="SENDER PHONE NUMBER"
                  required
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                />
                <input
                  style={{ ...styles.input, marginBottom: 0 }}
                  placeholder="TRANSACTION ID"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            )}

            {errorMessage && (
              <div style={{ color: '#ff4d4d', fontSize: '10px', letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase' }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>

          {/* ডান পাশ: অর্ডার সামারি */}
          <div style={styles.rightColumn}>
            <h2 style={{ ...styles.sectionHeading, marginTop: 0, borderBottom: '1px solid #111', paddingBottom: '15px' }}>ORDER SUMMARY</h2>

            <div>
              {selectedItems.map((item: CartItem) => (
                <div key={item.id} style={styles.productRow}>
                  <img src={item.image_url || 'https://via.placeholder.com/65x80'} alt={item.name} style={styles.productImg} />
                  <div style={{ flexGrow: 1 }}> 
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', letterSpacing: '1.5px', fontWeight: 500 }}>{item.name.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>৳{item.price * item.quantity}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
                      QTY: {item.quantity} {item.color && ` • ${item.color.toUpperCase()}`} {item.size && ` / ${item.size.toUpperCase()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                <span>SUBTOTAL</span>
                <span style={{ fontFamily: 'monospace' }}>৳{subtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                <span>SHIPPING</span>
                <span style={{ fontFamily: 'monospace', color: deliveryCharge === 0 ? '#fff' : '#666' }}>
                  {deliveryCharge === 0 ? 'COMPLIMENTARY' : `৳${deliveryCharge}`}
                </span>
              </div>

              {vatRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                  <span>VAT ({vatRate * 100}%)</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{vatAmount}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '2px', paddingTop: '20px', borderTop: '1px dotted #222', color: '#fff', fontWeight: 600, marginTop: '25px' }}>
                <span>TOTAL</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{grandTotal}</span>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
