'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  // ... বাকি আগের কোড (isExpanded স্টেটসহ) এখানে থাকবে

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {/* ইমেজ, টাইটেল ও ডিটেইলস আগের মতোই রাখুন */}
      
      <div className="p-4 border-t border-zinc-800 flex justify-between items-center">
        <span className="text-white font-bold">Price: {price} BDT</span>
        <button onClick={() => setIsFormOpen(true)} className="border border-white text-white px-4 py-1.5 text-[10px] uppercase font-bold hover:bg-white hover:text-black transition">
          ORDER NOW
        </button>
      </div>

      {isFormOpen && <OrderForm title={title} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
