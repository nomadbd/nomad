'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsArray = (details && typeof details === 'object') ? Object.entries(details) : [];

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full mb-10">
      {image && <img src={image} alt={title} className="w-full object-cover" />}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-300 text-sm">{bio}</p>
        
        {isExpanded && (
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-2 text-sm text-zinc-400">
            {detailsArray.map(([k, v]: any) => (
              <><span className="font-bold">{k}</span><span>: {v}</span></>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
          <span className="text-white font-bold">{price} BDT</span>
          <button onClick={() => setIsFormOpen(true)} className="border border-white text-white px-4 py-1.5 text-[10px] uppercase font-bold hover:bg-white hover:text-black">
            Order Now
          </button>
        </div>
      </div>
      {isFormOpen && <OrderForm title={title} id={id} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
