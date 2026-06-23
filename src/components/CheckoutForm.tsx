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
  
  // কাস্টম গেটওয়ে কন্টেইনার ও ফর্ম স্টেট
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // প্রতিটি প্রোডাক্টের সাইজ ও কালার ট্র্যাক করার জন্য ডায়নামিক স্টেট
  const [variants, setVariants] = useState<any>(
    cartItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { size: item.size || 'M', color: item.color || 'BLACK' }
    }), {})
  );

  const updateVariant = (id: string, key: 'size' | 'color', value: string) => {
    setVariants({ ...variants, [id]: { ...variants[id], [key]: value } });
  };

  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #222',
    padding: '16px 0', color: '#fff', fontSize: '12px', letterSpacing: '1px', marginBottom: '15px', outline: 'none'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return alert('পেমেন্ট মেথড সিলেক্ট করুন');
    if (paymentMethod !== 'cod' && (!transactionId || !formData.senderPhone)) {
      return alert('সেন্ডার নাম্বার এবং ট্রানজেকশন আইডি দিন');
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
      alert('অর্ডার সফল হয়েছে!');
      clearCart();
      onSuccess();
    } catch (err) { alert('দুঃখিত, আবার চেষ্টা করুন'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0 10px', color: '#fff', fontFamily: 'monospace' }}>
      <h3 style={{ fontSize: '13px', letterSpacing: '3px', marginBottom: '30px', textTransform: 'uppercase', textAlign: 'center' }}>Checkout Details</h3>

      {/* ব্র্যান্ড লেভেল প্রোডাক্ট সামারি + সাইজ/কালার সিলেকশন */}
      <div style={{ marginBottom: '35px', borderBottom: '1px solid #111', paddingBottom: '10px' }}>
        {cartItems.map((item: any) => (
          <div key={item.id} style={{ marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
              <span style={{ letterSpacing: '0.5px' }}>{item.name.toUpperCase()} (x{item.quantity})</span>
              <span>৳{item.price * item.quantity}</span>
            </div>
            
            {/* সাইজ সিলেক্টর ও কালার ইনপুট কন্টেইনার */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#666' }}>SIZE:</span>
                {['S', 'M', 'L', 'XL'].map((s) => (
                  <button key={s} type="button" onClick={() => updateVariant(item.id, 'size', s)}
                    style={{
                      background: 'transparent', color: variants[item.id].size === s ? '#fff' : '#444',
                      border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px'
                    }}>{s}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#666' }}>COLOR:</span>
                <input type="text" value={variants[item.id].color} onChange={(e) => updateVariant(item.id, 'color', e.target.value.toUpperCase())}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '11px', width: '60px', outline: 'none', padding: '2px 0' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* কাস্টমার ইনফো ইনপুট */}
      <input style={inputStyle} placeholder="NAME" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
      <input style={inputStyle} placeholder="PHONE" required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      <input style={inputStyle} placeholder="ADDRESS" required onChange={(e) => setFormData({...formData, address: e.target.value})} />

      {/* কাস্টম প্রিমিয়াম পেমেন্ট গেটওয়ে কন্টেইনার */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
          <span>{paymentLabel}</span>
          <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
        </div>

        {isDropdownOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#050505', border: '1px solid #222', zIndex: 100, boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}>
            {PAYMENT_OPTIONS.map(opt => (
              <div key={opt.value} onClick={() => { setPaymentMethod(opt.value); setPaymentLabel(opt.label); setIsDropdownOpen(false); }}
                style={{ padding: '14px', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', borderBottom: '1px solid #111', color: paymentMethod === opt.value ? '#fff' : '#666' }}>
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* কাস্টম পেমেন্ট ডিটেইলস প্যানেল */}
      {paymentMethod && paymentMethod !== 'cod' && (
        <div style={{ padding: '20px 0', marginBottom: '20px', borderTop: '1px solid #111' }}>
          <p style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', marginBottom: '5px' }}>SEND MONEY TO:</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '20px', color: '#fff' }}>01521731371</p>
          <input style={inputStyle} placeholder="ENTER SENDER NUMBER (যে নাম্বার থেকে টাকা পাঠিয়েছেন)" required onChange={(e) => setFormData({...formData, senderPhone: e.target.value})} />
          <input style={inputStyle} placeholder="ENTER TRANSACTION ID" required onChange={(e) => setTransactionId(e.target.value)} />
        </div>
      )}

      {/* আল্ট্রা-প্রিমিয়াম মিনিমাল বর্ডার বাটন */}
      <button type="submit" disabled={loading} style={{ 
        width: '100%', padding: '16px', background: 'transparent', border: '1px solid #333', 
        color: '#fff', cursor: 'pointer', letterSpacing: '4px', fontSize: '11px', marginTop: '15px',
        transition: 'all 0.3s ease', outline: 'none'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}>
        {loading ? 'PROCESSING...' : 'PLACE ORDER'}
      </button>
    </form>
  );
}
