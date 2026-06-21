import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// ১. অর্ডারের টাইপ ডিফাইন করা (Interface)
interface Order {
  id: string | number; // আপনার ডাটাবেজ অনুযায়ী UUID (string) বা BigInt (number) হতে পারে
  total_amount: number;
  created_at: string;
  is_hidden: boolean;
}

export default function OrderHistory() {
  // ২. স্টেটের টাইপ নির্দিষ্ট করে দেওয়া
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ডাটাবেজ থেকে অর্ডার হিস্ট্রি ফেচ করা
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_hidden', false);

    if (error) {
      console.error('Error fetching orders:', error.message);
    } else if (data) {
      setOrders(data as Order[]); // টাইপ কাস্টিং
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ৩. প্যারামিটারের টাইপ নির্দিষ্ট করা (orderId: string | number)
  const handleClearHistory = async (orderId: string | number) => {
    const { error } = await supabase
      .from('orders')
      .update({ is_hidden: true })
      .eq('id', orderId);

    if (error) {
      alert('হিস্ট্রি ক্লিয়ার করা যায়নি: ' + error.message);
    } else {
      setOrders(orders.filter(order => order.id !== orderId));
    }
  };

  if (loading) return <p>লোড হচ্ছে...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>আপনার অর্ডার হিস্ট্রি</h2>
      {orders.length === 0 ? (
        <p>কোনো অর্ডার পাওয়া যায়নি।</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <p>অর্ডার আইডি: {order.id}</p>
              <p>মোট টাকা: ৳{order.total_amount}</p>
              <p>তারিখ: {new Date(order.created_at).toLocaleDateString()}</p>
              
              <button 
                onClick={() => handleClearHistory(order.id)}
                style={{ backgroundColor: 'red', color: 'white', padding: '5px 10px', cursor: 'pointer', border: 'none' }}
              >
                Clear from History
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
