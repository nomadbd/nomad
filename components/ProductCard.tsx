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

      <div className="p-4 text-white">
        <h3 className="text-lg font-bold">{title}</h3>
        
        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}
          
          {fullDetails && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: '#71717a' }} // সরাসরি জিংক-৫০০ এর কোড, যা অবশ্যই ধূসর দেখাবে
              className="cursor-pointer ml-1 select-none font-medium hover:text-zinc-400 transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-lg font-bold text-white">{price} BDT</span>
          <a 
            href={`https://wa.me/8801521731371?text=Order: ${title}`} 
            className="bg-white text-black px-5 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition"
          >
            ORDER NOW
          </a>
        </div>
      </div>
    </div>
  );
}
