'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, ...product }),
      headers: { 'Content-Type': 'application/json' }
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold">CHECKOUT</h2>
          <button type="button" onClick={onClose} className="text-zinc-500">✕</button>
        </div>

        <div className="space-y-4">
          <input name="name" required placeholder="FULL NAME" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          <input name="phone" required placeholder="PHONE (01XXXXXXXXX)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          
          <div className="flex gap-2">
            <select name="size" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm">
              <option>SIZE</option><option>M</option><option>L</option><option>XL</option>
            </select>
            <input name="color" placeholder="COLOR" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
          </div>

          <textarea name="address" required placeholder="FULL ADDRESS" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm h-20 outline-none" />

          <select name="paymentMethod" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm">
            <option>PAYMENT GATEWAY</option>
            <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option>
          </select>

          <input name="transactionId" required placeholder="TRANSACTION ID" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white text-sm outline-none" />
        </div>

        <button disabled={loading} className="w-full mt-6 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition">
          CONFIRM ORDER
        </button>
      </form>
    </div>
  );
}
