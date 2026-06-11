'use client';

import { useState } from 'react';

export default function ProductCard({ title, price, bio, image, details }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ডিটেইলস যদি অবজেক্ট না হয়, তবে এরর হ্যান্ডেল করার ব্যবস্থা
  const detailsArray = (details && typeof details === 'object') ? Object.entries(details) : [];

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 w-full overflow-hidden">
      {image && <img src={image} alt={title || "Product"} className="w-full object-cover" />}

      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">{title || "Product Name"}</h3>

        <div className="text-zinc-300 text-sm leading-relaxed">
          {!isExpanded ? (
            <p className="mb-4">
              {bio}{' '}
              <span 
                onClick={() => setIsExpanded(true)} 
                style={{ color: '#71717a', cursor: 'pointer', fontWeight: 500 }}
                className="hover:text-white ml-1"
              >
                ...See more
              </span>
            </p>
          ) : (
            <div className="mt-2 mb-4">
              {/* ডিটেইলস গ্রিড */}
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                {detailsArray.map(([key, value], index) => (
                  <div key={index} className="contents">
                    <span className="font-semibold text-zinc-400">
                      {key}
                    </span>
                    <span className="text-white">
                      : {String(value)}
                    </span>
                  </div>
                ))}
              </div>
              
              <span 
                onClick={() => setIsExpanded(false)} 
                style={{ color: '#71717a', cursor: 'pointer', fontWeight: 500 }}
                className="hover:text-white block mt-2"
              >
                See less
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-white font-bold text-lg">Price: {price || 0} BDT</span>
          
          <button className="border border-white text-white px-4 py-1.5 text-[10px] tracking-widest font-bold uppercase transition-all duration-300 hover:bg-white hover:text-black">
            ORDER NOW
          </button>
        </div>
      </div>
    </div>
  );
}
