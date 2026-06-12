'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  return (
    // 'fixed inset-0 bg-black' দিয়ে ব্যাকগ্রাউন্ড সম্পূর্ণ ব্লক করা হয়েছে
    <div className="fixed inset-0 bg-black z-[100] overflow-y-auto">
      <div className="min-h-screen p-6 md:p-10 max-w-xl mx-auto">
        
        {/* হেডার */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-white text-3xl font-bold tracking-tighter">CHECKOUT</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white uppercase text-xs tracking-widest font-bold">Close</button>
        </div>

        {/* প্রোডাক্ট প্রিভিউ */}
        <div className="mb-10 border-b border-zinc-800 pb-8">
          <h3 className="text-white text-xl font-medium">{product.title}</h3>
          <p className="text-zinc-500 text-sm mt-1">Product ID: {product.id}</p>
          <p className="text-white text-2xl font-bold mt-4">{product.price} BDT</p>
        </div>

        <form className="space-y-6">
          {/* পার্সোনাল ডিটেইলস */}
          <div className="space-y-4">
            <input name="name" required placeholder="Full Name" className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:border-white outline-none transition" />
            <input name="phone" required placeholder="Mobile Number" className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:border-white outline-none transition" />
            <textarea name="address" required placeholder="Delivery Address" className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:border-white outline-none transition h-20" />
          </div>

          {/* প্রডাক্ট ডিটেইলস */}
          <div className="grid grid-cols-2 gap-6">
            <select name="size" className="bg-transparent border-b border-zinc-700 py-3 text-white outline-none">
              <option value="">Size</option><option>M</option><option>L</option><option>XL</option>
            </select>
            <input name="color" placeholder="Color" className="bg-transparent border-b border-zinc-700 py-3 text-white outline-none" />
          </div>

          {/* পেমেন্ট গেটওয়ে */}
          <div className="pt-8">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Select Payment Method</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {['Bkash', 'Nagad', 'Rocket', 'Upay'].map(m => (
                <div key={m} className="border border-zinc-700 p-2 text-center text-xs text-white cursor-pointer hover:border-white">{m}</div>
              ))}
            </div>
            <p className="text-zinc-500 text-sm mb-4">Send Money to: <span className="text-white font-bold">01521731371</span></p>
            <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:border-white outline-none" />
          </div>

          <button className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-zinc-200 transition">
            Confirm Order
          </button>
        </form>
      </div>
    </div>
  );
}
