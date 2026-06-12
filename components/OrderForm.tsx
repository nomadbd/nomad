'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // ক্যালকুলেশন লজিক
  const price = parseFloat(product.price) || 0;
  const delivery = parseFloat(product.details?.deliveryCharge) || 0;
  const vat = parseFloat(product.details?.vat) || 0;
  const total = price + delivery + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, ...product, paymentMethod }),
      headers: { 'Content-Type': 'application/json' }
    });
    setLoading(false);
    alert("আপনার অর্ডার সফল হয়েছে!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold text-2xl">Confirm Order</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">×</button>
        </div>

        {/* Pricing Summary */}
        <div className="bg-zinc-950 p-4 rounded-xl mb-6 space-y-2 border border-zinc-800">
          <div className="flex justify-between text-zinc-400 text-sm"><span>Price</span><span>৳{price}</span></div>
          {delivery > 0 && <div className="flex justify-between text-zinc-400 text-sm"><span>Delivery</span><span>৳{delivery}</span></div>}
          {vat > 0 && <div className="flex justify-between text-zinc-400 text-sm"><span>VAT</span><span>৳{vat}</span></div>}
          <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-800">
            <span>Total</span><span>৳{total}</span>
          </div>
        </div>

        <div className="space-y-4">
          <input name="name" required placeholder="Full Name" className="w-full bg-zinc-800 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-white" />
          <input name="phone" required placeholder="Phone Number" className="w-full bg-zinc-800 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-white" />
          
          <div className="flex gap-2">
            <select name="size" className="w-1/2 bg-zinc-800 p-4 rounded-xl text-white outline-none">
              <option value="">Size</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
            </select>
            <input name="color" placeholder="Color" className="w-1/2 bg-zinc-800 p-4 rounded-xl text-white outline-none" />
          </div>

          <textarea name="address" required placeholder="Full Delivery Address" className="w-full bg-zinc-800 p-4 rounded-xl text-white h-24 outline-none" />

          <select onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-xl text-white outline-none">
            <option value="">Select Payment Gateway</option>
            <option value="Bkash">Bkash (01521731371)</option>
            <option value="Nagad">Nagad (01521731371)</option>
            <option value="Rocket">Rocket (01521731371)</option>
          </select>

          {paymentMethod && (
            <p className="text-yellow-500 text-xs text-center animate-pulse">
              Please send money to 01521731371 via {paymentMethod}
            </p>
          )}

          <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-zinc-800 p-4 rounded-xl text-white outline-none" />
        </div>

        <button disabled={loading} className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition">
          {loading ? 'Processing...' : 'CONFIRM ORDER'}
        </button>
      </form>
    </div>
  );
}
