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
    alert("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-black text-white border border-zinc-800 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕ Close</button>
        </div>

        {/* প্রোডাক্ট সামারি */}
        <div className="bg-zinc-900 p-4 rounded-lg mb-6 border border-zinc-800">
          <h3 className="font-bold text-lg">{product.title}</h3>
          <p className="text-zinc-400">Product ID: {product.id}</p>
          <p className="text-xl font-bold mt-2">{product.price} BDT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required placeholder="Full Name" className="w-full bg-zinc-900 p-3 border border-zinc-700 rounded" />
          <input name="phone" required placeholder="Mobile Number" className="w-full bg-zinc-900 p-3 border border-zinc-700 rounded" />
          
          <div className="grid grid-cols-2 gap-4">
            <select name="size" className="bg-zinc-900 p-3 border border-zinc-700 rounded">
              <option>Select Size</option><option>M</option><option>L</option><option>XL</option>
            </select>
            <input name="color" placeholder="Color" className="bg-zinc-900 p-3 border border-zinc-700 rounded" />
          </div>

          <textarea name="address" required placeholder="Delivery Address" className="w-full bg-zinc-900 p-3 border border-zinc-700 rounded h-24" />

          {/* পেমেন্ট গেটওয়ে সেকশন */}
          <div className="bg-zinc-900 p-4 border border-zinc-700 rounded">
            <p className="font-bold mb-2">Payment (Send Money: 01521731371)</p>
            <div className="flex gap-2 mb-3">
              <span className="text-xs bg-zinc-800 px-2 py-1">Bkash</span>
              <span className="text-xs bg-zinc-800 px-2 py-1">Nagad</span>
              <span className="text-xs bg-zinc-800 px-2 py-1">Rocket</span>
              <span className="text-xs bg-zinc-800 px-2 py-1">Upay</span>
            </div>
            <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-black p-3 border border-zinc-700 rounded" />
          </div>

          <button disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded hover:bg-zinc-200 uppercase tracking-widest">
            {loading ? 'Processing...' : 'Confirm Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
