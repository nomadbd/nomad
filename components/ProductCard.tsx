 'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full max-w-sm mx-auto">
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
              className="ml-1 text-zinc-700 cursor-pointer font-medium hover:text-white transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* প্রাইস এবং বাটন সেকশন */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-5">
          
          <span className="text-white font-bold text-sm whitespace-nowrap">
            Price: {price} BDT
          </span>
          
          <button 
            className="border border-white text-white px-3 py-1 text-[10px] font-bold transition hover:bg-white hover:text-black rounded shrink-0"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
