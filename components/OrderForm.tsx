'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // ক্যালকুলেশন: ডেলিভারি চার্জ এবং ভ্যাট যুক্ত করা হয়েছে
  const price = parseFloat(product.price) || 0;
  const delivery = parseFloat(product.deliveryCharge) || 0;
  const vat = parseFloat(product.vat) || 0;
  const total = price + delivery + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, ...product, total, paymentMethod }),
      headers: { 'Content-Type': 'application/json' }
    });
    setLoading(false);
    alert("আপনার অর্ডার সফল হয়েছে!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-black border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-xl">Confirm Order</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">×</button>
        </div>

        <div className="text-zinc-400 text-sm mb-6 border-b border-zinc-800 pb-4">
          <p className="font-bold text-white text-lg">{product.title}</p>
          <div className="flex justify-between"><span>Price:</span> <span>৳{price}</span></div>
          <div className="flex justify-between"><span>Delivery:</span> <span>৳{delivery}</span></div>
          <div className="flex justify-between font-bold text-white mt-2 border-t border-zinc-800 pt-2">
            <span>Total:</span> <span>৳{total}</span>
          </div>
        </div>

        <div className="space-y-4">
          <input name="name" required placeholder="FULL NAME" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none" />
          <input name="phone" required placeholder="PHONE (01XXXXXXXXX)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none" />

          <div className="flex gap-2">
            <select name="size" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none">
              <option>SIZE</option><option>M</option><option>L</option><option>XL</option>
            </select>
            <input name="color" placeholder="COLOR" className="w-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none" />
          </div>

          <textarea name="address" required placeholder="FULL ADDRESS" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white h-20 outline-none" />

          <select onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none">
            <option value="">PAYMENT GATEWAY</option>
            <option value="Bkash">Bkash</option>
            <option value="Nagad">Nagad</option>
          </select>

          <input name="transactionId" required placeholder="TRANSACTION ID" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none" />
        </div>

        <button disabled={loading} className="w-full mt-6 bg-white text-black font-bold py-3 rounded-lg">
          {loading ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
      </form>
    </div>
  );
}
