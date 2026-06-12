'use client';
import { useState } from 'react';

export default function OrderForm({ title, onClose }: { title: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.target));
    
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, productTitle: title }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    setLoading(false);
    if (res.ok) {
      alert("Order submitted successfully!");
      onClose();
    } else {
      alert("Failed to send order.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-bold text-lg">Order: {title}</h3>
        <p className="text-zinc-400 text-xs">Send Money to: 01521731371</p>
        <input name="name" required placeholder="Name" className="w-full bg-black p-2 border border-zinc-700 text-white" />
        <input name="phone" required placeholder="Phone" className="w-full bg-black p-2 border border-zinc-700 text-white" />
        <textarea name="address" required placeholder="Address" className="w-full bg-black p-2 border border-zinc-700 text-white" />
        <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-black p-2 border border-zinc-700 text-white" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="w-full border border-zinc-500 py-2 text-white">Cancel</button>
          <button disabled={loading} className="w-full bg-white text-black font-bold py-2">
            {loading ? 'Sending...' : 'CONFIRM ORDER'}
          </button>
        </div>
      </form>
    </div>
  );
}
