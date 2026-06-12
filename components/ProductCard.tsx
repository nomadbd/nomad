'use client';
import { useState } from 'react';
import OrderForm from './OrderForm';

export default function ProductCard({ title, price, bio, image, details, id }: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 w-full overflow-hidden mb-8 rounded-xl shadow-lg">
      {/* প্রোডাক্ট ইমেজ */}
      {image && (
        <img 
          src={image} 
          alt={title} 
          className="w-full h-64 object-cover" 
        />
      )}

      <div className="p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          {bio}
          <span 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-white font-bold cursor-pointer ml-1 hover:underline"
          >
            {isExpanded ? ' See less' : ' ...See more'}
          </span>
        </p>

        {/* বিস্তারিত তথ্য */}
        {isExpanded && (
          <div className="mb-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Product Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
              {details && Object.entries(details).map(([key, value]: any, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] text-zinc-600 uppercase">{key}</span>
                  <span className="font-semibold text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
          <span className="text-white font-bold text-xl">{price} BDT</span>
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-white text-black px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all rounded-full"
          >
            ORDER NOW
          </button>
        </div>
      </div>

      {/* অর্ডার মোডাল */}
      {isFormOpen && (
        <OrderForm 
          product={{ title, price, id, details }} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}
