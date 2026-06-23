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
  
  // প্রিমিয়াম কাস্টম গেটওয়ে স্টেট
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('SELECT PAYMENT METHOD');
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [transactionId, setTransactionId] = useState('');

  // প্রতিটি আইটেমের সাইজ ও কালার স্টেট (ডিফল্ট: M এবং BLACK)
  const [variants, setVariants] = useState<any>(
    cartItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { size: item.size || 'M', color: item.color || 'BLACK' }
    }), {})
  );

  const updateVariant = (id: string, key: 'size' | 'color', value: string) => {
    setVariants({ ...variants, [id]: { ...variants[id], [key]: value } });
  };

  // আল্ট্রা-মিনিমাল গ্লোবাল ইনপুট স্টাইল (কোনো বক্স নেই, শুধু আন্ডারলাইন)
  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #222',
    padding: '16px 0', color: '#fff', fontSize: '13px', letterSpacing: '2px', marginBottom: '15px', 
    outline: 'none', transition: 'border-color 0.3s ease', borderRadius: 0
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return alert('অনুগ্রহ করে পেমেন্ট মেথড সিলেক্ট করুন');
    if (paymentMethod !== 'cod' && (!transactionId || !formData.senderPhone)) {
      return alert('সেন্ট মানি নাম্বার এবং ট্রানজেকশন আইডি প্রদান করুন');
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
      alert('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!');
      clearCart();
      onSuccess();
    } catch (err) { 
      alert('দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ 
      maxHeight: '80vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', 
      padding: '10px 15px', color: '#fff', fontFamily: 'monospace' 
    }}>
      <form onSubmit={handleSubmit}>
        <h3 style={{ fontSize: '13px', letterSpacing: '4px', marginBottom: '35px', textTransform: 'uppercase', textAlign: 'center', fontWeight: 'normal' }}>
          CHECKOUT DETAILS
        </h3>

        {/* প্রোডাক্ট ভেরিয়েন্ট সামারি ব্লক */}
        <div style={{ marginBottom: '30px' }}>
          {cartItems.map((item: any) => (
            <div key={item.id} style={{ marginBottom: '25px', borderBottom: '1px solid #111', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '15px', letterSpacing: '1px' }}>
                <span>{item.name.toUpperCase()} (x{item.quantity})</span>
                <span>৳{item.price * item.quantity}</span>
              </div>
              
              {/* সাইজ ও কালার পিকার ইলাস্ট্রেশন (হুবহু স্ক্রিনশটের মতো) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#555', letterSpacing: '1px' }}>SIZE:</span>
                  {['S', 'M', 'L', 'XL'].map((s) => (
                    <button key={s} type="button" onClick={() => updateVariant(item.id, 'size', s)}
                      style={{
                        background: 'transparent', color: variants[item.id].size === s ? '#fff' : '#444',
                        border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: variants[item.id].size === s ? 'bold' : 'normal',
                        padding: '2px 4px', transition: 'color 0.2s'
                      }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#555', letterSpacing: '1px' }}>COLOR:</span>
                  <input type="text" value={variants[item.id].color} onChange={(e) => updateVariant(item.id, 'color', e.target.value.toUpperCase())}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '12px', width: '70px', outline: 'none', padding: '2px 0', textAlign: 'center', letterSpacing: '1px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* মিনিমালিস্ট আন্ডারলাইন ইনপুট ফিল্ডস */}
        <input style={inputStyle} placeholder="NAME" required onChange={(e) => setFormData({...formData, name: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#555'} onBlur={(e) => e.target.style.borderColor = '#222'} />
        <input style={inputStyle} placeholder="PHONE" required onChange={(e) => setFormData({...formData, phone: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#555'} onBlur={(e) => e.target.style.borderColor = '#222'} />
        <input style={inputStyle} placeholder="ADDRESS" required onChange={(e) => setFormData({...formData, address: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#555'} onBlur={(e) => e.target.style.borderColor = '#222'} />

        {/* কাস্টম পেমেন্ট গেটওয়ে কন্টেইনার (ঝাকুনি-মুক্ত রেপ ভিউ) */}
        <div style={{ position: 'relative', marginBottom: '25px' }}>
          <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
            <span>{paymentLabel}</span>
            <span style={{ fontSize: '9px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              {isDropdownOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* অপশন প্যানেল - লেআউটের বাইরে পজিশন করা, তাই কোনো ঝাকুনি হবে না */}
          {isDropdownOpen && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, width: '100%', background: '#000', 
              border: '1px solid #222', zIndex: 999, boxShadow: '0px 15px 35px rgba(0,0,0,0.9)'
            }}>
              {PAYMENT_OPTIONS.map(opt => (
                <div key={opt.value} onClick={() => { setPaymentMethod(opt.value); setPaymentLabel(opt.label); setIsDropdownOpen(false); }}
                  style={{ 
                    padding: '16px', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', 
                    borderBottom: '1px solid #111', color: paymentMethod === opt.value ? '#fff' : '#555',
                    transition: 'color 0.2s'
                  }}>
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* কাস্টম পেমেন্ট ভেরিফিকেশন ফিল্ডস */}
        {paymentMethod && paymentMethod !== 'cod' && (
          <div style={{ padding: '15px 0 5px 0', borderTop: '1px solid #111', marginTop: '10px' }}>
            <p style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', marginBottom: '4px' }}>SEND MONEY TO:</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '20px', color: '#fff' }}>01521731371</p>
            <input style={inputStyle} placeholder="ENTER SENDER NUMBER (যে নাম্বার থেকে পাঠিয়েছেন)" required onChange={(e) => setFormData({...formData, senderPhone: e.target.value})} onFocus={(e) => e.target.style.borderColor = '#555'} onBlur={(e) => e.target.style.borderColor = '#222'} />
            <input style={inputStyle} placeholder="ENTER TRANSACTION ID" required onChange={(e) => setTransactionId(e.target.value)} onFocus={(e) => e.target.style.borderColor = '#555'} onBlur={(e) => e.target.style.borderColor = '#222'} />
          </div>
        )}

        {/* আল্ট্রা-প্রিমিয়াম মিনিমাল বর্ডার বাটন */}
        <button type="submit" disabled={loading} style={{ 
          width: '100%', padding: '16px', background: 'transparent', border: '1px solid #333', 
          color: '#fff', cursor: 'pointer', letterSpacing: '4px', fontSize: '11px', marginTop: '25px',
          transition: 'all 0.3s ease', outline: 'none', textTransform: 'uppercase'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}>
          {loading ? 'PROCESSING...' : 'PLACE ORDER'}
        </button>
      </form>
    </div>
  );
}
