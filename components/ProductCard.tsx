// Path: components/ProductCard.tsx
'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full max-w-lg mx-auto">
      {image && (
        <div className="aspect-square w-full">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}

      <div className="p-4 text-white">
        <h3 className="text-lg font-bold">{title}</h3>

        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}

          {fullDetails && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)}
              className="cursor-pointer ml-1 text-zinc-400 font-medium hover:text-white transition-colors select-none"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* Price & Order Button */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between items-center gap-4">
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Price: {price} BDT
          </span>

          <a 
            href={`https://wa.me/8801521731371?text=Order: ${encodeURIComponent(title)}`} 
            className="inline-flex items-center justify-center text-white border border-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-white hover:text-black transition-all whitespace-nowrap active:scale-95"
          >
            ORDER NOW
          </a>
        </div>
      </div>
    </div>
  );
}