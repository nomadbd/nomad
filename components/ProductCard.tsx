'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, fullDetails }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full">
      {/* ইমেজ সেকশন - পুরো উইডথ */}
      {image && (
        <div className="w-full">
          <img src={image} alt={title} className="w-full object-cover" />
        </div>
      )}

      {/* কন্টেন্ট সেকশন */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>

        <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
          {isExpanded ? fullDetails : bio}
          {fullDetails && (
            <span 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: '#71717a' }}
              className="ml-1 cursor-pointer font-medium hover:text-white transition"
            >
              {isExpanded ? ' See less' : '...See more'}
            </span>
          )}
        </p>

        {/* প্রাইস এবং বাটন সেকশন - এক লাইনে */}
        <div className="mt-4 flex items-center justify-between w-full">
          <span className="text-white font-bold text-lg">
            Price: {price} BDT
          </span>
          <button 
            className="border border-white text-white px-5 py-2 text-xs font-bold transition hover:bg-white hover:text-black rounded"
          >
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
