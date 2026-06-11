// Path: components/ProductCard.tsx
'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full max-w-lg mx-auto">
      {/* ইমেজ সেকশন */}
      {image && (
        <div className="aspect-square w-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* টেক্সট সেকশন */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}
          {fullDetails && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 text-zinc-400 cursor-pointer font-medium hover:text-white transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* প্রাইস এবং বাটন সেকশন - এখানে নিশ্চিত গ্যাপ দেওয়া হয়েছে */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center w-full">
          
          {/* প্রাইস: বামে থাকবে */}
          <span className="text-white font-bold text-lg whitespace-nowrap">
            Price : {price} BDT
          </span>
          
          {/* এই খালি div-টি মাঝখানের গ্যাপ তৈরি করবে (Spacer) */}
          <div className="flex-grow"></div>
          
          {/* বাটন: ডানে থাকবে */}
          <button 
            className="border-2 border-white text-white px-5 py-2 text-xs font-bold transition hover:bg-white hover:text-black rounded"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
