'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsArray = (details && typeof details === 'object') ? Object.entries(details) : [];

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full mb-10 overflow-hidden">
      {image && <img src={image} alt={title} className="w-full object-cover" />}
      
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">
          {bio}
          <span onClick={() => setIsExpanded(!isExpanded)} className="text-zinc-500 cursor-pointer ml-1 font-medium hover:text-white">
            {isExpanded ? ' See less' : ' ...See more'}
          </span>
        </p>
        
        {isExpanded && (
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-2 text-sm text-zinc-400">
            {detailsArray.map(([key, value]: any, i) => (
              <div key={i} className="contents">
                <span className="font-bold text-zinc-400">{key}</span>
                <span className="text-white">: {String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
          <span className="text-white font-bold text-lg">{price} BDT</span>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="border border-white text-white px-6 py-2 uppercase font-bold text-xs hover:bg-white hover:text-black transition"
          >
            ORDER NOW
          </button>
        </div>
      </div>

      {isFormOpen && (
        <OrderForm 
          product={{ title, price, id, details }} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
