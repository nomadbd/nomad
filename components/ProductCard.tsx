// Path: components/ProductCard.tsx
'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  // অর্ডার বাটনের ক্লিক হ্যান্ডলার
  const handleOrder = () => {
    window.location.href = `https://wa.me/8801521731371?text=Order: ${title}`;
  };

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mb-6 w-full">
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

        {/* প্রাইস এবং বাটন সেকশন */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Price : {price} BDT
          </span>
          
          {/* এখানে 'button' ব্যবহার করেছি এবং সরাসরি স্টাইল দিয়েছি */}
          <button 
            onClick={handleOrder}
            className="text-white border border-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-white hover:text-black transition whitespace-nowrap ml-4"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
