'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...product, paymentMethod })
      });
      if (res.ok) {
        alert("অর্ডার সফল হয়েছে!");
        onClose();
      } else {
        alert("কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-lg">CHECKOUT</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required placeholder="FULL NAME" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          <input name="phone" required placeholder="PHONE NUMBER" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          <input name="address" required placeholder="FULL ADDRESS" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          
          <div className="flex gap-2">
            <input name="size" placeholder="SIZE" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm" />
            <input name="color" placeholder="COLOR" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm" />
          </div>

          <select onChange={(e) => setPaymentMethod(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm">
            <option value="">SELECT PAYMENT GATEWAY</option>
            <option value="Bkash">Bkash</option>
            <option value="Nagad">Nagad</option>
            <option value="Rocket">Rocket</option>
            <option value="Upay">Upay</option>
          </select>

          <input name="transactionId" required placeholder="TRANSACTION ID" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />

          <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition mt-4">
            {loading ? 'PROCESSING...' : 'CONFIRM ORDER'}
          </button>
        </form>
      </div>
    </div>
  );
}
