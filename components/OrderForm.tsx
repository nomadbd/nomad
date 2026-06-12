'use client';
import { useState } from 'react';

export default function OrderForm({ product, onClose }: { product: any; onClose: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // প্রোডাক্ট আইডি এবং ক্যাটাগরি গ্রাহককে না দেখিয়ে ইমেইলে পাঠানো হচ্ছে
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...data, ...product, paymentMethod: selectedMethod }),
      headers: { 'Content-Type': 'application/json' }
    });
    setLoading(false);
    alert("আপনার অর্ডার সফল হয়েছে!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex justify-center overflow-y-auto p-4">
      <div className="w-full max-w-lg bg-black text-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{product.title}</h2>
          <button onClick={onClose} className="text-zinc-500">CLOSE</button>
        </div>
        <p className="text-2xl font-bold mb-8">{product.price} BDT</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* গ্রাহকের তথ্য */}
          <div className="space-y-4">
            <input name="name" required placeholder="Full Name" className="w-full bg-transparent border-b border-zinc-800 pb-2 outline-none" />
            <input name="phone" required placeholder="Mobile Number (Sender)" className="w-full bg-transparent border-b border-zinc-800 pb-2 outline-none" />
            <textarea name="address" required placeholder="Delivery Address" className="w-full bg-transparent border-b border-zinc-800 pb-2 outline-none h-20" />
          </div>

          {/* প্রডাক্ট ডিটেইলস */}
          <div className="grid grid-cols-2 gap-4">
            <input name="size" placeholder="Size" className="bg-transparent border-b border-zinc-800 pb-2 outline-none" />
            <input name="color" placeholder="Color" className="bg-transparent border-b border-zinc-800 pb-2 outline-none" />
          </div>

          {/* পেমেন্ট সেকশন */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">SELECT PAYMENT METHOD</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['Bkash', 'Nagad', 'Rocket', 'Upay'].map(m => (
                <button type="button" key={m} onClick={() => setSelectedMethod(m)} 
                  className={`py-2 text-xs border ${selectedMethod === m ? 'border-white' : 'border-zinc-800'}`}>
                  {m}
                </button>
              ))}
            </div>
            {selectedMethod && (
              <div className="bg-zinc-900 p-3 text-sm">
                <p>Please send money to: <span className="font-bold">01521731371</span></p>
                <input name="transactionId" required placeholder="Transaction ID" className="w-full bg-transparent border-b border-zinc-700 mt-2 outline-none" />
              </div>
            )}
          </div>

          <button className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest">Confirm Order</button>
        </form>
      </div>
    </div>
  );
}
