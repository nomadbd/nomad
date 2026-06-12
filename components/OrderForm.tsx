'use client';
import { useState } from 'react';

export default function OrderForm({ title, id, onClose }: { title: string; id: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, productTitle: title, productId: id }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    setLoading(false);
    if (res.ok) {
      alert("অর্ডার সফল হয়েছে!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 p-8 w-full max-w-md rounded shadow-2xl">
        <h2 className="text-white text-xl font-bold mb-1">Confirm Order</h2>
        <p className="text-zinc-400 text-xs mb-6 uppercase tracking-widest">{title} (ID: {id})</p>
        
        <div className="space-y-4">
          <input name="name" required placeholder="Name" className="w-full bg-black p-3 text-white border border-zinc-700 outline-none" />
          <input name="phone" required placeholder="Mobile Number" className="w-full bg-black p-3 text-white border border-zinc-700 outline-none" />
          
          <div className="flex gap-2">
            <select name="size" required className="w-1/2 bg-black p-3 text-white border border-zinc-700">
              <option value="">Size</option><option>M</option><option>L</option><option>XL</option>
            </select>
            <input name="color" required placeholder="Color" className="w-1/2 bg-black p-3 text-white border border-zinc-700" />
          </div>

          <textarea name="address" required placeholder="Delivery Address" className="w-full bg-black p-3 text-white border border-zinc-700" />
          
          <div className="border border-dashed border-zinc-600 p-4">
            <p className="text-white text-xs mb-2">Send Money: 01521731371</p>
            <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-black p-2 text-white border border-zinc-700" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="w-1/3 py-3 border border-zinc-700 text-white hover:bg-zinc-800">Back</button>
          <button disabled={loading} className="w-2/3 bg-white text-black font-bold py-3 uppercase tracking-wider text-xs">
            {loading ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
