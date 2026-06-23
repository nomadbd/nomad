import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const PAYMENT_OPTIONS = [
  { label: 'Cash on Delivery', value: 'cod' },
  { label: 'bKash', value: 'bkash' },
  { label: 'Nagad', value: 'nagad' },
  { label: 'Rocket', value: 'rocket' },
  { label: 'Upay', value: 'upay' }
];

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod !== 'cod' && !transactionId) return alert('ট্রানজেকশন আইডি প্রদান করুন');
    
    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          total_amount: totalPrice,
          status: 'pending'
        }]).select().single();

      if (orderError) throw orderError;

      const itemsToInsert = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size || 'N/A',
        color: item.color || 'N/A'
      }));

      await supabase.from('order_items').insert(itemsToInsert);
      alert('অর্ডার সফল হয়েছে!');
      clearCart();
      onSuccess();
    } catch (err) {
      alert('অর্ডার সম্পন্ন হয়নি, আবার চেষ্টা করুন।');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: '#fff' }}>
      <h2 style={{ fontSize: '18px', letterSpacing: '3px', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase' }}>Checkout Details</h2>

      {/* প্রোডাক্ট সামারি */}
      <div style={{ marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        {cartItems.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span>{item.name} x {item.quantity} <small style={{ color: '#888' }}>({item.size}, {item.color})</small></span>
            <span>৳{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* ইনপুট ফিল্ড */}
      {['name', 'phone', 'address'].map((field) => (
        <input key={field} required placeholder={field.toUpperCase()} onChange={(e) => setFormData({...formData, [field]: e.target.value})} 
          style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', marginBottom: '15px', color: '#fff', fontSize: '13px' }} />
      ))}

      {/* প্রিমিয়াম ড্রপডাউন */}
      <select onChange={(e) => setPaymentMethod(e.target.value)} required
        style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '12px', marginBottom: '15px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
        <option value="">SELECT PAYMENT METHOD</option>
        {PAYMENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
      </select>

      {/* পেমেন্ট ইনফো */}
      {paymentMethod && paymentMethod !== 'cod' && (
        <div style={{ background: '#111', padding: '15px', marginBottom: '20px', borderLeft: '2px solid #fff' }}>
          <p style={{ fontSize: '11px', color: '#888' }}>SEND MONEY TO:</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0' }}>01521731371</p>
          <input required placeholder="ENTER TRANSACTION ID" onChange={(e) => setTransactionId(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #444', padding: '5px 0', color: '#fff', fontSize: '13px' }} />
        </div>
      )}

      <button type="submit" disabled={loading} 
        style={{ width: '100%', padding: '15px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px' }}>
        {loading ? 'PROCESSING...' : 'PLACE ORDER'}
      </button>
    </form>
  );
}
