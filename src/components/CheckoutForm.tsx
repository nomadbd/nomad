import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const PAYMENT_OPTIONS = ['Cash on Delivery', 'bKash', 'Nagad', 'Rocket', 'Upay'];

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', senderPhone: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333',
    padding: '12px 0', color: '#fff', fontSize: '14px', marginBottom: '20px', outline: 'none'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return alert('পেমেন্ট মেথড সিলেক্ট করুন');
    
    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert([{
        customer_name: formData.name, customer_phone: formData.phone, customer_address: formData.address,
        sender_phone: formData.senderPhone, total_amount: totalPrice, status: 'pending'
      }]).select().single();

      if (orderError) throw orderError;

      const items = cartItems.map((item: any) => ({
        order_id: order.id, product_id: item.id, quantity: item.quantity,
        price_at_purchase: item.price, size: item.size, color: item.color
      }));

      await supabase.from('order_items').insert(items);
      alert('অর্ডার সফল হয়েছে!');
      clearCart();
      onSuccess();
    } catch (err) { alert('দুঃখিত, আবার চেষ্টা করুন'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', color: '#fff' }}>
      <h3 style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>Checkout Details</h3>

      {/* প্রোডাক্ট সামারি */}
      <div style={{ marginBottom: '30px' }}>
        {cartItems.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
            <span>{item.name} x {item.quantity} <small style={{ color: '#666' }}>({item.size}, {item.color})</small></span>
            <span>৳{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <input style={inputStyle} placeholder="NAME" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
      <input style={inputStyle} placeholder="PHONE" required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      <input style={inputStyle} placeholder="ADDRESS" required onChange={(e) => setFormData({...formData, address: e.target.value})} />

      {/* পেমেন্ট ড্রপডাউন */}
      <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} onChange={(e) => setPaymentMethod(e.target.value)} required>
        <option value="">SELECT PAYMENT METHOD</option>
        {PAYMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
      </select>

      {/* পেমেন্ট ডিটেইলস */}
      {paymentMethod && paymentMethod !== 'Cash on Delivery' && (
        <div style={{ padding: '20px', background: '#0a0a0a', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', color: '#888', marginBottom: '5px' }}>SEND MONEY TO:</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>01521731371</p>
          <input style={inputStyle} placeholder="ENTER SENDER NUMBER" required onChange={(e) => setFormData({...formData, senderPhone: e.target.value})} />
          <input style={inputStyle} placeholder="ENTER TRANSACTION ID" required onChange={(e) => setTransactionId(e.target.value)} />
        </div>
      )}

      <button type="submit" style={{ 
        width: '100%', padding: '15px', background: 'transparent', border: '1px solid #fff', 
        color: '#fff', cursor: 'pointer', letterSpacing: '4px', fontSize: '11px', marginTop: '20px' 
      }}>
        {loading ? 'PROCESSING...' : 'PLACE ORDER'}
      </button>
    </form>
  );
}
