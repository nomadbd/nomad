import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const PAYMENT_METHODS = ['bKash', 'Nagad', 'Rocket', 'Upay'];
const MERCHANT_NUMBER = '01521731371';

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const { cartItems, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !transactionId) return alert('পেমেন্ট মেথড এবং ট্রানজেকশন আইডি দিন');

    setLoading(true);

    try {
      // ১. অর্ডার টেবিলে ডাটা সেভ
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          total_amount: totalPrice,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // ২. অর্ডার আইটেম টেবিলে ডাটা সেভ
      const itemsToInsert = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size || null,
        color: item.color || null
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      alert('অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
      clearCart();
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', color: '#fff' }}>
      <h2 style={{ fontSize: '20px', letterSpacing: '4px', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase' }}>Checkout</h2>

      {/* Input Fields */}
      {['name', 'phone', 'address'].map((field) => (
        <input
          key={field}
          required
          placeholder={field.toUpperCase()}
          style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', marginBottom: '15px', color: '#fff', fontSize: '13px' }}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        />
      ))}

      {/* Payment Selection */}
      <div style={{ margin: '20px 0' }}>
        <p style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>SELECT PAYMENT METHOD</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              style={{ padding: '10px', background: paymentMethod === method ? '#fff' : '#111', color: paymentMethod === method ? '#000' : '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: '12px' }}
            >
              {method.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Details */}
      {paymentMethod && (
        <div style={{ background: '#0a0a0a', padding: '15px', borderLeft: '2px solid #fff', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#888' }}>Send money to:</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0' }}>{MERCHANT_NUMBER}</p>
          <input
            required
            placeholder="ENTER TRANSACTION ID"
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', padding: '8px 0', color: '#fff', fontSize: '13px', marginTop: '10px' }}
            onChange={(e) => setTransactionId(e.target.value)}
          />
        </div>
      )}

      <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px' }}>
        {loading ? 'PROCESSING...' : 'PLACE ORDER'}
      </button>
    </form>
  );
}
