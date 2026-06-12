'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // details অবজেক্টটি নিরাপদভাবে হ্যান্ডেল করা
  const detailsArray = (details && typeof details === 'object') ? Object.entries(details) : [];

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden mb-8">
      {/* ইমেজ রেন্ডারিং */}
      {image && (
        <img 
          src={image} 
          alt={title} 
          className="w-full object-cover" 
        />
      )}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title || "Product"}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {isExpanded ? (
            <div className="mt-2 mb-4">
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                {detailsArray.map(([key, value], index) => (
                  <div key={index} className="contents">
                    <span className="font-semibold text-zinc-400">{key}</span>
                    <span className="text-white">: {String(value)}</span>
                  </div>
                ))}
              </div>
              <span onClick={() => setIsExpanded(false)} style={{ color: '#71717a', cursor: 'pointer', fontWeight: 500 }} className="block mt-2">See less</span>
            </div>
          ) : (
            <p className="mb-4">
              {bio}{' '}
              <span onClick={() => setIsExpanded(true)} style={{ color: '#71717a', cursor: 'pointer', fontWeight: 500 }}>...See more</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-white font-bold text-lg">Price: {price || 0} BDT</span>
          <button onClick={() => setIsFormOpen(true)} className="border border-white text-white px-4 py-1.5 text-[10px] uppercase font-bold hover:bg-white hover:text-black transition">
            ORDER NOW
          </button>
        </div>
      </div>
      {isFormOpen && <OrderForm title={title} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
