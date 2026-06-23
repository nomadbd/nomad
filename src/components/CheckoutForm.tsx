import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const PAYMENT_OPTIONS = [
  { label: 'CASH ON DELIVERY', value: 'cod' },
  { label: 'BKASH', value: 'bkash' },
  { label: 'NAGAD', value: 'nagad' },
  { label: 'ROCKET', value: 'rocket' },
  { label: 'UPAY', value: 'upay' }
];

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  
  // লাক্সারি কাস্টম ড্রপডাউন স্টেট
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // ডিফল্ট ভেরিয়েন্ট স্টেট
  const [variants, setVariants] = useState<any>(
    cartItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { size: item.size || 'M', color: item.color || 'BLACK' }
    }), {})
  );

  const updateVariant = (id: string, key: 'size' | 'color', value: string) => {
    setVariants({ ...variants, [id]: { ...variants[id], [key]: value } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return alert('Please select a payment method.');
    if (paymentMethod !== 'cod' && (!transactionId || !formData.senderPhone)) {
      return alert('Please enter sender number and transaction ID.');
    }
    
    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert([{
        customer_name: formData.name, customer_phone: formData.phone, customer_address: formData.address,
        sender_phone: formData.senderPhone || null, total_amount: totalPrice, status: 'pending'
      }]).select().single();

      if (orderError) throw orderError;

      const items = cartItems.map((item: any) => ({
        order_id: order.id, product_id: item.id, quantity: item.quantity,
        price_at_purchase: item.price, 
        size: variants[item.id].size, 
        color: variants[item.id].color
      }));

      await supabase.from('order_items').insert(items);
      clearCart();
      onSuccess();
    } catch (err) { 
      alert('Order failed. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  };

  // সিগনেচার মিনিমালিস্ট ইনপুট স্টাইল
  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #222',
    padding: '18px 0', color: '#fff', fontSize: '12px', letterSpacing: '3px', marginBottom: '20px', 
    outline: 'none', transition: 'border-color 0.4s ease', borderRadius: 0, fontFamily: 'monospace'
  };

  return (
    <div style={{ 
      maxHeight: '85vh', overflowY: 'scroll', WebkitOverflowScrolling: 'touch', 
      padding: '10px 20px 140px 20px', color: '#fff', backgroundColor: '#000' 
    }}>
      <form onSubmit={handleSubmit}>
        
        {/* লাক্সারি ব্র্যান্ড হেডিং */}
        <h3 style={{ fontSize: '14px', letterSpacing: '6px', marginBottom: '40px', textTransform: 'uppercase', textAlign: 'center', fontWeight: 300, color: '#fff' }}>
          CHECKOUT DETAILS
        </h3>

        {/* অর্ডারড আইটেম ভিউ */}
        <div style={{ marginBottom: '40px' }}>
          {cartItems.map((item: any) => (
            <div key={item.id} style={{ marginBottom: '30px', borderBottom: '1px solid #111', paddingBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                <span style={{ color: '#aaa' }}>{item.name.toUpperCase()} (×{item.quantity})</span>
                <span style={{ fontWeight: 'bold' }}>৳{item.price * item.quantity}</span>
              </div>
              
              {/* সাইজ ও কালার সিলেকশন */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '10px', color: '#444', letterSpacing: '2px' }}>SIZE:</span>
                  {['S', 'M', 'L', 'XL'].map((s) => (
                    <button key={s} type="button" onClick={() => updateVariant(item.id, 'size', s)}
                      style={{
                        background: 'transparent', color: variants[item.id].size === s ? '#fff' : '#333',
                        border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: variants[item.id].size === s ? 'bold' : 'normal',
                        padding: '2px 6px', transition: 'color 0.3s ease', letterSpacing: '1px'
                      }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#444', letterSpacing: '2px' }}>COLOR:</span>
                  <input type="text" value={variants[item.id].color} onChange={(e) => updateVariant(item.id, 'color', e.target.value.toUpperCase())}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', color: '#fff', fontSize: '11px', width: '80px', outline: 'none', padding: '2px 0', textAlign: 'right', letterSpacing: '1px', fontFamily: 'monospace' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ইনফরমেশন ফিল্ডস */}
        <input style={inputStyle} placeholder="FULL NAME" required onChange={(e) => setFormData({...formData, name: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#222'} />
        <input style={inputStyle} placeholder="CONTACT NUMBER" required onChange={(e) => setFormData({...formData, phone: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#222'} />
        <input style={inputStyle} placeholder="SHIPPING ADDRESS" required onChange={(e) => setFormData({...formData, address: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#222'} />

        {/* প্রিমিয়াম কাস্টম ড্রপডাউন (চেকমার্ক সহ) */}
        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
            <span style={{ color: paymentMethod ? '#fff' : '#666' }}>{paymentLabel}</span>
            <span style={{ fontSize: '8px', color: '#666', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
              {isDropdownOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* ড্রপডাউন অপশন প্যানেল - ওভারফ্লো ও স্ক্রল-লক মুক্ত সিস্টেম */}
          {isDropdownOpen && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, width: '100%', background: '#090909', 
              border: '1px solid #1a1a1a', zIndex: 9999, boxShadow: '0px 20px 40px rgba(0,0,0,0.95)'
            }}>
              {PAYMENT_OPTIONS.map(opt => (
                <div key={opt.value} onClick={() => { setPaymentMethod(opt.value); setPaymentLabel(opt.label); setIsDropdownOpen(false); }}
                  style={{ 
                    padding: '18px 20px', fontSize: '11px', letterSpacing: '3px', cursor: 'pointer', 
                    borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: paymentMethod === opt.value ? '#fff' : '#555', transition: 'all 0.3s ease',
                    backgroundColor: paymentMethod === opt.value ? '#111' : 'transparent'
                  }}>
                  <span>{opt.label}</span>
                  {paymentMethod === opt.value && (
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* মোবাইল ব্যাংকিং ভেরিফিকেশন ফিল্ডস */}
        {paymentMethod && paymentMethod !== 'cod' && (
          <div style={{ padding: '20px 0', borderTop: '1px solid #111', marginTop: '15px', animation: 'fadeIn 0.4s ease' }}>
            <p style={{ fontSize: '9px', color: '#444', letterSpacing: '3px', marginBottom: '8px' }}>SEND MONEY TO [PERSONAL]:</p>
            <p style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '2px', marginBottom: '30px', color: '#fff', fontFamily: 'monospace' }}>01521731371</p>
            <input style={inputStyle} placeholder="SENDER PHONE NUMBER" required onChange={(e) => setFormData({...formData, senderPhone: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#222'} />
            <input style={inputStyle} placeholder="TRANSACTION ID" required onChange={(e) => setTransactionId(e.target.value)} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#222'} />
          </div>
        )}

        {/* সলিড লাক্সারি কন্ট্রাস্ট বাটন */}
        <button type="submit" disabled={loading} style={{ 
          width: '100%', padding: '20px', background: '#fff', border: 'none', 
          color: '#000', cursor: 'pointer', letterSpacing: '5px', fontSize: '11px', fontWeight: 'bold', marginTop: '30px',
          transition: 'all 0.3s ease', outline: 'none', textTransform: 'uppercase', fontFamily: 'monospace'
        }}>
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </form>
    </div>
  );
}
