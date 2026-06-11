// Path: components/ProductCard.tsx
'use client'; 

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full max-w-lg mx-auto">
      {/* ইমেজ */}
      {image && (
        <div className="aspect-square w-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* কন্টেন্ট */}
      <div className="p-4 text-white">
        <h3 className="text-lg font-bold">{title}</h3>
        
        {/* বায়ো এবং বিস্তারিত সেকশন */}
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}
          
          {/* See more/less বাটন */}
          {fullDetails && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-zinc-500 hover:text-white font-bold ml-1 transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </button>
          )}
        </p>

        {/* প্রাইস এবং অর্ডার বাটন */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="font-bold text-lg">{price} BDT</span>
          <a 
            href={`https://wa.me/8801521731371?text=Order: ${title}`} 
            className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-zinc-200 transition"
          >
            ORDER NOW
          </a>
        </div>
      </div>
    </div>
  );
}
