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
              style={{ color: '#a1a1aa', cursor: 'pointer', marginLeft: '4px' }}
              className="font-medium hover:text-white transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* প্রাইস এবং অর্ডার বাটন সেকশন */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-lg font-bold text-white">
            Price : {price} BDT
          </span>
          
          {/* বাটন স্টাইল: হোয়াইট বর্ডার বক্স এবং মার্জিন বামে */}
          <button 
            className="border border-white text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-white hover:text-black transition ml-auto"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
