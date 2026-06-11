// Path: components/ProductCard.tsx
'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full max-w-lg mx-auto">
      {image && (
        <div className="aspect-square w-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}
          {fullDetails && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: '#a1a1aa', cursor: 'pointer' }}
              className="ml-1 font-medium hover:text-white transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* প্রাইস এবং বাটন সেকশন */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between flex-nowrap">
          
          <span className="text-white font-bold text-lg whitespace-nowrap shrink-0">
            Price : {price} BDT
          </span>
          
          {/* অর্ডার বাটন: বর্ডার আছে, ব্যাকগ্রাউন্ড নেই */}
          <button 
            className="border border-white text-white px-3 py-1 text-xs font-bold transition hover:bg-white hover:text-black rounded"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
